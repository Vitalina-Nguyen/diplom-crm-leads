import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { Button } from "@/components/ui/button";
import { ru } from "@/messages/ru";
import { IngestTokensAdmin } from "./ingest-tokens-admin";

export default async function IngestTokensPage() {
  await requireAdmin();

  const [tokens, sources] = await Promise.all([
    prisma.leadIngestToken.findMany({
      orderBy: { createdAt: "desc" },
      include: { source: { select: { id: true, name: true } } },
    }),
    prisma.leadSource.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const rows = tokens.map((t) => ({
    id: t.id,
    displayName: t.displayName,
    tokenPreview: t.tokenPreview,
    createdAt: t.createdAt.toISOString(),
    source: t.source,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">{ru.ingestTokens.pageTitle}</h1>
        <Link href="/leads">
          <Button type="button" variant="secondary">
            {ru.ingestTokens.backToLeads}
          </Button>
        </Link>
      </div>
      <IngestTokensAdmin tokens={rows} sources={sources} />
    </div>
  );
}
