"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { softDeleteLead } from "@/lib/actions/leads";
import { Button } from "@/components/ui/button";
import { ru } from "@/messages/ru";

export function DeleteLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      className="!px-2 !py-1 text-xs"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(ru.deleteLead.confirm)) {
          return;
        }
        start(async () => {
          const res = await softDeleteLead(leadId);
          if (res.ok) router.refresh();
          else alert(res.error);
        });
      }}
    >
      {ru.deleteLead.button}
    </Button>
  );
}
