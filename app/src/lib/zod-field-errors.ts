import type { ZodError } from "zod";

/** Первый сегмент path Zod → сообщение (для привязки к name полей формы). */
export function fieldErrorsFromZodError(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const seg = issue.path[0];
    const key = typeof seg === "string" ? seg : "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
