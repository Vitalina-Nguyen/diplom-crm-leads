import type { Prisma } from "@prisma/client";

export const LEAD_SORT_COLUMNS = [
  "company",
  "contact",
  "source",
  "status",
  "priority",
  "budget",
  "updated",
] as const;

export type LeadSortColumn = (typeof LEAD_SORT_COLUMNS)[number];

export type LeadSortDir = "asc" | "desc";

function firstString(v: string | string[] | undefined): string {
  if (v === undefined) return "";
  return typeof v === "string" ? v : v[0] ?? "";
}

/** По умолчанию: статус по возрастанию (в PostgreSQL enum «Новый» идёт первым). */
export function parseLeadsListSearchParams(
  sp: Record<string, string | string[] | undefined>,
): { q: string; sort: LeadSortColumn; dir: LeadSortDir } {
  const q = firstString(sp.q);
  const sortRaw = firstString(sp.sort) || "status";
  const dirRaw = firstString(sp.dir) || "asc";
  const sort = (LEAD_SORT_COLUMNS as readonly string[]).includes(sortRaw)
    ? (sortRaw as LeadSortColumn)
    : "status";
  const dir: LeadSortDir = dirRaw === "asc" || dirRaw === "desc" ? dirRaw : "asc";
  return { q, sort, dir };
}

export function leadsListHref(q: string, sort: LeadSortColumn, dir: LeadSortDir): string {
  const p = new URLSearchParams();
  const t = q.trim();
  if (t) p.set("q", t);
  p.set("sort", sort);
  p.set("dir", dir);
  return `/leads?${p.toString()}`;
}

export function nextSortAfterHeaderClick(
  current: { sort: LeadSortColumn; dir: LeadSortDir },
  column: LeadSortColumn,
): { sort: LeadSortColumn; dir: LeadSortDir } {
  if (current.sort !== column) {
    const descFirst = column === "updated" || column === "budget";
    return { sort: column, dir: descFirst ? "desc" : "asc" };
  }
  return { sort: column, dir: current.dir === "asc" ? "desc" : "asc" };
}

export function buildLeadsWhere(qTrimmed: string): Prisma.LeadWhereInput | undefined {
  if (!qTrimmed) return undefined;
  return {
    OR: [
      { companyName: { contains: qTrimmed, mode: "insensitive" } },
      { contactName: { contains: qTrimmed, mode: "insensitive" } },
      { source: { name: { contains: qTrimmed, mode: "insensitive" } } },
    ],
  };
}

function buildSecondaryOrderBy(
  sort: LeadSortColumn,
  dir: LeadSortDir,
): Prisma.LeadOrderByWithRelationInput {
  switch (sort) {
    case "company":
      return { companyName: dir };
    case "contact":
      return { contactName: dir };
    case "source":
      return { source: { name: dir } };
    case "status":
      return { status: dir };
    case "priority":
      return { priority: dir };
    case "budget":
      return { budget: dir };
    case "updated":
      return { updatedAt: dir };
  }
}

/**
 * Сначала активные (`isActive: true`), неактивные внизу; затем выбранная пользователем сортировка.
 */
export function buildLeadsOrderByClause(
  sort: LeadSortColumn,
  dir: LeadSortDir,
): Prisma.LeadOrderByWithRelationInput[] {
  return [{ isActive: "desc" }, buildSecondaryOrderBy(sort, dir)];
}
