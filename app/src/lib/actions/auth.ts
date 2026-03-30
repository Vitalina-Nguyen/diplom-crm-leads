"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { COOKIE_NAME, createSessionToken } from "@/lib/session-token";
import { loginSchema } from "@/lib/validations/auth";
import { ru } from "@/messages/ru";
import { fieldErrorsFromZodError } from "@/lib/zod-field-errors";

export type AuthFormState = { error?: string; fieldErrors?: Record<string, string> } | null;

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return {
      error: first ?? ru.errors.invalidInput,
      fieldErrors: fieldErrorsFromZodError(parsed.error),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user || !user.active) {
    return {
      error: ru.errors.invalidCredentials,
      fieldErrors: { password: ru.errors.invalidCredentials },
    };
  }

  const ok = await verifyPassword(parsed.data.password, user.password);
  if (!ok) {
    return {
      error: ru.errors.invalidCredentials,
      fieldErrors: { password: ru.errors.invalidCredentials },
    };
  }

  let token: string;
  try {
    token = await createSessionToken({ userId: user.id, email: user.email });
  } catch {
    return { error: ru.errors.authSecret, fieldErrors: { _form: ru.errors.authSecret } };
  }

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/leads");
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  redirect("/login");
}
