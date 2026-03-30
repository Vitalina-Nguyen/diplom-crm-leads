"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { ADMIN_ROLE_NAME, requireAdmin } from "@/lib/require-admin";
import {
  createUserAdminSchema,
  deactivateUserAdminSchema,
  updateUserAdminSchema,
} from "@/lib/validations/user-admin";
import { ru } from "@/messages/ru";

export type UserAdminActionResult = { ok: true } | { ok: false; error: string };

function revalidateUserPaths(userId: number) {
  revalidatePath("/users");
  revalidatePath(`/users/${userId}`);
  revalidatePath(`/users/${userId}/edit`);
}

async function getAdminRoleId(): Promise<number | null> {
  const r = await prisma.role.findUnique({ where: { name: ADMIN_ROLE_NAME } });
  return r?.id ?? null;
}

async function assertNotRemovingLastAdmin(params: {
  targetId: number;
  prevRoleId: number;
  prevActive: boolean;
  nextRoleId: number;
  nextActive: boolean;
}): Promise<UserAdminActionResult> {
  const adminRoleId = await getAdminRoleId();
  if (adminRoleId === null) return { ok: true };

  const wasAdmin = params.prevRoleId === adminRoleId && params.prevActive;
  const willBeAdmin = params.nextRoleId === adminRoleId && params.nextActive;

  if (wasAdmin && !willBeAdmin) {
    const n = await prisma.user.count({
      where: { roleId: adminRoleId, active: true },
    });
    if (n <= 1) {
      return { ok: false, error: ru.errors.lastAdmin };
    }
  }
  return { ok: true };
}

export async function createUserAdmin(formData: FormData): Promise<UserAdminActionResult> {
  await requireAdmin();

  const parsed = createUserAdminSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    roleId: formData.get("roleId"),
    active: formData.get("active"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? ru.errors.validationFailed };
  }

  const email = parsed.data.email.toLowerCase();
  const dup = await prisma.user.findFirst({ where: { email } });
  if (dup) {
    return { ok: false, error: ru.errors.emailTaken };
  }

  try {
    const password = await hashPassword(parsed.data.password);
    await prisma.user.create({
      data: {
        fullName: parsed.data.fullName,
        email,
        password,
        roleId: parsed.data.roleId,
        active: parsed.data.active,
      },
    });
  } catch (e) {
    console.error(e);
    return { ok: false, error: ru.errors.createUserFailed };
  }

  revalidatePath("/users");
  return { ok: true };
}

export async function updateUserAdmin(formData: FormData): Promise<UserAdminActionResult> {
  const editor = await requireAdmin();

  const parsed = updateUserAdminSchema.safeParse({
    userId: formData.get("userId"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    roleId: formData.get("roleId"),
    active: formData.get("active"),
    newPassword: formData.get("newPassword") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? ru.errors.validationFailed };
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    include: { role: true },
  });
  if (!target) {
    return { ok: false, error: ru.errors.userNotFound };
  }

  const check = await assertNotRemovingLastAdmin({
    targetId: target.id,
    prevRoleId: target.roleId,
    prevActive: target.active,
    nextRoleId: parsed.data.roleId,
    nextActive: parsed.data.active,
  });
  if (!check.ok) return check;

  const email = parsed.data.email.toLowerCase();
  const dup = await prisma.user.findFirst({
    where: { email, NOT: { id: target.id } },
  });
  if (dup) {
    return { ok: false, error: ru.errors.emailTaken };
  }

  try {
    const data: {
      fullName: string;
      email: string;
      roleId: number;
      active: boolean;
      password?: string;
    } = {
      fullName: parsed.data.fullName,
      email,
      roleId: parsed.data.roleId,
      active: parsed.data.active,
    };
    if (parsed.data.newPassword) {
      data.password = await hashPassword(parsed.data.newPassword);
    }
    await prisma.user.update({
      where: { id: target.id },
      data,
    });
  } catch (e) {
    console.error(e);
    return { ok: false, error: ru.errors.updateUserFailed };
  }

  revalidateUserPaths(target.id);
  return { ok: true };
}

export async function deactivateUserAdmin(userId: number): Promise<UserAdminActionResult> {
  const editor = await requireAdmin();

  const parsed = deactivateUserAdminSchema.safeParse({ userId });
  if (!parsed.success) {
    return { ok: false, error: ru.errors.validationFailed };
  }

  if (parsed.data.userId === editor.id) {
    return { ok: false, error: ru.errors.cannotDeactivateSelf };
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    include: { role: true },
  });
  if (!target) {
    return { ok: false, error: ru.errors.userNotFound };
  }

  const adminRoleId = await getAdminRoleId();
  if (adminRoleId !== null && target.roleId === adminRoleId && target.active) {
    const n = await prisma.user.count({
      where: { roleId: adminRoleId, active: true },
    });
    if (n <= 1) {
      return { ok: false, error: ru.errors.lastAdmin };
    }
  }

  if (!target.active) {
    return { ok: true };
  }

  try {
    await prisma.user.update({
      where: { id: target.id },
      data: { active: false },
    });
  } catch (e) {
    console.error(e);
    return { ok: false, error: ru.errors.deactivateUserFailed };
  }

  revalidateUserPaths(target.id);
  return { ok: true };
}
