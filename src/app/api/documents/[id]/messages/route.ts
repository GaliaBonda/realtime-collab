import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDocument, insertMessage, listMessages } from "@/lib/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!getDocument(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ messages: listMessages(id) });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!getDocument(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as { content?: string };
  const content = body.content?.trim();
  if (!content) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const message = insertMessage({
    id: crypto.randomUUID(),
    documentId: id,
    userId: session.user.id,
    userName: session.user.name ?? "Someone",
    userColor: session.user.color,
    role: "user",
    content,
  });

  return NextResponse.json({ message }, { status: 201 });
}
