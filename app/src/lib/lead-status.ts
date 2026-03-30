import type { LeadStatus } from "@prisma/client";

const FINAL: LeadStatus[] = ["COMPLETED", "REJECTED"];

export function isFinalLeadStatus(status: LeadStatus): boolean {
  return FINAL.includes(status);
}
