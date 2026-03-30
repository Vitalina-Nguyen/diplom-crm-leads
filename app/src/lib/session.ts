import { cookies } from "next/headers";
import { COOKIE_NAME, readSessionToken, type SessionPayload } from "@/lib/session-token";

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return readSessionToken(raw);
}

export async function requireSession(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) throw new Error("Unauthorized");
  return s;
}
