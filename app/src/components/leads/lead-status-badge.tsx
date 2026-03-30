import type { LeadStatus } from "@prisma/client";
import { LEAD_STATUS_LABELS } from "@/lib/constants";

const tone: Partial<Record<LeadStatus, string>> = {
  NEW: "bg-emerald-100 text-emerald-900",
  INITIAL_ESTIMATION_NEEDS_CLARIFICATION: "bg-amber-100 text-amber-900",
  ASSIGNED_TO_EXECUTOR: "bg-sky-100 text-sky-900",
  IN_DISCUSSION: "bg-indigo-100 text-indigo-900",
  COMPLETED: "bg-teal-100 text-teal-900",
  REJECTED: "bg-red-100 text-red-900",
  POSTPONED: "bg-orange-100 text-orange-900",
};

export function LeadStatusBadge({
  status,
  className = "",
  /** Приглушённый вид (например, неактивный лид в списке — единый серый бейдж). */
  muted = false,
}: {
  status: LeadStatus;
  className?: string;
  muted?: boolean;
}) {
  const cls = muted
    ? "bg-slate-200 text-slate-500"
    : (tone[status] ?? "bg-slate-100 text-slate-800");
  return (
    <span
      className={`inline-flex flex-wrap items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-center text-xs font-medium leading-snug ${cls} ${className}`}
    >
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}
