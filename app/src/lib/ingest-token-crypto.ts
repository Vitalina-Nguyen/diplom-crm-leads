import { createHash, randomBytes } from "node:crypto";

/** Секрет для передачи клиенту один раз (64 hex-символа). */
export function generateIngestTokenPlain(): string {
  return randomBytes(32).toString("hex");
}

export function hashIngestToken(plain: string): string {
  return createHash("sha256").update(plain, "utf8").digest("hex");
}

/** Формат в БД и в списке: `xx...yy` (первые 2 и последние 2 символа полного токена). */
export function buildTokenPreview(plain: string): string {
  const p = plain.trim();
  if (p.length <= 4) return "…";
  return `${p.slice(0, 2)}...${p.slice(-2)}`;
}
