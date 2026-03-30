"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createLead } from "@/lib/actions/leads";
import { CONTACT_SOURCE_TYPES, LEAD_PRIORITY_LABELS } from "@/lib/constants";
import { LeadPriority } from "@prisma/client";
import { formatContactChannelType, formatLeadSourceName, ru } from "@/messages/ru";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Source = { id: string; name: string };
type UserOpt = { id: string; fullName: string; email: string };

type ContactRow = { sourceType: string; sourceValue: string };

export function NewLeadForm({ sources, users }: { sources: Source[]; users: UserOpt[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [useAutoPriority, setUseAutoPriority] = useState(true);

  const contactsJson = useMemo(
    () =>
      JSON.stringify(
        contacts.filter((c) => c.sourceType.trim() !== "" && c.sourceValue.trim() !== ""),
      ),
    [contacts],
  );

  return (
    <Card>
      <CardTitle className="mb-6">{ru.newLead.title}</CardTitle>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          setFieldErrors({});
          const fd = new FormData(e.currentTarget);
          start(async () => {
            const res = await createLead(fd);
            if (!res.ok) {
              setError(res.error);
              setFieldErrors(res.fieldErrors ?? {});
              return;
            }
            router.push("/leads");
            router.refresh();
          });
        }}
      >
        <input type="hidden" name="contactsJson" value={contactsJson} readOnly />
        <input type="hidden" name="useAutoPriority" value={useAutoPriority ? "1" : "0"} readOnly />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            name="companyName"
            label={ru.newLead.companyName}
            required
            error={fieldErrors.companyName}
          />
          <Input
            name="contactName"
            label={ru.newLead.contactName}
            required
            error={fieldErrors.contactName}
          />
        </div>

        <Select
          name="sourceId"
          label={ru.newLead.source}
          required
          defaultValue=""
          placeholderOption={ru.newLead.selectSource}
          error={fieldErrors.sourceId}
        >
          <option value="" disabled>
            {ru.newLead.selectSource}
          </option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {formatLeadSourceName(s.name)}
            </option>
          ))}
        </Select>

        <Textarea
          name="description"
          label={ru.newLead.description}
          error={fieldErrors.description}
        />
        <Input
          name="budget"
          label={ru.newLead.budget}
          placeholder={ru.newLead.budgetPlaceholder}
          required
          error={fieldErrors.budget}
        />
        <Input
          name="finishDate"
          type="date"
          label={ru.newLead.finishDate}
          placeholder={ru.newLead.finishDateHint}
          error={fieldErrors.finishDate}
        />

        <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-800">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 cursor-pointer rounded border-slate-300"
              checked={useAutoPriority}
              onChange={(e) => setUseAutoPriority(e.target.checked)}
            />
            <span>
              <span className="font-medium">{ru.newLead.autoPriority}</span>
              <span className="mt-1 block text-xs font-normal text-slate-600">
                {ru.newLead.autoPriorityHint}
              </span>
            </span>
          </label>
        </div>

        {!useAutoPriority ? (
          <Select
            name="priority"
            label={ru.newLead.priority}
            required
            defaultValue={LeadPriority.MEDIUM}
            error={fieldErrors.priority}
          >
            {(Object.values(LeadPriority) as LeadPriority[]).map((p) => (
              <option key={p} value={p}>
                {LEAD_PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
        ) : null}

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <Label className="mb-2 block">{ru.newLead.assigneesOptional}</Label>
          <select
            name="assigneeIds"
            multiple
            title={ru.newLead.assigneesOptional}
            aria-invalid={fieldErrors.assigneeIds ? true : undefined}
            className={`min-h-[120px] w-full cursor-pointer rounded-md border bg-white px-3 py-2 text-sm disabled:cursor-not-allowed ${
              fieldErrors.assigneeIds
                ? "border-red-500 ring-2 ring-red-500"
                : "border-slate-300"
            }`}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName} ({u.email})
              </option>
            ))}
          </select>
          {fieldErrors.assigneeIds ? (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.assigneeIds}</p>
          ) : null}
          <p className="mt-1 text-xs text-slate-500">{ru.newLead.multiSelectHint}</p>
        </div>

        <div
          className={`rounded-lg border p-4 ${
            fieldErrors.contacts || fieldErrors.contactsJson ? "border-red-300 bg-red-50/50" : "border-slate-200"
          }`}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <Label>{ru.newLead.contactsOptional}</Label>
            <Button
              type="button"
              variant="secondary"
              className="!px-2 !py-1 text-xs"
              onClick={() => setContacts((c) => [...c, { sourceType: "EMAIL", sourceValue: "" }])}
            >
              {ru.common.addRow}
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {contacts.map((row, idx) => (
              <div key={idx} className="grid gap-2 md:grid-cols-[140px_1fr_auto]">
                <select
                  title={ru.editLead.type}
                  className="cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-2 text-sm disabled:cursor-not-allowed"
                  value={row.sourceType}
                  onChange={(e) => {
                    const v = e.target.value;
                    setContacts((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, sourceType: v } : r)),
                    );
                  }}
                >
                  {CONTACT_SOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {formatContactChannelType(t)}
                    </option>
                  ))}
                </select>
                <input
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400"
                  placeholder={ru.common.valuePlaceholder}
                  value={row.sourceValue}
                  onChange={(e) => {
                    const v = e.target.value;
                    setContacts((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, sourceValue: v } : r)),
                    );
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-600"
                  onClick={() => setContacts((prev) => prev.filter((_, i) => i !== idx))}
                >
                  {ru.common.remove}
                </Button>
              </div>
            ))}
          </div>
          {fieldErrors.contacts || fieldErrors.contactsJson ? (
            <p className="mt-2 text-sm text-red-600">
              {fieldErrors.contacts ?? fieldErrors.contactsJson}
            </p>
          ) : null}
        </div>

        {error && Object.keys(fieldErrors).length === 0 ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? ru.common.saving : ru.newLead.create}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            {ru.common.cancel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
