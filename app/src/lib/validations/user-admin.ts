import { ru } from "@/messages/ru";
import { z } from "zod";

export const updateUserAdminSchema = z.object({
  userId: z.coerce.number().int().positive(),
  fullName: z.string().trim().min(1, ru.validation.userNameRequired),
  email: z.string().trim().email(ru.validation.invalidEmail),
  roleId: z.coerce.number().int().positive(),
  active: z.enum(["true", "false"]).transform((v) => v === "true"),
  newPassword: z
    .string()
    .transform((s) => (s.trim() === "" ? undefined : s.trim()))
    .refine((s) => s === undefined || s.length >= 8, {
      message: ru.validation.passwordMin8,
    }),
});

export const deactivateUserAdminSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

export const createUserAdminSchema = z.object({
  fullName: z.string().trim().min(1, ru.validation.userNameRequired),
  email: z.string().trim().email(ru.validation.invalidEmail),
  password: z.string().min(8, ru.validation.passwordMin8),
  roleId: z.coerce.number().int().positive(),
  active: z.enum(["true", "false"]).transform((v) => v === "true"),
});
