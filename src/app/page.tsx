import Link from "next/link";
import { auth } from "@/auth";

const STACK = [
  "Next.js",
  "TypeScript",
  "Tiptap",
  "Yjs",
  "Hocuspocus",
  "Zustand",
  "TanStack Query",
  "TanStack Virtual",
  "Tailwind",
  "OAuth 2.0",
  "OpenAI streaming",
];

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
      <p className="text-xs tracking-[0.2em] text-teal-900 uppercase">
        Portfolio demo
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-900">
        Realtime Collab
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-7 text-stone-600">
        Multiplayer notes and chat. Two browsers, two demo users, one Yjs
        document. Carets merge live. Chat is virtualized. Smart actions call
        OpenAI tools.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {STACK.map((item) => (
          <span
            key={item}
            className="rounded-full border border-stone-400/70 px-3 py-1 text-xs text-stone-700"
          >
            {item}
          </span>
        ))}
      </div>
      <ol className="mt-8 space-y-2 text-sm text-stone-600">
        <li>1. Sign in as Ada Lovelace in this window.</li>
        <li>2. Sign in as Beau Wright in another window.</li>
        <li>3. Open the same note. Type. Watch the other caret.</li>
      </ol>
      <div className="mt-10 flex gap-3">
        <Link
          href={session ? "/documents" : "/login"}
          className="rounded-md bg-teal-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-900"
        >
          {session ? "Open notes" : "Sign in"}
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-stone-400 px-5 py-2.5 text-sm text-stone-800 hover:bg-white"
        >
          Switch user
        </Link>
      </div>
    </main>
  );
}
