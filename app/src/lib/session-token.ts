import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "crm_session";

function getSecretKey(): Uint8Array {
  const s = process.env.AUTH_SECRET ?? "";
  if (s.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(s);
}

export { COOKIE_NAME };

export type SessionPayload = {
  userId: number;
  email: string;
};

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.userId))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function readSessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const sub = payload.sub;
    const email = payload.email;
    if (typeof sub !== "string" || typeof email !== "string") return null;
    const userId = Number(sub);
    if (!Number.isFinite(userId)) return null;
    return { userId, email };
  } catch {
    return null;
  }
}
