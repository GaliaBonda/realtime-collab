import { Server } from "@hocuspocus/server";
import { SQLite } from "@hocuspocus/extension-sqlite";
import path from "node:path";
import fs from "node:fs";
import { verifyCollabToken } from "../src/lib/collab-token";

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadLocalEnv();

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const port = Number(process.env.COLLAB_PORT ?? 1234);

const server = new Server({
  name: "realtime-collab",
  port,
  extensions: [
    new SQLite({
      database: path.join(dataDir, "collab.sqlite"),
    }),
  ],
  async onAuthenticate({ token, documentName }) {
    if (!token) {
      throw new Error("Missing collab token");
    }

    const payload = await verifyCollabToken(token);
    if (payload.documentId !== documentName) {
      throw new Error("Token is not valid for this document");
    }

    return {
      user: {
        id: payload.sub,
        name: payload.name,
        color: payload.color,
      },
    };
  },
});

async function main() {
  await server.listen();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
