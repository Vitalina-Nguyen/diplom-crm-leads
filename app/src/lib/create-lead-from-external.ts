import { v7 as uuidv7 } from "uuid";
import { LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveAutoLeadPriority } from "@/lib/lead-priority-auto";
import { ru } from "@/messages/ru";

/**
 * Создание лида из внешнего API: только компания, контакт, описание;
 * статус NEW, приоритет авто, создатель — переданный admin user id.
 */
export async function createLeadFromExternalIngest(params: {
  sourceId: string;
  createdById: string;
  companyName: string;
  contactName: string;
  description: string | null;
}): Promise<{ id: string }> {
  const id = uuidv7();
  const priority = resolveAutoLeadPriority(null, null);

  await prisma.lead.create({
    data: {
      id,
      companyName: params.companyName,
      contactName: params.contactName,
      description: params.description,
      sourceId: params.sourceId,
      status: LeadStatus.NEW,
      priority,
      budget: null,
      finishDate: null,
      createdById: params.createdById,
      isActive: true,
      statusHistory: {
        create: {
          previousStatus: null,
          newStatus: LeadStatus.NEW,
          changedById: params.createdById,
          comment: ru.history.leadCreatedViaExternalApi,
        },
      },
      priorityHistory: {
        create: {
          previousPriority: null,
          newPriority: priority,
          changedById: params.createdById,
          comment: ru.history.leadPriorityAutoOnCreate,
        },
      },
    },
  });

  return { id };
}
