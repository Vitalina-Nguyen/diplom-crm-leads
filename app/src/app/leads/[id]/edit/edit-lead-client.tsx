"use client";

import type { LeadPriority, LeadStatus } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addLeadAssignee,
  addLeadContact,
  removeLeadAssignee,
  removeLeadContact,
  updateLead,
  updateLeadPriority,
  updateLeadStatus,
} from "@/lib/actions/leads";
import { CONTACT_SOURCE_TYPES, LEAD_PRIORITY_LABELS, LEAD_STATUS_LABELS } from "@/lib/constants";
import { formatContactChannelType, formatLeadSourceName, ru } from "@/messages/ru";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type LeadPayload = {
  id: string;
  companyName: string;
  contactName: string;
  description: string | null;
  sourceId: string;
  budget: string;
  finishDate: string;
  status: LeadStatus;
  priority: LeadPriority;
  isActive: boolean;
  isFinal: boolean;
  contacts: { id: string; sourceType: string; sourceValue: string }[];
  assignees: { userId: string; fullName: string; email: string }[];
};

type Source = { id: string; name: string };
type UserOpt = { id: string; fullName: string; email: string };

export function EditLeadClient({
  lead,
  sources,
  statusOptions,
  priorityOptions,
  assignableUsers,
}: {
  lead: LeadPayload;
  sources: Source[];
  statusOptions: LeadStatus[];
  priorityOptions: LeadPriority[];
  assignableUsers: UserOpt[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function flash(ok: boolean, text: string) {
    setErr(ok ? null : text);
    setMsg(ok ? text : null);
  }

  const finalHint = ru.editLead.finalStatusHint.replace(
    "{status}",
    LEAD_STATUS_LABELS[lead.status],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{ru.editLead.title}</h1>
          {!lead.isActive ? (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
              {ru.detail.inactive}
            </span>
          ) : null}
        </div>
        <Link href={`/leads/${lead.id}`}>
          <Button type="button" variant="secondary">
            {ru.editLead.back}
          </Button>
        </Link>
      </div>

      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      <Card>
        <form
          className="grid gap-4 md:grid-cols-2"
          action={(fd) => {
            setMsg(null);
            setErr(null);
            fd.set("leadId", lead.id);
            start(async () => {
              const r = await updateLead(fd);
              flash(r.ok, r.ok ? ru.editLead.flashLeadUpdated : r.error);
              if (r.ok) router.refresh();
            });
          }}
        >
          <input type="hidden" name="leadId" value={lead.id} readOnly />
          <Input
            name="companyName"
            label={ru.newLead.companyName}
            required
            defaultValue={lead.companyName}
          />
          <Input
            name="contactName"
            label={ru.newLead.contactName}
            required
            defaultValue={lead.contactName}
          />
          <div className="md:col-span-2">
            <Select name="sourceId" label={ru.newLead.source} required defaultValue={String(lead.sourceId)}>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatLeadSourceName(s.name)}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Textarea
              name="description"
              label={ru.newLead.description}
              defaultValue={lead.description ?? ""}
            />
          </div>
          <Input name="budget" label={ru.newLead.budget} defaultValue={lead.budget} />
          <Input
            name="finishDate"
            type="date"
            label={ru.newLead.finishDate}
            defaultValue={lead.finishDate}
            placeholder={ru.newLead.finishDateHint}
          />
          <div className="md:col-span-2">
            <Button type="submit" disabled={pending}>
              {ru.editLead.saveFields}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardTitle className="mb-4">{ru.editLead.priority}</CardTitle>
        <form
          className="flex max-w-xl flex-col gap-3"
          action={(fd) => {
            setMsg(null);
            setErr(null);
            fd.set("leadId", lead.id);
            start(async () => {
              const r = await updateLeadPriority(fd);
              flash(r.ok, r.ok ? ru.editLead.flashPriorityUpdated : r.error);
              if (r.ok) router.refresh();
            });
          }}
        >
          <input type="hidden" name="leadId" value={lead.id} readOnly />
          <Select
            key={lead.priority}
            name="newPriority"
            label={ru.editLead.priorityField}
            required
            defaultValue={lead.priority}
            placeholderOption={ru.editLead.priorityField}
          >
            {priorityOptions.map((p) => (
              <option key={p} value={p}>
                {LEAD_PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
          <Textarea
            name="comment"
            label={ru.editLead.commentOptional}
            placeholder={ru.editLead.statusCommentPlaceholder}
          />
          <Button type="submit" disabled={pending}>
            {ru.editLead.updatePriority}
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle className="mb-4">{ru.editLead.status}</CardTitle>
        {lead.isFinal ? (
          <p className="text-sm text-slate-600">{finalHint}</p>
        ) : (
          <form
            className="flex max-w-xl flex-col gap-3"
            action={(fd) => {
              setMsg(null);
              setErr(null);
              fd.set("leadId", lead.id);
              start(async () => {
                const r = await updateLeadStatus(fd);
                flash(r.ok, r.ok ? ru.editLead.flashStatusUpdated : r.error);
                if (r.ok) router.refresh();
              });
            }}
          >
            <input type="hidden" name="leadId" value={lead.id} readOnly />
            <Select
              key={lead.status}
              name="newStatus"
              label={ru.editLead.newStatus}
              required
              defaultValue={lead.status}
              placeholderOption={ru.editLead.newStatus}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {LEAD_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
            <Textarea
              name="comment"
              label={ru.editLead.commentOptional}
              placeholder={ru.editLead.statusCommentPlaceholder}
            />
            <Button type="submit" disabled={pending}>
              {ru.editLead.updateStatus}
            </Button>
          </form>
        )}
      </Card>

      <Card>
        <CardTitle className="mb-4">{ru.editLead.contacts}</CardTitle>
        <div className="space-y-4">
          {lead.contacts.length === 0 ? (
            <p className="text-sm text-slate-500">{ru.editLead.noContacts}</p>
          ) : (
            <ul className="space-y-2">
              {lead.contacts.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium normal-case">
                      {formatContactChannelType(c.sourceType)}
                    </span>
                    : {c.sourceValue}
                  </span>
                  <form
                    action={(fd) => {
                      setMsg(null);
                      setErr(null);
                      fd.set("leadId", lead.id);
                      fd.set("contactId", String(c.id));
                      start(async () => {
                        const r = await removeLeadContact(fd);
                        flash(r.ok, r.ok ? ru.editLead.flashContactRemoved : r.error);
                        if (r.ok) router.refresh();
                      });
                    }}
                  >
                    <input type="hidden" name="leadId" value={lead.id} readOnly />
                    <input type="hidden" name="contactId" value={c.id} readOnly />
                    <Button type="submit" variant="danger" className="!px-2 !py-1 text-xs">
                      {ru.common.remove}
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <form
            className="grid gap-3 md:grid-cols-3"
            action={(fd) => {
              setMsg(null);
              setErr(null);
              fd.set("leadId", lead.id);
              start(async () => {
                const r = await addLeadContact(fd);
                flash(r.ok, r.ok ? ru.editLead.flashContactAdded : r.error);
                if (r.ok) router.refresh();
              });
            }}
          >
            <input type="hidden" name="leadId" value={lead.id} readOnly />
            <Select
              name="sourceType"
              label={ru.editLead.type}
              required
              defaultValue="EMAIL"
              className="normal-case"
            >
              {CONTACT_SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {formatContactChannelType(t)}
                </option>
              ))}
            </Select>
            <Input
              name="sourceValue"
              label={ru.editLead.value}
              required
              className="md:col-span-2"
            />
            <div className="md:col-span-3">
              <Button type="submit" variant="secondary" disabled={pending}>
                {ru.editLead.addContact}
              </Button>
            </div>
          </form>
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-4">{ru.editLead.assignees}</CardTitle>
        <div className="space-y-4">
          {lead.assignees.length === 0 ? (
            <p className="text-sm text-slate-500">{ru.editLead.noAssignees}</p>
          ) : (
            <ul className="space-y-3">
              {lead.assignees.map((a) => (
                <li key={a.userId} className="rounded-md border border-slate-200 p-3">
                  <div className="mb-2 text-sm font-medium text-slate-900">
                    {a.fullName}{" "}
                    <span className="font-normal text-slate-500">({a.email})</span>
                  </div>
                  <form
                    className="flex flex-col gap-2"
                    action={(fd) => {
                      setMsg(null);
                      setErr(null);
                      fd.set("leadId", lead.id);
                      fd.set("userId", a.userId);
                      start(async () => {
                        const r = await removeLeadAssignee(fd);
                        flash(r.ok, r.ok ? ru.editLead.flashAssigneeRemoved : r.error);
                        if (r.ok) router.refresh();
                      });
                    }}
                  >
                    <input type="hidden" name="leadId" value={lead.id} readOnly />
                    <input type="hidden" name="userId" value={a.userId} readOnly />
                    <Textarea
                      name="comment"
                      label={ru.editLead.commentOptional}
                      placeholder={ru.editLead.unassignCommentPlaceholder}
                      className="min-h-[64px]"
                    />
                    <Button type="submit" variant="danger" className="w-fit !px-2 !py-1 text-xs">
                      {ru.editLead.removeAssignee}
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-lg border border-dashed border-slate-300 p-4">
            <Label className="mb-2 block">{ru.editLead.addAssignee}</Label>
            {assignableUsers.length === 0 ? (
              <p className="text-sm text-slate-500">{ru.editLead.allAssigned}</p>
            ) : (
              <form
                className="flex max-w-xl flex-col gap-2"
                action={(fd) => {
                  setMsg(null);
                  setErr(null);
                  fd.set("leadId", lead.id);
                  start(async () => {
                    const r = await addLeadAssignee(fd);
                    flash(r.ok, r.ok ? ru.editLead.flashAssigneeAdded : r.error);
                    if (r.ok) router.refresh();
                  });
                }}
              >
                <input type="hidden" name="leadId" value={lead.id} readOnly />
                <Select name="userId" label={ru.editLead.userField} required defaultValue="">
                  <option value="" disabled>
                    {ru.editLead.selectUser}
                  </option>
                  {assignableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
                </Select>
                <Textarea
                  name="comment"
                  label={ru.editLead.commentOptional}
                  placeholder={ru.editLead.statusCommentPlaceholder}
                  className="min-h-[64px]"
                />
                <Button type="submit" variant="secondary" disabled={pending}>
                  {ru.editLead.addAssignee}
                </Button>
              </form>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
