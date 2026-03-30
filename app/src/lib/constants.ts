import type { LeadPriority, LeadStatus } from "@prisma/client";
import { leadPriorityLabels, leadStatusLabels } from "@/messages/ru";

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = leadStatusLabels;
export const LEAD_PRIORITY_LABELS: Record<LeadPriority, string> = leadPriorityLabels;
export const CONTACT_SOURCE_TYPES = [
  "EMAIL",
  "PHONE",
  "TELEGRAM",
  "LINKEDIN",
  "OTHER",
] as const;

export type ContactSourceType = (typeof CONTACT_SOURCE_TYPES)[number];
