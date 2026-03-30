"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createIngestTokenAction, revokeIngestTokenAction } from "@/lib/actions/ingest-tokens";
import { formatLeadSourceName, ru } from "@/messages/ru";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, Td, Th } from "@/components/ui/table";
type SourceOpt = { id: string; name: string };
type TokenRow = {
  id: string;
  displayName: string;
  tokenPreview: string;
  createdAt: string;
  source: SourceOpt;
};

function formatDt(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function IngestTokensAdmin({
  tokens,
  sources,
}: {
  tokens: TokenRow[];
  sources: SourceOpt[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [plainToken, setPlainToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sourceMode, setSourceMode] = useState<"existing" | "new">(() =>
    sources.length === 0 ? "new" : "existing",
  );

  return (
    <div className="space-y-8">
      {plainToken ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardTitle className="mb-2 text-amber-950">{ru.ingestTokens.plainTokenTitle}</CardTitle>
          <p className="mb-3 text-sm text-amber-900">{ru.ingestTokens.plainTokenHint}</p>
          <pre className="mb-3 overflow-x-auto rounded-md border border-amber-200 bg-white p-3 text-xs break-all text-slate-900">
            {plainToken}
          </pre>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(plainToken);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  alert(plainToken);
                }
              }}
            >
              {copied ? ru.ingestTokens.copied : ru.ingestTokens.copyToken}
            </Button>
            <Button type="button" onClick={() => setPlainToken(null)}>
              {ru.ingestTokens.dismissPlain}
            </Button>
          </div>
        </Card>
      ) : null}

      <Card>
        <CardTitle className="mb-4">{ru.ingestTokens.createTitle}</CardTitle>
        <form
          className="flex max-w-xl flex-col gap-4"
          action={(fd) => {
            setError(null);
            fd.set("sourceMode", sourceMode);
            start(async () => {
              const r = await createIngestTokenAction(fd);
              if (!r.ok) {
                setError(r.error);
                return;
              }
              setPlainToken(r.plainToken);
              router.refresh();
            });
          }}
        >
          <Input
            name="displayName"
            label={ru.ingestTokens.displayNameLabel}
            required
            placeholder={ru.ingestTokens.displayNameHint}
          />

          <fieldset className="flex flex-col gap-2 rounded-md border border-slate-200 p-3">
            <legend className="px-1 text-sm font-medium text-slate-700">{ru.newLead.source}</legend>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="sourceModeRadio"
                className="cursor-pointer"
                checked={sourceMode === "existing"}
                onChange={() => setSourceMode("existing")}
              />
              {ru.ingestTokens.sourceExisting}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="sourceModeRadio"
                className="cursor-pointer"
                checked={sourceMode === "new"}
                onChange={() => setSourceMode("new")}
              />
              {ru.ingestTokens.sourceNew}
            </label>
          </fieldset>

          {sourceMode === "existing" ? (
            sources.length > 0 ? (
              <Select
                name="sourceId"
                label={ru.newLead.source}
                required
                defaultValue={String(sources[0].id)}
              >
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatLeadSourceName(s.name)}
                  </option>
                ))}
              </Select>
            ) : (
              <p className="text-sm text-amber-800">{ru.ingestTokens.noSourcesPickNew}</p>
            )
          ) : (
            <Input name="newSourceName" label={ru.ingestTokens.newSourceName} required />
          )}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button
            type="submit"
            disabled={pending || (sourceMode === "existing" && sources.length === 0)}
          >
            {pending ? ru.common.saving : ru.ingestTokens.create}
          </Button>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">{ru.ingestTokens.listTitle}</h2>
        <Table>
          <thead>
            <tr>
              <Th>{ru.ingestTokens.colDisplayName}</Th>
              <Th>{ru.ingestTokens.colSource}</Th>
              <Th>{ru.ingestTokens.colToken}</Th>
              <Th>{ru.ingestTokens.colCreated}</Th>
              <Th className="w-[140px]">{ru.ingestTokens.colActions}</Th>
            </tr>
          </thead>
          <tbody>
            {tokens.length === 0 ? (
              <tr>
                <Td colSpan={5} className="py-8 text-center text-slate-500">
                  {ru.ingestTokens.empty}
                </Td>
              </tr>
            ) : (
              tokens.map((t) => (
                <tr key={t.id}>
                  <Td className="font-medium">{t.displayName}</Td>
                  <Td>{formatLeadSourceName(t.source.name)}</Td>
                  <Td>
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{t.tokenPreview}</code>
                  </Td>
                  <Td className="text-slate-600">{formatDt(t.createdAt)}</Td>
                  <Td>
                    <Button
                      type="button"
                      variant="danger"
                      className="!px-2 !py-1 text-xs"
                      disabled={pending}
                      onClick={() => {
                        if (!window.confirm(ru.ingestTokens.revokeConfirm)) return;
                        start(async () => {
                          const r = await revokeIngestTokenAction(t.id);
                          if (!r.ok) {
                            alert(r.error);
                            return;
                          }
                          router.refresh();
                        });
                      }}
                    >
                      {ru.ingestTokens.revoke}
                    </Button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
