"use server";

import { signIn, signOut } from "@/auth";

export async function signInDemo(demoUser: string) {
  await signIn("demo", { demoUser, redirectTo: "/documents" });
}

export async function signInGithub() {
  await signIn("github", { redirectTo: "/documents" });
}

export async function signInGoogle() {
  await signIn("google", { redirectTo: "/documents" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
