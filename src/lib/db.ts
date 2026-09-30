import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export type DocumentRow = {
  id: string;
  title: string;
  owner_id: string;
  owner_name: string;
  created_at: number;
  updated_at: number;
};

export type MessageRow = {
  id: string;
  document_id: string;
  user_id: string;
  user_name: string;
  user_color: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: number;
};

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "app.sqlite"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled',
    owner_id TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_color TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS messages_document_idx
    ON messages (document_id, created_at);
`);

export function listDocuments() {
  return db
    .prepare(
      `SELECT * FROM documents ORDER BY updated_at DESC`,
    )
    .all() as DocumentRow[];
}

export function getDocument(id: string) {
  return db
    .prepare(`SELECT * FROM documents WHERE id = ?`)
    .get(id) as DocumentRow | undefined;
}

export function createDocument(input: {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
}) {
  const now = Date.now();
  db.prepare(
    `INSERT INTO documents (id, title, owner_id, owner_name, created_at, updated_at)
     VALUES (@id, @title, @ownerId, @ownerName, @now, @now)`,
  ).run({ ...input, now });
  return getDocument(input.id)!;
}

export function updateDocumentTitle(id: string, title: string) {
  db.prepare(
    `UPDATE documents SET title = ?, updated_at = ? WHERE id = ?`,
  ).run(title, Date.now(), id);
  return getDocument(id);
}

export function touchDocument(id: string) {
  db.prepare(`UPDATE documents SET updated_at = ? WHERE id = ?`).run(
    Date.now(),
    id,
  );
}

export function listMessages(documentId: string) {
  return db
    .prepare(
      `SELECT * FROM messages WHERE document_id = ? ORDER BY created_at ASC`,
    )
    .all(documentId) as MessageRow[];
}

export function insertMessage(input: {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userColor: string;
  role: MessageRow["role"];
  content: string;
}) {
  const createdAt = Date.now();
  db.prepare(
    `INSERT INTO messages (
      id, document_id, user_id, user_name, user_color, role, content, created_at
    ) VALUES (
      @id, @documentId, @userId, @userName, @userColor, @role, @content, @createdAt
    )`,
  ).run({ ...input, createdAt });
  touchDocument(input.documentId);
  return db
    .prepare(`SELECT * FROM messages WHERE id = ?`)
    .get(input.id) as MessageRow;
}
