import { SignJWT, jwtVerify } from "jose";

export type CollabTokenPayload = {
  sub: string;
  name: string;
  color: string;
  documentId: string;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function mintCollabToken(payload: CollabTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secretKey());
}

export async function verifyCollabToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey());
  const documentId = payload.documentId;
  const sub = payload.sub;
  const name = payload.name;
  const color = payload.color;

  if (
    typeof documentId !== "string" ||
    typeof sub !== "string" ||
    typeof name !== "string" ||
    typeof color !== "string"
  ) {
    throw new Error("Invalid collab token");
  }

  return { sub, name, color, documentId };
}
