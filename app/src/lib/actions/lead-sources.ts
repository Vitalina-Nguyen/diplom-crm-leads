"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { isProtectedLeadSourceName } from "@/lib/lead-sources";
import { revalidatePath } from "next/cache";
import { ru } from "@/messages/ru";

export type LeadSourceActionResult = { ok: true } | { ok: false; error: string };

function normalizeSourceName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export async function createLeadSourceAdmin(formData: FormData): Promise<LeadSourceActionResult> {
  await requireAdmin();

  const name = normalizeSourceName(String(formData.get("name") ?? ""));
  if (!name) {
    return { ok: false, error: ru.errors.leadSourceNameRequired };
  }
  if (name.length > 120) {
    return { ok: false, error: ru.errors.leadSourceNameTooLong };
  }

  try {
    await prisma.leadSource.create({ data: { name } });
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? String((e as { code: string }).code) : "";
    if (code === "P2002") {
      return { ok: false, error: ru.errors.leadSourceNameTaken };
    }
    console.error(e);
    return { ok: false, error: ru.errors.createLeadSourceFailed };
  }

  revalidatePath("/lead-sources");
  revalidatePath("/ingest-tokens");
  revalidatePath("/leads/new");
  revalidatePath("/leads", "layout");
  return { ok: true };
}

export async function deleteLeadSourceAdmin(sourceId: string): Promise<LeadSourceActionResult> {
  await requireAdmin();

  const source = await prisma.leadSource.findUnique({ where: { id: sourceId } });
  if (!source) {
    return { ok: false, error: ru.errors.leadSourceNotFound };
  }
  if (isProtectedLeadSourceName(source.name)) {
    return { ok: false, error: ru.errors.leadSourceProtected };
  }

  const used = await prisma.lead.count({ where: { sourceId } });
  if (used > 0) {
    return { ok: false, error: ru.errors.leadSourceInUse };
  }

  const tokens = await prisma.leadIngestToken.count({ where: { sourceId } });
  if (tokens > 0) {
    return { ok: false, error: ru.errors.leadSourceHasIngestTokens };
  }

  try {
    await prisma.leadSource.delete({ where: { id: sourceId } });
  } catch (e) {
    console.error(e);
    return { ok: false, error: ru.errors.deleteLeadSourceFailed };
  }

  revalidatePath("/lead-sources");
  revalidatePath("/ingest-tokens");
  revalidatePath("/leads/new");
  revalidatePath("/leads", "layout");
  return { ok: true };
}
