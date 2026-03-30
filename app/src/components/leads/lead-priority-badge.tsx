import type { LeadPriority } from "@prisma/client";
import { LEAD_PRIORITY_LABELS } from "@/lib/constants";

const tone: Record<LeadPriority, string> = {
  LOW: "bg-slate-100 text-slate-800",
  MEDIUM: "bg-amber-100 text-amber-900",
  HIGH: "bg-red-100 text-red-900",
};

export function LeadPriorityBadge({
  priority,
  className = "",
  muted = false,
}: {
  priority: LeadPriority;
  className?: string;
  muted?: boolean;
}) {
  const cls = muted ? "bg-slate-200 text-slate-500" : tone[priority];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-center text-xs font-medium leading-snug ${cls} ${className}`}
    >
      {LEAD_PRIORITY_LABELS[priority]}
    </span>
  );
}
