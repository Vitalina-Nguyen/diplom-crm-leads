import { ru } from "@/messages/ru";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email(ru.validation.invalidEmail),
  password: z.string().min(1, ru.validation.passwordRequired),
});

export type LoginInput = z.infer<typeof loginSchema>;
