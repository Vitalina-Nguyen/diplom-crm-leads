/** Подписи ролей из БД (seed: Admin, Member). */
export const ROLE_DISPLAY_LABELS: Record<string, string> = {
  Admin: "Администратор",
  Member: "Сотрудник",
};

export function formatRoleName(name: string): string {
  return ROLE_DISPLAY_LABELS[name] ?? name;
}
