"use client";

import { Check, MessageCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { Button, useToast } from "@/components/ui";
import { formatDateTime } from "@/lib/client/format";
import { TEMPLATE_LABELS, type MessageTemplate } from "@/lib/messaging/templates";

/**
 * Opens WhatsApp with the ready-made message and logs the send. The window is
 * opened synchronously on click so browsers don't block it as a pop-up.
 */
export function MessageButton({
  ticketId,
  template,
  sent,
  onSent,
}: {
  ticketId: string;
  template: MessageTemplate;
  sent: Array<{ template: string; at: string; by: string | null }>;
  onSent?: () => void;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [justSent, setJustSent] = useState(false);
  const last = sent.find((message) => message.template === template);

  function send() {
    const popup = window.open("about:blank", "_blank");
    startTransition(async () => {
      const response = await fetch(`/api/staff/tickets/${ticketId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ template }) });
      const payload = (await response.json().catch(() => null)) as { openUrl?: string | null; error?: string } | null;
      if (!response.ok || !payload) {
        popup?.close();
        toast.error(payload?.error ?? "Could not prepare the message.");
        return;
      }
      if (payload.openUrl) {
        if (popup) popup.location.href = payload.openUrl;
        else window.location.href = payload.openUrl;
      } else popup?.close();
      setJustSent(true);
      onSent?.();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button variant="secondary" loading={pending} onClick={send} icon={<MessageCircle className="h-4 w-4" strokeWidth={1.75} />}>
        {last || justSent ? "Send again on WhatsApp" : `Send on WhatsApp: ${TEMPLATE_LABELS[template].toLowerCase()}`}
      </Button>
      {last ? (
        <p className="flex items-center gap-1 text-caption text-ink-muted">
          <Check className="h-3.5 w-3.5 text-success" strokeWidth={2.5} />
          Sent {formatDateTime(last.at)}
          {last.by ? ` by ${last.by}` : ""}
        </p>
      ) : null}
    </div>
  );
}
