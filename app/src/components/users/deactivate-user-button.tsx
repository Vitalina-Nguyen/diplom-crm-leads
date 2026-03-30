"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deactivateUserAdmin } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import { ru } from "@/messages/ru";

export function DeactivateUserButton({
  userId,
  disabled,
  disabledTitle,
}: {
  userId: number;
  disabled?: boolean;
  disabledTitle?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      className="!px-2 !py-1 text-xs"
      disabled={pending || disabled}
      title={disabled ? disabledTitle ?? ru.errors.lastAdmin : undefined}
      onClick={() => {
        if (!window.confirm(ru.users.deactivateConfirm)) return;
        start(async () => {
          const res = await deactivateUserAdmin(userId);
          if (res.ok) {
            router.push("/users");
            router.refresh();
          } else {
            alert(res.error);
          }
        });
      }}
    >
      {ru.users.deactivate}
    </Button>
  );
}
