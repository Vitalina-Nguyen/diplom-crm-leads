"use server";

import { AssignmentAction, LeadPriority, LeadStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { v7 as uuidv7 } from "uuid";
import { isFinalLeadStatus } from "@/lib/lead-status";
import { resolveAutoLeadPriority } from "@/lib/lead-priority-auto";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import {
  addAssigneeSchema,
  addContactSchema,
  createLeadSchema,
  removeAssigneeSchema,
  removeContactSchema,
  updateLeadSchema,
  updateLeadPrioritySchema,
  updateLeadStatusSchema,
} from "@/lib/validations/lead";
import { ru } from "@/messages/ru";

function parseBudget(raw: string | undefined): Prisma.Decimal | null {
  if (raw === undefined || raw === "") return null;
  return new Prisma.Decimal(raw);
}

function parseFinishDate(raw: string | undefined): Date | null {
  if (raw === undefined || raw.trim() === "") return null;
  const d = new Date(`${raw.trim()}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function revalidateLeadPaths(leadId: string) {
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath(`/leads/${leadId}/edit`);
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createLead(formData: FormData): Promise<ActionResult> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, error: ru.errors.unauthorized };

  const assigneeRaw = formData.getAll("assigneeIds").map(String).filter(Boolean);
  const contactsJson = formData.get("contactsJson");
  let contacts: { sourceType: string; sourceValue: string }[] | undefined;
  if (typeof contactsJson === "string" && contactsJson.trim() !== "") {
    try {
      const parsed = JSON.parse(contactsJson) as unknown;
      if (!Array.isArray(parsed)) throw new Error("invalid");
      contacts = parsed.map((c) => ({
        sourceType: String((c as { sourceType?: string }).sourceType ?? ""),
        sourceValue: String((c as { sourceValue?: string }).sourceValue ?? ""),
      }));
    } catch {
      return { ok: false, error: ru.errors.invalidContactsJson };
    }
  }

  const parsed = createLeadSchema.safeParse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    description: formData.get("description") ?? undefined,
    sourceId: formData.get("sourceId"),
    priority: formData.get("priority") ?? undefined,
    useAutoPriority: formData.get("useAutoPriority"),
    budget: formData.get("budget") ?? undefined,
    finishDate:
      typeof formData.get("finishDate") === "string" ? formData.get("finishDate") : undefined,
    assigneeIds: assigneeRaw.length ? assigneeRaw : undefined,
    contacts,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? ru.errors.validationFailed };
  }

  const id = uuidv7();
  const budget = parseBudget(parsed.data.budget);
  const finishDate = parseFinishDate(parsed.data.finishDate);
  const useAutoPriority = parsed.data.useAutoPriority === "1";
  const priority = useAutoPriority
    ? resolveAutoLeadPriority(budget, finishDate)
    : parsed.data.priority!;
  const priorityHistoryComment = useAutoPriority
    ? ru.history.leadPriorityAutoOnCreate
    : ru.history.leadPriorityOnCreate;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.lead.create({
        data: {
          id,
          companyName: parsed.data.companyName,
          contactName: parsed.data.contactName,
          description: parsed.data.description || null,
          sourceId: parsed.data.sourceId,
          status: LeadStatus.NEW,
          priority,
          budget,
          finishDate,
          createdById: session.userId,
          isActive: true,
          statusHistory: {
            create: {
              previousStatus: null,
              newStatus: LeadStatus.NEW,
              changedById: session.userId,
              comment: ru.history.leadCreated,
            },
          },
          priorityHistory: {
            create: {
              previousPriority: null,
              newPriority: priority,
              changedById: session.userId,
              comment: priorityHistoryComment,
            },
          },
          contacts:
            parsed.data.contacts && parsed.data.contacts.length
              ? {
                  create: parsed.data.contacts.map((c) => ({
                    sourceType: c.sourceType,
                    sourceValue: c.sourceValue,
                  })),
                }
              : undefined,
        },
      });

      const ids = parsed.data.assigneeIds ?? [];
      const uniqueIds = [...new Set(ids)];
      for (const userId of uniqueIds) {
        const u = await tx.user.findFirst({ where: { id: userId, active: true } });
        if (!u) continue;
        await tx.leadAssignee.create({
          data: { leadId: id, userId },
        });
        await tx.leadAssignmentHistory.create({
          data: {
            leadId: id,
            userId,
            action: AssignmentAction.ADDED,
            comment: null,
          },
        });
      }
    });
  } catch (e) {
    console.error(e);
    return { ok: false, error: ru.errors.createLeadFailed };
  }

  revalidateLeadPaths(id);
  return { ok: true };
}

export async function updateLead(formData: FormData): Promise<ActionResult> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, error: ru.errors.unauthorized };

  const parsed = updateLeadSchema.safeParse({
    leadId: formData.get("leadId"),
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    description: formData.get("description") ?? undefined,
    sourceId: formData.get("sourceId"),
    budget: formData.get("budget") ?? undefined,
    finishDate:
      typeof formData.get("finishDate") === "string" ? formData.get("finishDate") : undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? ru.errors.validationFailed };
  }

  const lead = await prisma.lead.findUnique({ where: { id: parsed.data.leadId } });
  if (!lead) return { ok: false, error: ru.errors.leadNotFound };
  if (!lead.isActive) return { ok: false, error: ru.errors.leadInactiveNoEdit };

  const budget = parseBudget(parsed.data.budget);
  const finishDate = parseFinishDate(parsed.data.finishDate);

  try {
    await prisma.lead.update({
      where: { id: parsed.data.leadId },
      data: {
        companyName: parsed.data.companyName,
        contactName: parsed.data.contactName,
        description: parsed.data.description || null,
        sourceId: parsed.data.sourceId,
        budget,
        finishDate,
      },
    });
  } catch (e) {
    console.error(e);
    return { ok: false, error: ru.errors.updateLeadFailed };
  }

  revalidateLeadPaths(parsed.data.leadId);
  return { ok: true };
}

export async function updateLeadStatus(formData: FormData): Promise<ActionResult> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, error: ru.errors.unauthorized };

  const parsed = updateLeadStatusSchema.safeParse({
    leadId: formData.get("leadId"),
    newStatus: formData.get("newStatus"),
    comment: formData.get("comment") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? ru.errors.validationFailed };
  }

  const lead = await prisma.lead.findUnique({ where: { id: parsed.data.leadId } });
  if (!lead) return { ok: false, error: ru.errors.leadNotFound };
  if (isFinalLeadStatus(lead.status)) {
    return { ok: false, error: ru.errors.finalStatus };
  }
  if (lead.status === parsed.data.newStatus) {
    return { ok: true };
  }

  try {
    await prisma.$transaction([
      prisma.lead.update({
        where: { id: parsed.data.leadId },
        data: { status: parsed.data.newStatus },
      }),
      prisma.leadStatusHistory.create({
        data: {
          leadId: parsed.data.leadId,
          previousStatus: lead.status,
          newStatus: parsed.data.newStatus,
          changedById: session.userId,
          comment: parsed.data.comment || null,
        },
      }),
    ]);
  } catch (e) {
    console.error(e);
    return { ok: false, error: ru.errors.updateStatusFailed };
  }

  revalidateLeadPaths(parsed.data.leadId);
  return { ok: true };
}

export async function updateLeadPriority(formData: FormData): Promise<ActionResult> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, error: ru.errors.unauthorized };

  const parsed = updateLeadPrioritySchema.safeParse({
    leadId: formData.get("leadId"),
    newPriority: formData.get("newPriority"),
    comment: formData.get("comment") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? ru.errors.validationFailed };
  }

  const lead = await prisma.lead.findUnique({ where: { id: parsed.data.leadId } });
  if (!lead) return { ok: false, error: ru.errors.leadNotFound };
  if (!lead.isActive) return { ok: false, error: ru.errors.leadInactiveNoEdit };
  if (lead.priority === parsed.data.newPriority) {
    return { ok: true };
  }

  try {
    await prisma.$transaction([
      prisma.lead.update({
        where: { id: parsed.data.leadId },
        data: { priority: parsed.data.newPriority },
      }),
      prisma.leadPriorityHistory.create({
        data: {
          leadId: parsed.data.leadId,
          previousPriority: lead.priority,
          newPriority: parsed.data.newPriority,
          changedById: session.userId,
          comment: parsed.data.comment || null,
        },
      }),
    ]);
  } catch (e) {
    console.error(e);
    return { ok: false, error: ru.errors.updatePriorityFailed };
  }

  revalidateLeadPaths(parsed.data.leadId);
  return { ok: true };
}

export async function softDeleteLead(leadId: string): Promise<ActionResult> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, error: ru.errors.unauthorized };

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { ok: false, error: ru.errors.leadNotFound };

  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { isActive: false },
    });
  } catch (e) {
    console.error(e);
    return { ok: false, error: ru.errors.deactivateFailed };
  }

  revalidateLeadPaths(leadId);
  return { ok: true };
}

export async function reactivateLead(leadId: string): Promise<ActionResult> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, error: ru.errors.unauthorized };

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { ok: false, error: ru.errors.leadNotFound };

  if (lead.isActive) {
    return { ok: true };
  }

  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { isActive: true },
    });
  } catch (e) {
    console.error(e);
    return { ok: false, error: ru.errors.reactivateLeadFailed };
  }

  revalidateLeadPaths(leadId);
  return { ok: true };
}

export async function addLeadContact(formData: FormData): Promise<ActionResult> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, error: ru.errors.unauthorized };

  const parsed = addContactSchema.safeParse({
    leadId: formData.get("leadId"),
    sourceType: formData.get("sourceType"),
    sourceValue: formData.get("sourceValue"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? ru.errors.validationFailed };
  }

  const lead = await prisma.lead.findUnique({ where: { id: parsed.data.leadId } });
  if (!lead) return { ok: false, error: ru.errors.leadNotFound };
  if (!lead.isActive) return { ok: false, error: ru.errors.leadInactiveNoEdit };

  try {
    await prisma.leadContact.create({
      data: {
        leadId: parsed.data.leadId,
        sourceType: parsed.data.sourceType,
        sourceValue: parsed.data.sourceValue,
      },
    });
  } catch (e) {
    console.error(e);
    return { ok: false, error: ru.errors.addContactFailed };
  }

  revalidateLeadPaths(parsed.data.leadId);
  return { ok: true };
}

export async function removeLeadContact(formData: FormData): Promise<ActionResult> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, error: ru.errors.unauthorized };

  const parsed = removeContactSchema.safeParse({
    contactId: formData.get("contactId"),
    leadId: formData.get("leadId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? ru.errors.validationFailed };
  }

  const contact = await prisma.leadContact.findFirst({
    where: { id: parsed.data.contactId, leadId: parsed.data.leadId },
  });
  if (!contact) return { ok: false, error: ru.errors.contactNotFound };

  try {
    await prisma.leadContact.delete({ where: { id: parsed.data.contactId } });
  } catch (e) {
    console.error(e);
    return { ok: false, error: ru.errors.removeContactFailed };
  }

  revalidateLeadPaths(parsed.data.leadId);
  return { ok: true };
}

export async function addLeadAssignee(formData: FormData): Promise<ActionResult> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, error: ru.errors.unauthorized };

  const parsed = addAssigneeSchema.safeParse({
    leadId: formData.get("leadId"),
    userId: formData.get("userId"),
    comment: formData.get("comment") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? ru.errors.validationFailed };
  }

  const lead = await prisma.lead.findUnique({ where: { id: parsed.data.leadId } });
  if (!lead) return { ok: false, error: ru.errors.leadNotFound };
  if (!lead.isActive) return { ok: false, error: ru.errors.leadInactiveNoEdit };

  const user = await prisma.user.findFirst({
    where: { id: parsed.data.userId, active: true },
  });
  if (!user) return { ok: false, error: ru.errors.userNotFound };

  const existing = await prisma.leadAssignee.findUnique({
    where: {
      leadId_userId: { leadId: parsed.data.leadId, userId: parsed.data.userId },
    },
  });
  if (existing) return { ok: false, error: ru.errors.alreadyAssigned };

  try {
    await prisma.$transaction([
      prisma.leadAssignee.create({
        data: { leadId: parsed.data.leadId, userId: parsed.data.userId },
      }),
      prisma.leadAssignmentHistory.create({
        data: {
          leadId: parsed.data.leadId,
          userId: parsed.data.userId,
          action: AssignmentAction.ADDED,
          comment: parsed.data.comment || null,
        },
      }),
    ]);
  } catch (e) {
    console.error(e);
    return { ok: false, error: ru.errors.assignFailed };
  }

  revalidateLeadPaths(parsed.data.leadId);
  return { ok: true };
}

export async function removeLeadAssignee(formData: FormData): Promise<ActionResult> {
  const session = await requireSession().catch(() => null);
  if (!session) return { ok: false, error: ru.errors.unauthorized };

  const parsed = removeAssigneeSchema.safeParse({
    leadId: formData.get("leadId"),
    userId: formData.get("userId"),
    comment: formData.get("comment") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? ru.errors.validationFailed };
  }

  const leadForAssignee = await prisma.lead.findUnique({ where: { id: parsed.data.leadId } });
  if (!leadForAssignee) return { ok: false, error: ru.errors.leadNotFound };
  if (!leadForAssignee.isActive) return { ok: false, error: ru.errors.leadInactiveNoEdit };

  const row = await prisma.leadAssignee.findUnique({
    where: {
      leadId_userId: { leadId: parsed.data.leadId, userId: parsed.data.userId },
    },
  });
  if (!row) return { ok: false, error: ru.errors.assignmentNotFound };

  try {
    await prisma.$transaction([
      prisma.leadAssignee.delete({
        where: {
          leadId_userId: { leadId: parsed.data.leadId, userId: parsed.data.userId },
        },
      }),
      prisma.leadAssignmentHistory.create({
        data: {
          leadId: parsed.data.leadId,
          userId: parsed.data.userId,
          action: AssignmentAction.REMOVED,
          comment: parsed.data.comment || null,
        },
      }),
    ]);
  } catch (e) {
    console.error(e);
    return { ok: false, error: ru.errors.removeAssigneeFailed };
  }

  revalidateLeadPaths(parsed.data.leadId);
  return { ok: true };
}
