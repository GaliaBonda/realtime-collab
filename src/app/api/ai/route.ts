import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/auth";
import {
  getDocument,
  insertMessage,
  updateDocumentTitle,
} from "@/lib/db";

const TOOL_NAME = "apply_document_action";

type SmartAction = "summarize" | "extract_tasks" | "suggest_title";

const ACTION_PROMPTS: Record<SmartAction, string> = {
  summarize:
    "Summarize the note in 3 short sentences. Put the summary in the summary field.",
  extract_tasks:
    "Extract concrete action items from the note. Put them in the tasks array. If none, return an empty array.",
  suggest_title:
    "Propose a concise title of at most 8 words. Put it in the title field.",
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    documentId?: string;
    documentText?: string;
    message?: string;
    action?: SmartAction;
  };

  if (!body.documentId || !getDocument(body.documentId)) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY is not set. Human chat still works; add a key for streamed replies and smart actions.",
      },
      { status: 503 },
    );
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const documentText = body.documentText?.trim() || "(empty document)";

  if (body.action) {
    const result = await runSmartAction({
      openai,
      action: body.action,
      documentText,
    });

    let content = result.content;
    if (body.action === "suggest_title" && result.title) {
      updateDocumentTitle(body.documentId, result.title);
      content = `Suggested title: ${result.title}`;
    }

    const message = insertMessage({
      id: crypto.randomUUID(),
      documentId: body.documentId,
      userId: "assistant",
      userName: "Smart actions",
      userColor: "#44403c",
      role: "assistant",
      content,
    });

    return NextResponse.json({
      message,
      title: result.title,
      usedTool: TOOL_NAME,
    });
  }

  const userMessage = body.message?.trim();
  if (!userMessage) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    stream: true,
    messages: [
      {
        role: "system",
        content:
          "You are a concise teammate inside a collaborative note. Use the document as context. Keep replies short.",
      },
      {
        role: "user",
        content: `Document:\n${documentText}\n\nQuestion:\n${userMessage}`,
      },
    ],
  });

  let full = "";
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (!delta) continue;
          full += delta;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`),
          );
        }

        const message = insertMessage({
          id: crypto.randomUUID(),
          documentId: body.documentId!,
          userId: "assistant",
          userName: "Smart actions",
          userColor: "#44403c",
          role: "assistant",
          content: full || "(no reply)",
        });

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ done: true, message })}\n\n`,
          ),
        );
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}

async function runSmartAction({
  openai,
  action,
  documentText,
}: {
  openai: OpenAI;
  action: SmartAction;
  documentText: string;
}) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Call apply_document_action with structured results. Do not answer in prose.",
      },
      {
        role: "user",
        content: `${ACTION_PROMPTS[action]}\n\nDocument:\n${documentText}`,
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: TOOL_NAME,
          description: "Return the result of a smart action on a collaborative note.",
          parameters: {
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["summarize", "extract_tasks", "suggest_title"],
              },
              title: { type: "string" },
              summary: { type: "string" },
              tasks: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["action"],
          },
        },
      },
    ],
    tool_choice: {
      type: "function",
      function: { name: TOOL_NAME },
    },
  });

  const call = completion.choices[0]?.message.tool_calls?.[0];
  if (!call || call.type !== "function") {
    throw new Error("Model did not call apply_document_action");
  }

  const parsed = JSON.parse(call.function.arguments) as {
    title?: string;
    summary?: string;
    tasks?: string[];
  };

  if (action === "extract_tasks") {
    const tasks = parsed.tasks ?? [];
    return {
      title: parsed.title,
      content: tasks.length
        ? tasks.map((task) => `• ${task}`).join("\n")
        : "No action items found.",
    };
  }

  if (action === "suggest_title") {
    return {
      title: parsed.title ?? "Untitled note",
      content: parsed.title ?? "Untitled note",
    };
  }

  return {
    title: parsed.title,
    content: parsed.summary ?? "No summary returned.",
  };
}
