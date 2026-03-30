"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateUserAdmin } from "@/lib/actions/users";
import { formatRoleName } from "@/lib/role-labels";
import { ru } from "@/messages/ru";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type RoleOpt = { id: string; name: string };

type UserPayload = {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  active: boolean;
};

export function EditUserForm({
  user,
  roles,
}: {
  user: UserPayload;
  roles: RoleOpt[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  return (
    <Card>
      <CardTitle className="mb-6">{ru.users.editTitle}</CardTitle>
      <form
        className="flex max-w-xl flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          setErr(null);
          setFieldErrors({});
          const fd = new FormData(e.currentTarget);
          fd.set("userId", String(user.id));
          start(async () => {
            const r = await updateUserAdmin(fd);
            if (!r.ok) {
              setErr(r.error);
              setFieldErrors(r.fieldErrors ?? {});
              return;
            }
            setMsg(ru.users.flashSaved);
            router.refresh();
          });
        }}
      >
        <input type="hidden" name="userId" value={user.id} readOnly />

        <Input
          name="fullName"
          label={ru.users.colFullName}
          required
          defaultValue={user.fullName}
          error={fieldErrors.fullName}
        />
        <Input
          name="email"
          type="email"
          label={ru.users.colEmail}
          required
          defaultValue={user.email}
          error={fieldErrors.email}
        />

        <Select
          name="roleId"
          label={ru.users.fieldRole}
          required
          defaultValue={String(user.roleId)}
          error={fieldErrors.roleId}
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {formatRoleName(r.name)}
            </option>
          ))}
        </Select>

        <div className="flex flex-col gap-1">
          <Label htmlFor="active">{ru.users.fieldActive}</Label>
          <select
            id="active"
            name="active"
            aria-invalid={fieldErrors.active ? true : undefined}
            className={`rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 ${
              fieldErrors.active
                ? "border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-slate-300 ring-blue-500 focus:border-blue-500 focus:ring-blue-500"
            }`}
            defaultValue={user.active ? "true" : "false"}
          >
            <option value="true">{ru.users.active}</option>
            <option value="false">{ru.users.inactive}</option>
          </select>
          {fieldErrors.active ? <p className="text-sm text-red-600">{fieldErrors.active}</p> : null}
        </div>

        <Input
          name="newPassword"
          type="password"
          label={ru.users.newPassword}
          placeholder={ru.users.newPasswordHint}
          autoComplete="new-password"
          error={fieldErrors.newPassword}
        />
        <p className="text-xs text-slate-500">{ru.users.newPasswordHint}</p>

        {err && Object.keys(fieldErrors).length === 0 ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {err}
          </p>
        ) : null}
        {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? ru.common.saving : ru.users.save}
          </Button>
          <Link href={`/users/${user.id}`}>
            <Button type="button" variant="secondary">
              {ru.users.backToUser}
            </Button>
          </Link>
          <Link href="/users">
            <Button type="button" variant="ghost">
              {ru.users.backToList}
            </Button>
          </Link>
        </div>
      </form>
    </Card>
  );
}
