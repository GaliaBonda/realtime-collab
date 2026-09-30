# Realtime Collab

Portfolio demo of a multiplayer notes app: Tiptap + Yjs over Hocuspocus, presence carets, virtualized chat, OAuth, and streamed OpenAI smart actions.

This is a sanitized stand-in for NDA collaboration work — generic notes and chat, not a client product.

## Stack

| Area | What you will see |
| --- | --- |
| App | Next.js App Router, TypeScript, Tailwind |
| Editor | Tiptap, Yjs CRDT, Hocuspocus WebSocket server, live carets |
| State | Zustand (chat panel), TanStack Query (notes + messages) |
| Chat | TanStack Virtual list, OpenAI streaming, function-calling tools |
| Auth | Auth.js — demo users, GitHub, Google OAuth 2.0 |
| Data | SQLite for notes/chat, SQLite for Yjs persistence |

## Run locally

```bash
pnpm install
cp .env.example .env.local   # already filled with AUTH_SECRET if you cloned this tree
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

`pnpm dev` starts two processes:

- Next.js on port 3000
- Hocuspocus on `ws://127.0.0.1:1234`

## Two-browser demo (no OAuth apps needed)

1. Window A → Sign in as **Ada Lovelace**
2. Window B → Sign in as **Beau Wright** (use a private window)
3. Create a note in one window, open the same note in the other
4. Type in both. Carets and selections should merge live

## Optional env

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | Required. Signs Auth.js sessions and collab WebSocket tokens |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | Enables “Continue with GitHub”. Callback: `http://localhost:3000/api/auth/callback/github` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Enables “Continue with Google”. Callback: `http://localhost:3000/api/auth/callback/google` |
| `OPENAI_API_KEY` | Streamed chat replies + Summarize / Extract tasks / Suggest title |
| `NEXT_PUBLIC_COLLAB_URL` | WebSocket URL (default `ws://127.0.0.1:1234`) |

Human-to-human chat still stores messages without an OpenAI key. Smart actions and streamed assistant replies need the key.

## What to review

- `src/components/editor/collab-editor.tsx` — Tiptap + Yjs + presence
- `server/hocuspocus.ts` — collab server, JWT auth, SQLite persistence
- `src/components/chat/chat-panel.tsx` — TanStack Virtual + smart actions
- `src/app/api/ai/route.ts` — streaming completions and `apply_document_action`
- `src/auth.ts` — demo users + GitHub/Google OAuth
