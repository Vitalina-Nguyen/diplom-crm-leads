import { Prisma } from "@prisma/client";
import { z } from "zod";

const externalContactItemSchema = z
  .object({
    key: z.string().trim().optional(),
    name: z.string().trim().optional(),
    type: z.string().trim().optional(),
    value: z.union([z.string(), z.number(), z.boolean()]).transform((v) => String(v).trim()),
  })
  .superRefine((data, ctx) => {
    const label = (data.key ?? data.name ?? data.type ?? "").trim();
    if (!label) {
      ctx.addIssue({
        code: "custom",
        message: "У контакта нужно указать key, name или type",
        path: ["key"],
      });
    }
    if (!data.value.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "У контакта нужно непустое value",
        path: ["value"],
      });
    }
  });

export const externalCreateLeadBodySchema = z.object({
  companyName: z.string().trim().min(1),
  contactName: z.string().trim().min(1),
  budget: z
    .union([z.number().finite(), z.string().trim().min(1)])
    .transform((v) => (typeof v === "number" ? String(v) : v))
    .superRefine((s, ctx) => {
      try {
        const d = new Prisma.Decimal(s);
        if (!d.isFinite()) {
          ctx.addIssue({ code: "custom", message: "Некорректный budget", path: ["budget"] });
        }
      } catch {
        ctx.addIssue({ code: "custom", message: "Некорректный budget", path: ["budget"] });
      }
    })
    .transform((s) => new Prisma.Decimal(s)),
  description: z
    .any()
    .optional()
    .transform((v): string | null => {
      if (v === undefined || v === null) return null;
      if (typeof v === "string") {
        const t = v.trim();
        return t === "" ? null : t;
      }
      return JSON.stringify(v);
    }),
  contacts: z.array(externalContactItemSchema).optional().default([]),
  /** Срок сдачи: строка ISO 8601 (`2026-06-15T14:30:00Z`) или Unix-время в миллисекундах. */
  finishDate: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z
      .union([z.string().trim().min(1), z.number().finite()])
      .optional()
      .transform((v, ctx): Date | null => {
        if (v === undefined) return null;
        const d = typeof v === "number" ? new Date(v) : new Date(v);
        if (Number.isNaN(d.getTime())) {
          ctx.addIssue({
            code: "custom",
            message:
              "Некорректный finishDate: укажите дату/время в формате ISO 8601 или число миллисекунд с 1970 года",
            path: ["finishDate"],
          });
          return z.NEVER;
        }
        return d;
      }),
  ),
});

export type ExternalCreateLeadBody = z.infer<typeof externalCreateLeadBodySchema>;
