import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { Button } from "@/components/ui/button";
import { ru } from "@/messages/ru";
import { LeadSourcesAdmin } from "./lead-sources-admin";

export default async function LeadSourcesPage() {
  await requireAdmin();

  const sources = await prisma.leadSource.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">{ru.leadSources.pageTitle}</h1>
        <Link href="/leads">
          <Button type="button" variant="secondary">
            {ru.leadSources.backToLeads}
          </Button>
        </Link>
      </div>
      <LeadSourcesAdmin sources={sources} />
    </div>
  );
}
