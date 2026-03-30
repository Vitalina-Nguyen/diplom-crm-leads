import { v7 as uuidv7 } from "uuid";
import { LeadStatus, type Prisma } from "@prisma/client";
import { mapExternalContactKeyToRow } from "@/lib/external-ingest-contacts";
import { prisma } from "@/lib/prisma";
import { resolveAutoLeadPriority } from "@/lib/lead-priority-auto";
import { ru } from "@/messages/ru";

export type ExternalIngestContactInput = {
  key?: string;
  name?: string;
  type?: string;
  value: string;
};

/**
 * Создание лида из внешнего API: компания, контакт, бюджет, описание, опционально срок;
 * контакты-каналы из массива маппятся на типы системы или OTHER;
 * статус NEW, приоритет авто, создатель — переданный admin user id.
 */
export async function createLeadFromExternalIngest(params: {
  sourceId: string;
  createdById: string;
  companyName: string;
  contactName: string;
  budget: Prisma.Decimal;
  description: string | null;
  finishDate?: Date | null;
  contacts?: ExternalIngestContactInput[];
}): Promise<{ id: string }> {
  const id = uuidv7();
  const finishDate = params.finishDate ?? null;
  const priority = resolveAutoLeadPriority(params.budget, finishDate);

  const contactRows =
    params.contacts?.map((c) => {
      const label = (c.key ?? c.name ?? c.type ?? "").trim();
      return mapExternalContactKeyToRow(label, c.value);
    }) ?? [];

  await prisma.lead.create({
    data: {
      id,
      companyName: params.companyName,
      contactName: params.contactName,
      description: params.description,
      sourceId: params.sourceId,
      status: LeadStatus.NEW,
      priority,
      budget: params.budget,
      finishDate,
      createdById: params.createdById,
      isActive: true,
      contacts:
        contactRows.length > 0
          ? {
              create: contactRows,
            }
          : undefined,
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
