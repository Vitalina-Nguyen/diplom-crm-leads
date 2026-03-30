import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLE_NAME, requireAdmin } from "@/lib/require-admin";
import { formatRoleName } from "@/lib/role-labels";
import { ru } from "@/messages/ru";
import { DeactivateUserButton } from "@/components/users/deactivate-user-button";
import { Button } from "@/components/ui/button";
import { Table, Td, Th } from "@/components/ui/table";

export default async function UsersPage() {
  const me = await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { fullName: "asc" }],
    include: { role: true },
  });

  const adminRole = await prisma.role.findUnique({ where: { name: ADMIN_ROLE_NAME } });
  const activeAdminCount = adminRole
    ? await prisma.user.count({ where: { roleId: adminRole.id, active: true } })
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">{ru.users.title}</h1>
        <Link href="/users/new">
          <Button type="button">{ru.users.createUser}</Button>
        </Link>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>{ru.users.colFullName}</Th>
            <Th>{ru.users.colEmail}</Th>
            <Th>{ru.users.colRole}</Th>
            <Th>{ru.users.colStatus}</Th>
            <Th className="w-[220px]">{ru.users.colActions}</Th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <Td colSpan={5} className="py-8 text-center text-slate-500">
                {ru.users.empty}
              </Td>
            </tr>
          ) : (
            users.map((u) => {
              const isAdminUser = adminRole !== null && u.roleId === adminRole.id;
              const onlyActiveAdmin = isAdminUser && u.active && activeAdminCount <= 1;
              const cannotDeactivate = onlyActiveAdmin || u.id === me.id;
              const deactivateTitle =
                u.id === me.id
                  ? ru.errors.cannotDeactivateSelf
                  : onlyActiveAdmin
                    ? ru.errors.lastAdmin
                    : undefined;
              return (
                <tr
                  key={u.id}
                  data-inactive={u.active ? undefined : ""}
                  className={u.active ? "" : "bg-slate-100 text-slate-500"}
                >
                  <Td className="font-medium">{u.fullName}</Td>
                  <Td>{u.email}</Td>
                  <Td>{formatRoleName(u.role.name)}</Td>
                  <Td>{u.active ? ru.users.active : ru.users.inactive}</Td>
                  <Td>
                    <div className="flex flex-row flex-nowrap items-center justify-end gap-2">
                      <Link href={`/users/${u.id}`}>
                        <Button variant="secondary" className="!px-2 !py-1 text-xs">
                          {ru.common.view}
                        </Button>
                      </Link>
                      <Link href={`/users/${u.id}/edit`}>
                        <Button variant="secondary" className="!px-2 !py-1 text-xs">
                          {ru.common.edit}
                        </Button>
                      </Link>
                      <DeactivateUserButton
                        userId={u.id}
                        disabled={cannotDeactivate}
                        disabledTitle={deactivateTitle}
                      />
                    </div>
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
    </div>
  );
}
