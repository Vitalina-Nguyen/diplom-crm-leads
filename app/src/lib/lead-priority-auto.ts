import type { LeadPriority, Prisma } from "@prisma/client";

/** Разница в календарных днях (UTC): `to` минус `from` (может быть отрицательной, если срок прошёл). */
function utcCalendarDayDiff(from: Date, to: Date): number {
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((b - a) / 86_400_000);
}

function budgetToNumber(budget: Prisma.Decimal | null): number | null {
  if (budget == null) return null;
  const n = Number(budget.toString());
  return Number.isFinite(n) ? n : null;
}

/**
 * Автоприоритет только при создании лида:
 * - Высокий: сумма > 10 000 USD **или** срок в пределах 7 календарных дней (включая сегодня и просрочку).
 * - Средний: иначе, если срок строго позже 7 и не позже 14 дней **и** сумма от 5 000 до 10 000 включительно.
 * - Низкий: все остальные случаи.
 */
export function resolveAutoLeadPriority(
  budget: Prisma.Decimal | null,
  finishDate: Date | null,
  now: Date = new Date(),
): LeadPriority {
  const sum = budgetToNumber(budget);
  const daysUntil = finishDate != null ? utcCalendarDayDiff(now, finishDate) : null;

  if (sum != null && sum > 10_000) return "HIGH";
  if (daysUntil != null && daysUntil <= 7) return "HIGH";

  if (
    daysUntil != null &&
    daysUntil > 7 &&
    daysUntil <= 14 &&
    sum != null &&
    sum >= 5000 &&
    sum <= 10_000
  ) {
    return "MEDIUM";
  }

  return "LOW";
}
