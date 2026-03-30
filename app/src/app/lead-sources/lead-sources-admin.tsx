"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createLeadSourceAdmin, deleteLeadSourceAdmin } from "@/lib/actions/lead-sources";
import { isProtectedLeadSourceName } from "@/lib/lead-sources";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/table";
import { formatLeadSourceName, ru } from "@/messages/ru";

type Row = { id: string; name: string };

export function LeadSourcesAdmin({ sources }: { sources: Row[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <Card>
        <CardTitle className="mb-4">{ru.leadSources.addTitle}</CardTitle>
        <form
          className="flex max-w-xl flex-col gap-4"
          action={(fd) => {
            setMsg(null);
            setErr(null);
            start(async () => {
              const r = await createLeadSourceAdmin(fd);
              if (r.ok) {
                setMsg(ru.leadSources.flashCreated);
                router.refresh();
              } else {
                setErr(r.error);
              }
            });
          }}
        >
          <Input name="name" label={ru.leadSources.nameLabel} required maxLength={120} />

          {err ? <p className="text-sm text-red-600">{err}</p> : null}

          <Button type="submit" disabled={pending}>
            {pending ? ru.common.saving : ru.leadSources.create}
          </Button>
        </form>
      </Card>

      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">{ru.leadSources.listTitle}</h2>
        <Table>
          <thead>
            <tr>
              <Th>{ru.leadSources.colName}</Th>
              <Th className="w-[140px] text-right">{ru.leadSources.colActions}</Th>
            </tr>
          </thead>
          <tbody>
            {sources.length === 0 ? (
              <tr>
                <Td colSpan={2} className="py-8 text-center text-slate-500">
                  {ru.leadSources.emptyList}
                </Td>
              </tr>
            ) : (
              sources.map((s) => {
                const locked = isProtectedLeadSourceName(s.name);
                return (
                  <tr key={s.id}>
                    <Td className="font-medium text-slate-900">
                      {formatLeadSourceName(s.name)}
                    </Td>
                    <Td className="text-right">
                      {!locked ? (
                        <Button
                          type="button"
                          variant="danger"
                          className="!px-2 !py-1 text-xs"
                          disabled={pending}
                          onClick={() => {
                            setMsg(null);
                            setErr(null);
                            if (!confirm(ru.leadSources.deleteConfirm)) return;
                            start(async () => {
                              const r = await deleteLeadSourceAdmin(s.id);
                              if (r.ok) {
                                setMsg(ru.leadSources.flashDeleted);
                                router.refresh();
                              } else {
                                setErr(r.error);
                                alert(r.error);
                              }
                            });
                          }}
                        >
                          {ru.common.delete}
                        </Button>
                      ) : (
                        <span className="text-slate-400">{ru.common.emDash}</span>
                      )}
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
