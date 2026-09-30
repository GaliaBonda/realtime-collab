"use client";

import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useHocuspocusProvider } from "@hocuspocus/provider-react";
import { useEffect, type MutableRefObject } from "react";

type CollabEditorProps = {
  user: {
    name: string;
    color: string;
  };
  editorRef: MutableRefObject<Editor | null>;
};

export function CollabEditor({ user, editorRef }: CollabEditorProps) {
  const provider = useHocuspocusProvider();

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          undoRedo: false,
        }),
        Placeholder.configure({
          placeholder:
            "Start writing. Open this note as Beau in another window to see live carets.",
        }),
        Collaboration.configure({
          document: provider.document,
        }),
        CollaborationCaret.configure({
          provider,
          user,
        }),
      ],
    },
    [provider, user.name, user.color],
  );

  useEffect(() => {
    editorRef.current = editor;
    return () => {
      editorRef.current = null;
    };
  }, [editor, editorRef]);

  return <EditorContent editor={editor} className="collab-editor" />;
}
