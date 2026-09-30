import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DocumentRow, MessageRow } from "@/lib/db";

async function parseJson<T>(response: Response) {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const data = await parseJson<{ documents: DocumentRow[] }>(
        await fetch("/api/documents"),
      );
      return data.documents;
    },
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title?: string) => {
      const data = await parseJson<{ document: DocumentRow }>(
        await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        }),
      );
      return data.document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useRenameDocument(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const data = await parseJson<{ document: DocumentRow }>(
        await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        }),
      );
      return data.document;
    },
    onSuccess: (document) => {
      queryClient.setQueryData(["document", documentId], document);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useMessages(documentId: string) {
  return useQuery({
    queryKey: ["messages", documentId],
    queryFn: async () => {
      const data = await parseJson<{ messages: MessageRow[] }>(
        await fetch(`/api/documents/${documentId}/messages`),
      );
      return data.messages;
    },
  });
}

export function useSendMessage(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const data = await parseJson<{ message: MessageRow }>(
        await fetch(`/api/documents/${documentId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }),
      );
      return data.message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", documentId] });
    },
  });
}
