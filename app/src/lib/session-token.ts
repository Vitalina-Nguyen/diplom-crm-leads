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
  userId: string;
  email: string;
};

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
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
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(sub)) return null;
    return { userId: sub, email };
  } catch {
    return null;
  }
}
