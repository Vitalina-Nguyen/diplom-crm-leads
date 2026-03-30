"use client";

import { useActionState } from "react";
import { loginAction, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ru } from "@/messages/ru";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null as AuthFormState);

  return (
    <Card className="w-full max-w-md">
      <CardTitle className="mb-6">{ru.login.title}</CardTitle>
      <form action={formAction} className="flex flex-col gap-4" autoComplete="off">
        <Input
          name="email"
          type="email"
          label={ru.login.email}
          autoComplete="off"
          required
          error={state?.fieldErrors?.email}
        />
        <Input
          name="password"
          type="password"
          label={ru.login.password}
          autoComplete="off"
          required
          error={state?.fieldErrors?.password}
        />
        {state?.fieldErrors?._form ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {state.fieldErrors._form}
          </p>
        ) : null}
        {state?.error &&
        !state.fieldErrors?.email &&
        !state.fieldErrors?.password &&
        !state.fieldErrors?._form ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? ru.common.signingIn : ru.login.submit}
        </Button>
      </form>
    </Card>
  );
}
