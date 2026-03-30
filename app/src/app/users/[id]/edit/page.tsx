import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { EditUserForm } from "./edit-user-form";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const [user, roles] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: { id: true, fullName: true, email: true, roleId: true, active: true },
    }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!user) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">{user.fullName}</h1>
      <EditUserForm user={user} roles={roles} />
    </div>
  );
}
