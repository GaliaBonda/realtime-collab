"use client";

import {
  HocuspocusProviderWebsocketComponent,
  HocuspocusRoom,
} from "@hocuspocus/provider-react";
import type { Editor } from "@tiptap/react";
import { useRef, useState } from "react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { CollabEditor } from "@/components/editor/collab-editor";
import { PresenceBar } from "@/components/presence/presence-bar";
import { useRenameDocument } from "@/hooks/use-documents";
import { useUiStore } from "@/store/ui-store";

type WorkspaceProps = {
  documentId: string;
  initialTitle: string;
  collabToken: string;
  collabUrl: string;
  user: {
    name: string;
    color: string;
  };
};

export function DocumentWorkspace({
  documentId,
  initialTitle,
  collabToken,
  collabUrl,
  user,
}: WorkspaceProps) {
  const [title, setTitle] = useState(initialTitle);
  const editorRef = useRef<Editor | null>(null);
  const rename = useRenameDocument(documentId);
  const toggleChat = useUiStore((state) => state.toggleChat);
  const chatOpen = useUiStore((state) => state.chatOpen);

  return (
    <HocuspocusProviderWebsocketComponent url={collabUrl}>
      <HocuspocusRoom name={documentId} token={collabToken}>
        <div className="flex min-h-0 flex-1">
          <section className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between gap-4 border-b border-stone-300/80 px-6 py-3">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={() => {
                  const next = title.trim() || "Untitled note";
                  setTitle(next);
                  rename.mutate(next);
                }}
                className="min-w-0 flex-1 bg-transparent text-lg font-medium tracking-tight text-stone-900 outline-none"
              />
              <PresenceBar />
              <button
                type="button"
                onClick={toggleChat}
                className="rounded-md border border-stone-400/80 px-3 py-1.5 text-xs text-stone-700 hover:bg-white"
              >
                {chatOpen ? "Hide chat" : "Show chat"}
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8">
              <CollabEditor user={user} editorRef={editorRef} />
            </div>
          </section>
          <ChatPanel
            documentId={documentId}
            documentText={() => editorRef.current?.getText() ?? ""}
            onTitleFromAi={setTitle}
          />
        </div>
      </HocuspocusRoom>
    </HocuspocusProviderWebsocketComponent>
  );
}
