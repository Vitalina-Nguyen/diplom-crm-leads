/** Базовые источники лидов: сид создаёт эти строки (актуальные имена в БД). */
/** У `Other` в UI подпись «Другое» (`formatLeadSourceName`). */
export const DEFAULT_LEAD_SOURCE_NAMES = ["Вебсайт", "Рекомендация", "Other"] as const;

export type DefaultLeadSourceName = (typeof DEFAULT_LEAD_SOURCE_NAMES)[number];

/**
 * Нормализованные ключи (`trim` + lower case + схлопывание пробелов).
 * Старые БД могли получить из сида `Referral` / `Website` / `Other` — в UI они
 * показываются как «Рекомендация» / «Сайт» / «Другое», но `name` в таблице остаётся латиницей.
 */
const PROTECTED_LEAD_SOURCE_NAME_SET = new Set([
  "вебсайт",
  "website",
  "рекомендация",
  "referral",
  "other",
  "другое",
]);

export function isProtectedLeadSourceName(name: string): boolean {
  const key = name.trim().toLowerCase().replace(/\s+/g, " ");
  return PROTECTED_LEAD_SOURCE_NAME_SET.has(key);
}
