"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui";
import { sendJson } from "@/lib/client/api";

export function ActivateButton({ eventId, active }: { eventId: string; active: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant={active ? "ghost" : "secondary"}
      size="sm"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          await sendJson(`/api/admin/events/${eventId}/activate`, active ? "DELETE" : "POST");
          router.refresh();
        })
      }
    >
      {active ? "Deactivate" : "Activate"}
    </Button>
  );
}
