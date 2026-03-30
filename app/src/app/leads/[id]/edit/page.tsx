import { notFound, redirect } from "next/navigation";
import { LeadPriority, LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isFinalLeadStatus } from "@/lib/lead-status";
import { EditLeadClient } from "./edit-lead-client";

function toDateInputValue(d: Date | null): string {
  if (!d) return "";
  const x = new Date(d);
  const y = x.getUTCFullYear();
  const m = String(x.getUTCMonth() + 1).padStart(2, "0");
  const day = String(x.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      source: true,
      contacts: { orderBy: { id: "asc" } },
      assignees: { include: { user: true } },
    },
  });
  if (!lead) notFound();
  if (!lead.isActive) {
    redirect(`/leads/${id}`);
  }

  const [sources, users] = await Promise.all([
    prisma.leadSource.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, email: true },
    }),
  ]);

  const statusOptions = Object.values(LeadStatus);
  const priorityOptions = Object.values(LeadPriority);
  const assignedIds = new Set(lead.assignees.map((a) => a.userId));

  return (
    <EditLeadClient
      lead={{
        id: lead.id,
        companyName: lead.companyName,
        contactName: lead.contactName,
        description: lead.description,
        sourceId: lead.sourceId,
        budget: lead.budget?.toString() ?? "",
        finishDate: toDateInputValue(lead.finishDate),
        status: lead.status,
        priority: lead.priority,
        isActive: lead.isActive,
        isFinal: isFinalLeadStatus(lead.status),
        contacts: lead.contacts.map((c) => ({
          id: c.id,
          sourceType: c.sourceType,
          sourceValue: c.sourceValue,
        })),
        assignees: lead.assignees.map((a) => ({
          userId: a.userId,
          fullName: a.user.fullName,
          email: a.user.email,
        })),
      }}
      sources={sources}
      statusOptions={statusOptions}
      priorityOptions={priorityOptions}
      assignableUsers={users.filter((u) => !assignedIds.has(u.id))}
    />
  );
}
