import Link from "next/link";
import {
  leadsListHref,
  nextSortAfterHeaderClick,
  type LeadSortColumn,
  type LeadSortDir,
} from "@/lib/leads-list-params";
import { Th } from "@/components/ui/table";

type Props = {
  column: LeadSortColumn;
  label: string;
  currentSort: LeadSortColumn;
  currentDir: LeadSortDir;
  q: string;
  /** Заголовок и ссылка по центру (колонка «Статус»). */
  alignCenter?: boolean;
};

export function LeadsSortTh({
  column,
  label,
  currentSort,
  currentDir,
  q,
  alignCenter = false,
}: Props) {
  const next = nextSortAfterHeaderClick({ sort: currentSort, dir: currentDir }, column);
  const href = leadsListHref(q, next.sort, next.dir);
  const active = currentSort === column;

  return (
    <Th className={alignCenter ? "text-center" : "text-left"}>
      <Link
        href={href}
        className={`inline-flex items-center gap-1 hover:text-slate-900 ${alignCenter ? "w-full justify-center" : ""} ${active ? "text-slate-900" : ""}`}
        scroll={false}
      >
        {label}
        {active ? (
          <span className="text-xs font-normal text-slate-500" aria-hidden>
            {currentDir === "asc" ? "↑" : "↓"}
          </span>
        ) : null}
      </Link>
    </Th>
  );
}
