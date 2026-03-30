import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { formatRoleName } from "@/lib/role-labels";
import { ru } from "@/messages/ru";
import { DeactivateUserButton } from "@/components/users/deactivate-user-button";
import { ADMIN_ROLE_NAME, requireAdmin } from "@/lib/require-admin";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

function formatDt(d: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const editor = await requireAdmin();
  const { id: idRaw } = await params;
  const idParsed = z.string().uuid().safeParse(idRaw);
  if (!idParsed.success) notFound();
  const id = idParsed.data;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });
  if (!user) notFound();

  const adminRole = await prisma.role.findUnique({ where: { name: ADMIN_ROLE_NAME } });
  const activeAdminCount = adminRole
    ? await prisma.user.count({ where: { roleId: adminRole.id, active: true } })
    : 0;
  const isAdminUser = adminRole !== null && user.roleId === adminRole.id;
  const onlyActiveAdmin = isAdminUser && user.active && activeAdminCount <= 1;

  const isSelf = editor.id === user.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className={`text-2xl font-semibold ${user.active ? "text-slate-900" : "text-slate-500"}`}
          >
            {user.fullName}
          </h1>
          <p className="text-sm text-slate-600">
            {ru.users.idLabel}: {user.id}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/users">
            <Button type="button" variant="secondary">
              {ru.users.backToList}
            </Button>
          </Link>
          <Link href={`/users/${user.id}/edit`}>
            <Button type="button">{ru.common.edit}</Button>
          </Link>
          <DeactivateUserButton
            userId={user.id}
            disabled={isSelf || onlyActiveAdmin}
            disabledTitle={
              isSelf
                ? ru.errors.cannotDeactivateSelf
                : onlyActiveAdmin
                  ? ru.errors.lastAdmin
                  : undefined
            }
          />
        </div>
      </div>

      <Card>
        <CardTitle className="mb-4">{ru.users.detailTitle}</CardTitle>
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-slate-500">{ru.users.colFullName}</dt>
            <dd className="font-medium text-slate-900">{user.fullName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{ru.users.colEmail}</dt>
            <dd className="font-medium text-slate-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{ru.users.colRole}</dt>
            <dd className="font-medium text-slate-900">{formatRoleName(user.role.name)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{ru.users.colStatus}</dt>
            <dd className="font-medium text-slate-900">
              {user.active ? ru.users.active : ru.users.inactive}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">{ru.users.colCreated}</dt>
            <dd className="text-slate-800">{formatDt(user.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{ru.detail.updated}</dt>
            <dd className="text-slate-800">{formatDt(user.updatedAt)}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
