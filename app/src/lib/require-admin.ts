import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const ADMIN_ROLE_NAME = "Admin";

export async function getSessionUserWithRole() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    include: { role: true },
  });
}

export function userIsAdmin(user: { active: boolean; role: { name: string } } | null): boolean {
  return !!(user && user.active && user.role.name === ADMIN_ROLE_NAME);
}

/** Редирект на /login или /leads, если не админ. */
export async function requireAdmin() {
  const user = await getSessionUserWithRole();
  if (!user || !user.active) {
    redirect("/login");
  }
  if (!userIsAdmin(user)) {
    redirect("/leads");
  }
  return user;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getSessionUserWithRole();
  return userIsAdmin(user);
}
