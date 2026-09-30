import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { colorFromId } from "@/lib/colors";
import { getDemoUser } from "@/lib/demo-users";

const githubEnabled = Boolean(
  process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET,
);
const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      id: "demo",
      name: "Demo",
      credentials: {
        demoUser: { label: "Demo user", type: "text" },
      },
      authorize: ({ demoUser }) => {
        if (typeof demoUser !== "string") return null;
        const user = getDemoUser(demoUser);
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          color: user.color,
        };
      },
    }),
    ...(githubEnabled ? [GitHub] : []),
    ...(googleEnabled ? [Google] : []),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.color = user.color ?? colorFromId(user.id ?? token.sub ?? "anon");
      }
      if (!token.color && token.sub) {
        token.color = colorFromId(token.sub);
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id ?? token.sub ?? "anon";
      session.user.color = token.color ?? colorFromId(session.user.id);
      return session;
    },
  },
});
