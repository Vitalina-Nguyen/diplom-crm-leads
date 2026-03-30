import { ru } from "@/messages/ru";
import { z } from "zod";

export const updateUserAdminSchema = z.object({
  userId: z.string().uuid(ru.validation.invalidUuid),
  fullName: z.string().trim().min(1, ru.validation.userNameRequired),
  email: z.string().trim().email(ru.validation.invalidEmail),
  roleId: z.string().uuid(ru.validation.invalidUuid),
  active: z.enum(["true", "false"]).transform((v) => v === "true"),
  newPassword: z
    .string()
    .transform((s) => (s.trim() === "" ? undefined : s.trim()))
    .refine((s) => s === undefined || s.length >= 8, {
      message: ru.validation.passwordMin8,
    }),
});

export const deactivateUserAdminSchema = z.object({
  userId: z.string().uuid(ru.validation.invalidUuid),
});

export const createUserAdminSchema = z.object({
  fullName: z.string().trim().min(1, ru.validation.userNameRequired),
  email: z.string().trim().email(ru.validation.invalidEmail),
  password: z.string().min(8, ru.validation.passwordMin8),
  roleId: z.string().uuid(ru.validation.invalidUuid),
  active: z.enum(["true", "false"]).transform((v) => v === "true"),
});
