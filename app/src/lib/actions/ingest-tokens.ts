"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { buildTokenPreview, generateIngestTokenPlain, hashIngestToken } from "@/lib/ingest-token-crypto";
import { revalidatePath } from "next/cache";
import { ru } from "@/messages/ru";

function normalizeSourceName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export type CreateIngestTokenResult =
  | { ok: true; plainToken: string }
  | { ok: false; error: string };

export async function createIngestTokenAction(formData: FormData): Promise<CreateIngestTokenResult> {
  await requireAdmin();

  const displayName = String(formData.get("displayName") ?? "").trim();
  if (!displayName) {
    return { ok: false, error: ru.errors.ingestTokenDisplayNameRequired };
  }
  if (displayName.length > 200) {
    return { ok: false, error: ru.errors.ingestTokenDisplayNameTooLong };
  }

  const sourceMode = String(formData.get("sourceMode") ?? "existing");
  const plain = generateIngestTokenPlain();
  const tokenHash = hashIngestToken(plain);
  const tokenPreview = buildTokenPreview(plain);

  try {
    await prisma.$transaction(async (tx) => {
      let sourceId: number;
      if (sourceMode === "new") {
        const name = normalizeSourceName(String(formData.get("newSourceName") ?? ""));
        if (!name) {
          throw new Error("SOURCE_NAME_REQUIRED");
        }
        if (name.length > 120) {
          throw new Error("SOURCE_NAME_TOO_LONG");
        }
        const src = await tx.leadSource.create({ data: { name } });
        sourceId = src.id;
      } else {
        sourceId = Number(formData.get("sourceId"));
        if (!Number.isFinite(sourceId) || sourceId <= 0) {
          throw new Error("SOURCE_NOT_FOUND");
        }
        const exists = await tx.leadSource.findUnique({ where: { id: sourceId } });
        if (!exists) {
          throw new Error("SOURCE_NOT_FOUND");
        }
      }

      await tx.leadIngestToken.create({
        data: {
          displayName,
          sourceId,
          tokenHash,
          tokenPreview,
        },
      });
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "SOURCE_NAME_REQUIRED") {
      return { ok: false, error: ru.errors.leadSourceNameRequired };
    }
    if (msg === "SOURCE_NAME_TOO_LONG") {
      return { ok: false, error: ru.errors.leadSourceNameTooLong };
    }
    if (msg === "SOURCE_NOT_FOUND") {
      return { ok: false, error: ru.errors.leadSourceNotFound };
    }
    const code = typeof e === "object" && e && "code" in e ? String((e as { code: string }).code) : "";
    if (code === "P2002") {
      return { ok: false, error: ru.errors.leadSourceNameTaken };
    }
    console.error(e);
    return { ok: false, error: ru.errors.ingestTokenCreateFailed };
  }

  revalidatePath("/ingest-tokens");
  revalidatePath("/lead-sources");
  revalidatePath("/leads/new");
  revalidatePath("/leads", "layout");

  return { ok: true, plainToken: plain };
}

export type RevokeIngestTokenResult = { ok: true } | { ok: false; error: string };

export async function revokeIngestTokenAction(tokenId: number): Promise<RevokeIngestTokenResult> {
  await requireAdmin();

  try {
    await prisma.leadIngestToken.delete({ where: { id: tokenId } });
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? String((e as { code: string }).code) : "";
    if (code === "P2025") {
      return { ok: false, error: ru.errors.ingestTokenNotFound };
    }
    console.error(e);
    return { ok: false, error: ru.errors.ingestTokenRevokeFailed };
  }

  revalidatePath("/ingest-tokens");
  return { ok: true };
}
