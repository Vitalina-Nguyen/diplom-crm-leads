import { z } from "zod";

export const externalCreateLeadBodySchema = z.object({
  companyName: z.string().trim().min(1),
  contactName: z.string().trim().min(1),
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
});

export type ExternalCreateLeadBody = z.infer<typeof externalCreateLeadBodySchema>;
