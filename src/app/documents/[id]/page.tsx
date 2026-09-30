import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { mintCollabToken } from "@/lib/collab-token";
import { getDocument } from "@/lib/db";
import { DocumentWorkspace } from "@/components/workspace/document-workspace";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const document = getDocument(id);
  if (!document) {
    notFound();
  }

  const collabToken = await mintCollabToken({
    sub: session.user.id,
    name: session.user.name ?? "Someone",
    color: session.user.color,
    documentId: document.id,
  });

  return (
    <DocumentWorkspace
      documentId={document.id}
      initialTitle={document.title}
      collabToken={collabToken}
      collabUrl={process.env.NEXT_PUBLIC_COLLAB_URL ?? "ws://127.0.0.1:1234"}
      user={{
        name: session.user.name ?? "Someone",
        color: session.user.color,
      }}
    />
  );
}
