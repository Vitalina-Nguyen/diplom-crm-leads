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
      <form action={formAction} className="flex flex-col gap-4">
        <Input name="email" type="email" label={ru.login.email} autoComplete="email" required />
        <Input
          name="password"
          type="password"
          label={ru.login.password}
          autoComplete="current-password"
          required
        />
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? ru.common.signingIn : ru.login.submit}
        </Button>
      </form>
    </Card>
  );
}
