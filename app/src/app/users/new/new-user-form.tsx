"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createUserAdmin } from "@/lib/actions/users";
import { formatRoleName } from "@/lib/role-labels";
import { ru } from "@/messages/ru";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type RoleOpt = { id: number; name: string };

export function NewUserForm({ roles }: { roles: RoleOpt[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const defaultRoleId = roles[0]?.id;

  return (
    <Card>
      <CardTitle className="mb-6">{ru.users.newTitle}</CardTitle>
      <form
        className="flex max-w-xl flex-col gap-4"
        action={(fd) => {
          setErr(null);
          start(async () => {
            const r = await createUserAdmin(fd);
            if (!r.ok) {
              setErr(r.error);
              return;
            }
            router.push("/users");
            router.refresh();
          });
        }}
      >
        <Input name="fullName" label={ru.users.colFullName} required />
        <Input name="email" type="email" label={ru.users.colEmail} required autoComplete="off" />
        <Input
          name="password"
          type="password"
          label={ru.users.fieldPassword}
          required
          autoComplete="new-password"
        />

        <Select
          name="roleId"
          label={ru.users.fieldRole}
          required
          defaultValue={defaultRoleId !== undefined ? String(defaultRoleId) : ""}
          placeholderOption={ru.users.fieldRole}
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {formatRoleName(role.name)}
            </option>
          ))}
        </Select>

        <div className="flex flex-col gap-1">
          <Label htmlFor="active-new">{ru.users.fieldActive}</Label>
          <select
            id="active-new"
            name="active"
            className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-blue-500 focus:border-blue-500 focus:ring-2 disabled:cursor-not-allowed"
            defaultValue="true"
          >
            <option value="true">{ru.users.active}</option>
            <option value="false">{ru.users.inactive}</option>
          </select>
        </div>

        {err ? <p className="text-sm text-red-600">{err}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending || roles.length === 0}>
            {pending ? ru.common.saving : ru.users.createUser}
          </Button>
          <Link href="/users">
            <Button type="button" variant="secondary">
              {ru.users.backToList}
            </Button>
          </Link>
        </div>
      </form>
    </Card>
  );
}
