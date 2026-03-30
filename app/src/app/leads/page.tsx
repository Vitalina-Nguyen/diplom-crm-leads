import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LeadsSortTh } from "@/components/leads/leads-sort-th";
import { formatLeadSourceName, ru } from "@/messages/ru";
import { LeadPriorityBadge } from "@/components/leads/lead-priority-badge";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { DeleteLeadButton } from "@/components/leads/delete-lead-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/table";
import {
  buildLeadsOrderByClause,
  buildLeadsWhere,
  leadsListHref,
  parseLeadsListSearchParams,
} from "@/lib/leads-list-params";

function formatBudget(value: { toString(): string } | null | undefined): string {
  if (value == null) return ru.common.emDash;
  const n = Number(value.toString());
  if (Number.isNaN(n)) return value.toString();
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "USD" }).format(n);
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { q, sort, dir } = parseLeadsListSearchParams(sp);
  const qTrim = q.trim();
  const where = buildLeadsWhere(qTrim);
  const orderBy = buildLeadsOrderByClause(sort, dir);

  const leads = await prisma.lead.findMany({
    ...(where ? { where } : {}),
    orderBy,
    include: { source: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{ru.leads.title}</h1>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <form method="GET" action="/leads" className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="dir" value={dir} />
            <div className="w-full min-w-[18rem] max-w-lg sm:w-auto">
              <Input
                type="search"
                name="q"
                label={ru.leads.searchLabel}
                defaultValue={q}
                placeholder={ru.leads.searchPlaceholder}
                className="w-full min-w-0"
              />
            </div>
            <Button type="submit">{ru.leads.searchSubmit}</Button>
            {qTrim ? (
              <Link
                href={leadsListHref("", sort, dir)}
                className="pb-2 text-sm text-slate-600 hover:text-slate-900"
              >
                {ru.leads.searchClear}
              </Link>
            ) : null}
          </form>
          <Link href="/leads/new">
            <Button type="button">{ru.leads.newLead}</Button>
          </Link>
        </div>
      </div>

      <Table>
        <thead>
          <tr>
            <LeadsSortTh
              column="company"
              label={ru.leads.colCompany}
              currentSort={sort}
              currentDir={dir}
              q={q}
            />
            <LeadsSortTh
              column="contact"
              label={ru.leads.colContact}
              currentSort={sort}
              currentDir={dir}
              q={q}
            />
            <LeadsSortTh
              column="source"
              label={ru.leads.colSource}
              currentSort={sort}
              currentDir={dir}
              q={q}
            />
            <LeadsSortTh
              column="status"
              label={ru.leads.colStatus}
              currentSort={sort}
              currentDir={dir}
              q={q}
              alignCenter
            />
            <LeadsSortTh
              column="priority"
              label={ru.leads.colPriority}
              currentSort={sort}
              currentDir={dir}
              q={q}
              alignCenter
            />
            <LeadsSortTh
              column="budget"
              label={ru.leads.colBudget}
              currentSort={sort}
              currentDir={dir}
              q={q}
            />
            <Th className="w-[220px]">{ru.leads.colActions}</Th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 ? (
            <tr>
              <Td colSpan={7} className="py-8 text-center text-slate-500">
                {qTrim ? ru.leads.emptySearch : ru.leads.empty}
              </Td>
            </tr>
          ) : (
            leads.map((lead) => (
              <tr
                key={lead.id}
                data-inactive={lead.isActive ? undefined : ""}
                className={
                  lead.isActive ? "" : "[&>td:not(:last-child)]:!text-slate-400"
                }
              >
                <Td className="font-medium">{lead.companyName}</Td>
                <Td>{lead.contactName}</Td>
                <Td>{formatLeadSourceName(lead.source.name)}</Td>
                <Td className="align-middle">
                  <div className="flex min-h-[2.75rem] w-full flex-col items-center justify-center gap-1 text-center">
                    <LeadStatusBadge
                      status={lead.status}
                      muted={!lead.isActive}
                      className="max-w-full justify-center text-center"
                    />
                  </div>
                </Td>
                <Td className="align-middle">
                  <div className="flex min-h-[2.75rem] w-full flex-col items-center justify-center gap-1 text-center">
                    <LeadPriorityBadge
                      priority={lead.priority}
                      muted={!lead.isActive}
                      className="max-w-full justify-center text-center"
                    />
                  </div>
                </Td>
                <Td>{formatBudget(lead.budget)}</Td>
                <Td className="text-slate-800">
                  <div className="flex flex-row flex-nowrap items-center justify-end gap-2">
                    <Link href={`/leads/${lead.id}`}>
                      <Button variant="secondary" className="!px-2 !py-1 text-xs">
                        {ru.common.view}
                      </Button>
                    </Link>
                    {lead.isActive ? (
                      <>
                        <Link href={`/leads/${lead.id}/edit`}>
                          <Button variant="secondary" className="!px-2 !py-1 text-xs">
                            {ru.common.edit}
                          </Button>
                        </Link>
                        <DeleteLeadButton leadId={lead.id} />
                      </>
                    ) : null}
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}
