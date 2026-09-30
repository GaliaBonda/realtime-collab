import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signOutAction } from "@/app/login/actions";
import { auth } from "@/auth";

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-stone-300/80 px-6 py-3">
        <Link href="/documents" className="text-sm font-medium tracking-tight">
          Realtime Collab
        </Link>
        <div className="flex items-center gap-3">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: session.user.color }}
          />
          <span className="text-sm text-stone-700">
            {session.user.name}
          </span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-xs text-stone-500 hover:text-stone-900"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
