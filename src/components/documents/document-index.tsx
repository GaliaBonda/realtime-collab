"use client";

import { useRouter } from "next/navigation";
import { useCreateDocument, useDocuments } from "@/hooks/use-documents";

export function DocumentIndex() {
  const router = useRouter();
  const { data: documents, isLoading } = useDocuments();
  const createDocument = useCreateDocument();

  async function handleCreate() {
    const document = await createDocument.mutateAsync("Untitled note");
    router.push(`/documents/${document.id}`);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            Notes
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Each note is a Yjs document synced over WebSockets. Open one as Ada
            and Beau at the same time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={createDocument.isPending}
          className="rounded-md bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-50"
        >
          New note
        </button>
      </div>
      {isLoading ? (
        <p className="text-sm text-stone-500">Loading notes…</p>
      ) : documents?.length ? (
        <ul className="divide-y divide-stone-300/80 border-y border-stone-300/80">
          {documents.map((document) => (
            <li key={document.id}>
              <button
                type="button"
                onClick={() => router.push(`/documents/${document.id}`)}
                className="flex w-full items-baseline justify-between gap-4 py-4 text-left hover:text-teal-900"
              >
                <span className="font-medium text-stone-900">
                  {document.title}
                </span>
                <span className="text-xs text-stone-500">
                  {document.owner_name} ·{" "}
                  {new Date(document.updated_at).toLocaleString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-stone-500">
          No notes yet. Create one, then open it in two browsers.
        </p>
      )}
    </div>
  );
}
