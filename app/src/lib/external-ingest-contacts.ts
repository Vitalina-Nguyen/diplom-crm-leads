import { CONTACT_SOURCE_TYPES } from "@/lib/constants";

const KNOWN_SOURCE_TYPES = new Set<string>(
  CONTACT_SOURCE_TYPES.filter((t) => t !== "OTHER"),
);

/**
 * Ключ из внешнего API (email, Telegram, …) приводится к каналу из системы.
 * Неизвестный ключ → OTHER, в sourceValue всегда «${type}: ${value}» (исходная подпись типа).
 */
export function mapExternalContactKeyToRow(keyRaw: string, valueRaw: string): {
  sourceType: string;
  sourceValue: string;
} {
  const type = keyRaw.trim();
  const value = valueRaw.trim();
  const compact = type.toUpperCase().replace(/[\s_-]+/g, "");

  if (compact && KNOWN_SOURCE_TYPES.has(compact)) {
    return { sourceType: compact, sourceValue: value };
  }

  const sourceValue = type ? `${type}: ${value}` : value;
  return {
    sourceType: "OTHER",
    sourceValue,
  };
}
