import { LeadPriority, LeadStatus } from "@prisma/client";
import { ru } from "@/messages/ru";
import { z } from "zod";

const statusEnum = z.nativeEnum(LeadStatus);
const priorityEnum = z.nativeEnum(LeadPriority);

const budgetField = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v.trim() === "" ? undefined : v.trim()));

const finishDateField = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v.trim() === "" ? undefined : v.trim()));

export const createLeadSchema = z
  .object({
    companyName: z.string().trim().min(1, ru.validation.companyRequired),
    contactName: z.string().trim().min(1, ru.validation.contactRequired),
    description: z.string().trim().optional(),
    sourceId: z.coerce.number().int().positive(),
    /** При ручном режиме (`useAutoPriority === "0"`) обязателен. */
    priority: priorityEnum.optional(),
    /** `"1"` — автоопределение приоритета на сервере (по умолчанию). */
    useAutoPriority: z.preprocess((v) => (v === "0" ? "0" : "1"), z.enum(["0", "1"])),
    budget: budgetField,
    finishDate: finishDateField,
    assigneeIds: z.array(z.coerce.number().int().positive()).optional(),
    contacts: z
      .array(
        z.object({
          sourceType: z.string().trim().min(1, ru.validation.contactFieldRequired),
          sourceValue: z.string().trim().min(1, ru.validation.contactFieldRequired),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.useAutoPriority === "0" && data.priority === undefined) {
      ctx.addIssue({
        code: "custom",
        message: ru.validation.priorityRequired,
        path: ["priority"],
      });
    }
  });

export const updateLeadSchema = z.object({
  leadId: z.string().min(1),
  companyName: z.string().trim().min(1, ru.validation.companyRequired),
  contactName: z.string().trim().min(1, ru.validation.contactRequired),
  description: z.string().trim().optional(),
  sourceId: z.coerce.number().int().positive(),
  budget: budgetField,
  finishDate: finishDateField,
});

export const updateLeadStatusSchema = z.object({
  leadId: z.string().min(1),
  newStatus: statusEnum,
  comment: z.string().trim().optional(),
});

export const updateLeadPrioritySchema = z.object({
  leadId: z.string().min(1),
  newPriority: priorityEnum,
  comment: z.string().trim().optional(),
});

export const addContactSchema = z.object({
  leadId: z.string().min(1),
  sourceType: z.string().trim().min(1, ru.validation.contactFieldRequired),
  sourceValue: z.string().trim().min(1, ru.validation.contactFieldRequired),
});

export const removeContactSchema = z.object({
  contactId: z.coerce.number().int().positive(),
  leadId: z.string().min(1),
});

export const addAssigneeSchema = z.object({
  leadId: z.string().min(1),
  userId: z.coerce.number().int().positive(),
  comment: z.string().trim().optional(),
});

export const removeAssigneeSchema = z.object({
  leadId: z.string().min(1),
  userId: z.coerce.number().int().positive(),
  comment: z.string().trim().optional(),
});
