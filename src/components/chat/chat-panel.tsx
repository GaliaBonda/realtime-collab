"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";
import type { MessageRow } from "@/lib/db";
import { useMessages, useRenameDocument, useSendMessage } from "@/hooks/use-documents";
import { useUiStore } from "@/store/ui-store";

const ACTIONS = [
  { id: "summarize", label: "Summarize" },
  { id: "extract_tasks", label: "Extract tasks" },
  { id: "suggest_title", label: "Suggest title" },
] as const;

type ChatPanelProps = {
  documentId: string;
  documentText: () => string;
  onTitleFromAi?: (title: string) => void;
};

export function ChatPanel({
  documentId,
  documentText,
  onTitleFromAi,
}: ChatPanelProps) {
  const chatOpen = useUiStore((state) => state.chatOpen);
  const queryClient = useQueryClient();
  const { data: messages = [] } = useMessages(documentId);
  const sendMessage = useSendMessage(documentId);
  const rename = useRenameDocument(documentId);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  // TanStack Virtual returns unstable function identities; skip React Compiler memoization.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88,
    overscan: 8,
  });

  useEffect(() => {
    if (messages.length === 0) return;
    virtualizer.scrollToIndex(messages.length - 1, { align: "end" });
  }, [messages.length, streaming, virtualizer]);

  async function refreshMessages() {
    await queryClient.invalidateQueries({ queryKey: ["messages", documentId] });
  }

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || busy) return;
    setDraft("");
    setError(null);
    setBusy(true);
    try {
      await sendMessage.mutateAsync(content);
      await streamAssistant(content);
      await refreshMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send");
    } finally {
      setBusy(false);
      setStreaming("");
    }
  }

  async function streamAssistant(message: string) {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId,
        documentText: documentText(),
        message,
      }),
    });

    if (response.status === 503) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "OpenAI is not configured.");
      return;
    }

    if (!response.ok || !response.body) {
      throw new Error("Assistant request failed");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let assembled = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const event of events) {
        const line = event.replace(/^data: /, "");
        if (!line) continue;
        const payload = JSON.parse(line) as { delta?: string };
        if (payload.delta) {
          assembled += payload.delta;
          setStreaming(assembled);
        }
      }
    }
  }

  async function runAction(action: (typeof ACTIONS)[number]["id"]) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          documentText: documentText(),
          action,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        title?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Smart action failed");
        return;
      }
      if (data.title) {
        rename.mutate(data.title);
        onTitleFromAi?.(data.title);
      }
      await refreshMessages();
    } finally {
      setBusy(false);
    }
  }

  if (!chatOpen) return null;

  return (
    <aside className="flex h-full w-[22rem] shrink-0 flex-col border-l border-stone-300/70 bg-[#efe8dc]">
      <div className="border-b border-stone-300/70 px-4 py-3">
        <p className="text-sm font-medium text-stone-900">Chat</p>
        <p className="text-xs text-stone-500">
          Virtualized history. Smart actions use OpenAI function calling.
        </p>
      </div>
      <div className="flex gap-2 overflow-x-auto px-3 py-2">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            disabled={busy}
            onClick={() => void runAction(action.id)}
            className="shrink-0 rounded-full border border-stone-400/70 px-3 py-1 text-xs text-stone-700 hover:bg-white disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>
      <div ref={parentRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((item) => {
            const message = messages[item.index];
            return (
              <div
                key={message.id}
                data-index={item.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full pb-3"
                style={{ transform: `translateY(${item.start}px)` }}
              >
                <ChatBubble message={message} />
              </div>
            );
          })}
        </div>
        {streaming ? (
          <div className="mt-2 rounded-lg bg-white/80 p-3 text-sm text-stone-700">
            {streaming}
          </div>
        ) : null}
      </div>
      {error ? (
        <p className="px-4 pb-2 text-xs text-rose-800">{error}</p>
      ) : null}
      <form
        onSubmit={(event) => void handleSend(event)}
        className="border-t border-stone-300/70 p-3"
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          placeholder="Ask about this note…"
          className="w-full resize-none rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-teal-800"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          className="mt-2 w-full rounded-md bg-teal-800 px-3 py-2 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-50"
        >
          {busy ? "Working…" : "Send"}
        </button>
      </form>
    </aside>
  );
}

function ChatBubble({ message }: { message: MessageRow }) {
  const isAssistant = message.role === "assistant";
  return (
    <div className="rounded-lg bg-white/80 p-3">
      <div className="mb-1 flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: message.user_color }}
        />
        <span className="text-xs font-medium text-stone-700">
          {isAssistant ? "Smart actions" : message.user_name}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-5 text-stone-800">
        {message.content}
      </p>
    </div>
  );
}
