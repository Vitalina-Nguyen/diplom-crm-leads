import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createLeadFromExternalIngest } from "@/lib/create-lead-from-external";
import { hashIngestToken } from "@/lib/ingest-token-crypto";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLE_NAME } from "@/lib/require-admin";
import { externalCreateLeadBodySchema } from "@/lib/validations/external-lead-api";
import { ru } from "@/messages/ru";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: CORS });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) {
    return json({ error: ru.errors.externalApiUnauthorized }, 401);
  }
  const bearer = auth.slice(7).trim();
  if (!bearer) {
    return json({ error: ru.errors.externalApiUnauthorized }, 401);
  }

  const tokenHash = hashIngestToken(bearer);
  const tokenRow = await prisma.leadIngestToken.findUnique({
    where: { tokenHash },
    select: { id: true, sourceId: true },
  });
  if (!tokenRow) {
    return json({ error: ru.errors.externalApiUnauthorized }, 401);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: ru.errors.externalApiInvalidJson }, 400);
  }

  const parsed = externalCreateLeadBodySchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      {
        error: ru.errors.externalApiValidationFailed,
        details: parsed.error.flatten(),
      },
      400,
    );
  }

  const admin = await prisma.user.findFirst({
    where: { active: true, role: { name: ADMIN_ROLE_NAME } },
    orderBy: { id: "asc" },
    select: { id: true },
  });
  if (!admin) {
    return json({ error: ru.errors.externalApiNoAdmin }, 503);
  }

  try {
    const { id } = await createLeadFromExternalIngest({
      sourceId: tokenRow.sourceId,
      createdById: admin.id,
      companyName: parsed.data.companyName,
      contactName: parsed.data.contactName,
      budget: parsed.data.budget,
      description: parsed.data.description,
      finishDate: parsed.data.finishDate,
      contacts: parsed.data.contacts,
    });
    revalidatePath("/leads");
    return json({ id, ok: true }, 201);
  } catch (e) {
    console.error(e);
    return json({ error: ru.errors.externalApiCreateFailed }, 500);
  }
}
