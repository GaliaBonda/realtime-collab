export const DEMO_USERS = [
  {
    id: "demo-ada",
    key: "ada",
    name: "Ada Lovelace",
    email: "ada@demo.local",
    color: "#0f766e",
    blurb: "Open the same note as Beau in another browser to see live carets.",
  },
  {
    id: "demo-beau",
    key: "beau",
    name: "Beau Wright",
    email: "beau@demo.local",
    color: "#b45309",
    blurb: "Second seat for the CRDT demo. No OAuth app required.",
  },
] as const;

export type DemoUserKey = (typeof DEMO_USERS)[number]["key"];

export function getDemoUser(key: string) {
  return DEMO_USERS.find((user) => user.key === key) ?? null;
}
