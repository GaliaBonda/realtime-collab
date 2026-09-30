import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createDocument, listDocuments } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ documents: listDocuments() });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { title?: string };
  const document = createDocument({
    id: crypto.randomUUID(),
    title: body.title?.trim() || "Untitled note",
    ownerId: session.user.id,
    ownerName: session.user.name ?? "Someone",
  });

  return NextResponse.json({ document }, { status: 201 });
}
