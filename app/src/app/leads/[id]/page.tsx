import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LEAD_PRIORITY_LABELS, LEAD_STATUS_LABELS } from "@/lib/constants";
import {
  assignmentActionLabels,
  formatContactChannelType,
  formatLeadSourceName,
  ru,
} from "@/messages/ru";
import { LeadPriorityBadge } from "@/components/leads/lead-priority-badge";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { ReactivateLeadButton } from "@/components/leads/reactivate-lead-button";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";

function formatMoney(value: { toString(): string } | null | undefined): string {
  if (value == null) return ru.common.emDash;
  const n = Number(value.toString());
  if (Number.isNaN(n)) return value.toString();
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "USD" }).format(n);
}

function formatDt(d: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function formatDateOnly(d: Date): string {
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(d);
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      source: true,
      createdBy: { include: { role: true } },
      contacts: { orderBy: { id: "asc" } },
      assignees: { include: { user: true } },
      statusHistory: {
        orderBy: { changedAt: "desc" },
        include: { changedBy: true },
      },
      priorityHistory: {
        orderBy: { changedAt: "desc" },
        include: { changedBy: true },
      },
      assignmentHistory: {
        orderBy: { createdAt: "desc" },
        include: { user: true },
      },
    },
  });

  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1
              className={`text-2xl font-semibold ${lead.isActive ? "text-slate-900" : "text-slate-500"}`}
            >
              {lead.companyName} - {LEAD_STATUS_LABELS[lead.status]}
            </h1>
            {!lead.isActive ? (
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                {ru.detail.inactive}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!lead.isActive ? <ReactivateLeadButton leadId={lead.id} compact={false} /> : null}
          {lead.isActive ? (
            <Link href={`/leads/${lead.id}/edit`}>
              <Button type="button">{ru.detail.edit}</Button>
            </Link>
          ) : null}
        </div>
      </div>

      <Card>
        <CardTitle className="mb-4">{ru.detail.overview}</CardTitle>
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-slate-500">{ru.detail.contactName}</dt>
            <dd className="font-medium text-slate-900">{lead.contactName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{ru.detail.status}</dt>
            <dd>
              <LeadStatusBadge status={lead.status} />
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">{ru.detail.priority}</dt>
            <dd>
              <LeadPriorityBadge priority={lead.priority} />
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">{ru.detail.source}</dt>
            <dd className="font-medium text-slate-900">{formatLeadSourceName(lead.source.name)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{ru.detail.budget}</dt>
            <dd className="font-medium text-slate-900">{formatMoney(lead.budget)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{ru.detail.finishDate}</dt>
            <dd className="font-medium text-slate-900">
              {lead.finishDate ? formatDateOnly(lead.finishDate) : ru.common.emDash}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">{ru.detail.createdBy}</dt>
            <dd className="font-medium text-slate-900">
              {lead.createdBy.fullName} ({lead.createdBy.email})
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">{ru.detail.updated}</dt>
            <dd className="text-slate-800">{formatDt(lead.updatedAt)}</dd>
          </div>
        </dl>
        <div className="mt-6 border-t border-slate-200 pt-4">
          <div className="text-sm font-medium text-slate-500">{ru.detail.description}</div>
          <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">
            {lead.description?.trim() ? lead.description : ru.common.emDash}
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-4">{ru.detail.contacts}</CardTitle>
        {lead.contacts.length === 0 ? (
          <p className="text-sm text-slate-500">{ru.detail.noContacts}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{ru.detail.colType}</Th>
                <Th>{ru.detail.colValue}</Th>
                <Th>{ru.detail.colUpdated}</Th>
              </tr>
            </thead>
            <tbody>
              {lead.contacts.map((c) => (
                <tr key={c.id}>
                  <Td className="normal-case">{formatContactChannelType(c.sourceType)}</Td>
                  <Td>{c.sourceValue}</Td>
                  <Td>{formatDt(c.updatedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card>
        <CardTitle className="mb-4">{ru.detail.assignees}</CardTitle>
        {lead.assignees.length === 0 ? (
          <p className="text-sm text-slate-500">{ru.detail.noAssignees}</p>
        ) : (
          <ul className="list-inside list-disc text-sm text-slate-800">
            {lead.assignees.map((a) => (
              <li key={a.id}>
                {a.user.fullName} ({a.user.email})
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle className="mb-4">{ru.detail.statusHistory}</CardTitle>
        <Table>
          <thead>
            <tr>
              <Th>{ru.detail.colWhen}</Th>
              <Th>{ru.detail.colFrom}</Th>
              <Th>{ru.detail.colTo}</Th>
              <Th>{ru.detail.colBy}</Th>
              <Th>{ru.detail.colComment}</Th>
            </tr>
          </thead>
          <tbody>
            {lead.statusHistory.map((h) => (
              <tr key={h.id}>
                <Td>{formatDt(h.changedAt)}</Td>
                <Td>
                  {h.previousStatus ? LEAD_STATUS_LABELS[h.previousStatus] : ru.common.emDash}
                </Td>
                <Td>{LEAD_STATUS_LABELS[h.newStatus]}</Td>
                <Td>
                  {h.changedBy.fullName}
                  <span className="block text-xs text-slate-500">{h.changedBy.email}</span>
                </Td>
                <Td className="max-w-xs whitespace-pre-wrap">
                  {h.comment || ru.common.emDash}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card>
        <CardTitle className="mb-4">{ru.detail.priorityHistory}</CardTitle>
        <Table>
          <thead>
            <tr>
              <Th>{ru.detail.colWhen}</Th>
              <Th>{ru.detail.colFrom}</Th>
              <Th>{ru.detail.colTo}</Th>
              <Th>{ru.detail.colBy}</Th>
              <Th>{ru.detail.colComment}</Th>
            </tr>
          </thead>
          <tbody>
            {lead.priorityHistory.map((h) => (
              <tr key={h.id}>
                <Td>{formatDt(h.changedAt)}</Td>
                <Td>
                  {h.previousPriority ? LEAD_PRIORITY_LABELS[h.previousPriority] : ru.common.emDash}
                </Td>
                <Td>{LEAD_PRIORITY_LABELS[h.newPriority]}</Td>
                <Td>
                  {h.changedBy.fullName}
                  <span className="block text-xs text-slate-500">{h.changedBy.email}</span>
                </Td>
                <Td className="max-w-xs whitespace-pre-wrap">
                  {h.comment || ru.common.emDash}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card>
        <CardTitle className="mb-4">{ru.detail.assignmentHistory}</CardTitle>
        <Table>
          <thead>
            <tr>
              <Th>{ru.detail.colWhen}</Th>
              <Th>{ru.detail.colAction}</Th>
              <Th>{ru.detail.colUser}</Th>
              <Th>{ru.detail.colComment}</Th>
            </tr>
          </thead>
          <tbody>
            {lead.assignmentHistory.map((h) => (
              <tr key={h.id}>
                <Td>{formatDt(h.createdAt)}</Td>
                <Td>{assignmentActionLabels[h.action]}</Td>
                <Td>
                  {h.user.fullName}
                  <span className="block text-xs text-slate-500">{h.user.email}</span>
                </Td>
                <Td className="max-w-xs whitespace-pre-wrap">
                  {h.comment || ru.common.emDash}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
