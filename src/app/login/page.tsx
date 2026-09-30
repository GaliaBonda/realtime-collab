import {
  signInDemo,
  signInGithub,
  signInGoogle,
  signOutAction,
} from "@/app/login/actions";
import { auth } from "@/auth";
import { DEMO_USERS } from "@/lib/demo-users";

export default async function LoginPage() {
  const session = await auth();

  const githubReady = Boolean(
    process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET,
  );
  const googleReady = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
      {session?.user ? (
        <div className="mt-4 text-sm text-stone-600">
          Signed in as {session.user.name}. Pick a demo user to switch, or{" "}
          <form action={signOutAction} className="inline">
            <button type="submit" className="underline">
              sign out
            </button>
          </form>
          .
        </div>
      ) : null}
      <div className="mt-8 grid gap-3">
        {DEMO_USERS.map((user) => (
          <form key={user.key} action={signInDemo.bind(null, user.key)}>
            <button
              type="submit"
              className="flex w-full items-start gap-3 rounded-lg border border-stone-400/80 bg-white/70 px-4 py-3 text-left hover:border-teal-800"
            >
              <span
                className="mt-0.5 h-8 w-8 shrink-0 rounded-full"
                style={{ backgroundColor: user.color }}
              />
              <span>
                <span className="block font-medium text-stone-900">
                  Continue as {user.name}
                </span>
                <span className="mt-0.5 block text-xs text-stone-500">
                  {user.blurb}
                </span>
              </span>
            </button>
          </form>
        ))}
      </div>
      <div className="mt-8 grid gap-2">
        <form action={signInGithub}>
          <button
            type="submit"
            disabled={!githubReady}
            className="w-full rounded-md border border-stone-400 px-4 py-2 text-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue with GitHub
          </button>
        </form>
        <form action={signInGoogle}>
          <button
            type="submit"
            disabled={!googleReady}
            className="w-full rounded-md border border-stone-400 px-4 py-2 text-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </main>
  );
}
