"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reactivateLead } from "@/lib/actions/leads";
import { Button } from "@/components/ui/button";
import { ru } from "@/messages/ru";

export function ReactivateLeadButton({
  leadId,
  compact = true,
}: {
  leadId: string;
  /** В таблице лидов — компактная кнопка; на карточке/редактировании — обычный размер. */
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      className={
        compact
          ? "!border-emerald-600 !px-2 !py-1 text-xs text-emerald-800 hover:bg-emerald-50"
          : "border-emerald-600 text-emerald-800 hover:bg-emerald-50"
      }
      disabled={pending}
      onClick={() => {
        if (!window.confirm(ru.reactivateLead.confirm)) return;
        start(async () => {
          const res = await reactivateLead(leadId);
          if (res.ok) router.refresh();
          else alert(res.error);
        });
      }}
    >
      {ru.reactivateLead.button}
    </Button>
  );
}
