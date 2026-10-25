"use client";

import { MessageCircle, Phone } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { IntakePanel } from "@/components/staff/intake-panel";
import { RepairSummary } from "@/components/staff/repair-summary";
import { Badge, Dialog, Eyebrow, StatusBadge, TagNumber, Timeline, UrgentBadge } from "@/components/ui";
import { sendJson } from "@/lib/client/api";
import { formatDateTime } from "@/lib/client/format";
import { whatsappDisplay, whatsappLink } from "@/lib/phone";
import type { StaffTicketDetail } from "@/lib/tickets/ticket-detail";

/** Loads one ticket and shows it in a side sheet; `actions` renders the role-specific buttons. */
export function TicketSheet({
  ticketId,
  onClose,
  actions,
}: {
  ticketId: string | null;
  onClose: () => void;
  actions: (ticket: StaffTicketDetail, reload: () => void) => ReactNode;
}) {
  const [ticket, setTicket] = useState<StaffTicketDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ticketId) return;
    const result = await sendJson<{ ticket: StaffTicketDetail }>(`/api/staff/tickets/${ticketId}`, "GET");
    if (result.ok) {
      setTicket(result.data.ticket);
      setError(null);
    } else setError(result.error);
  }, [ticketId]);

  useEffect(() => {
    setTicket(null);
    void load();
  }, [load]);

  return (
    <Dialog
      open={Boolean(ticketId)}
      onClose={onClose}
      variant="sheet"
      title={
        ticket ? (
          <span className="flex items-center gap-3">
            <TagNumber tag={ticket.tagNumber} size="md" />
            <span className="font-mono text-small text-ink-secondary">{ticket.trackingCode}</span>
          </span>
        ) : (
          "Ticket"
        )
      }
    >
      {error ? <p className="text-small text-error-text">{error}</p> : null}
      {!ticket && !error ? <p className="text-small text-ink-muted">Loading…</p> : null}
      {ticket ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            {ticket.priority === "URGENT" ? <UrgentBadge /> : null}
            {ticket.custody.zone ? <Badge className="font-mono">Zone {ticket.custody.zone}</Badge> : null}
            {ticket.technician ? <Badge tone="accent">{ticket.technician.name}</Badge> : null}
          </div>

          <section className="flex flex-col gap-3 rounded-md border border-line p-4">
            {actions(ticket, () => void load())}
          </section>

          <section className="flex flex-col gap-1">
            <Eyebrow>Requester</Eyebrow>
            <p className="text-h3 text-ink">{ticket.requester.fullName}</p>
            <p className="font-mono text-small text-ink-secondary">{ticket.requester.universityId}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <a className="inline-flex items-center gap-1.5 text-small font-medium text-ink-accent hover:underline" href={`tel:${ticket.requester.phone}`}>
                <Phone className="h-4 w-4" strokeWidth={1.75} />
                {whatsappDisplay(ticket.requester.phone)}
              </a>
              <a className="inline-flex items-center gap-1.5 text-small font-medium text-ink-accent hover:underline" href={whatsappLink(ticket.requester.phone)} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
                WhatsApp
              </a>
            </div>
          </section>

          {ticket.custody.receivedAt ? (
            <section className="flex flex-col gap-1 text-small text-ink-secondary">
              <Eyebrow>Check-in</Eyebrow>
              <p>
                Received {formatDateTime(ticket.custody.receivedAt)}
                {ticket.custody.receivedBy ? ` by ${ticket.custody.receivedBy}` : ""}
              </p>
              <p>{ticket.custody.idChecked ? "ID card checked." : "ID card not recorded."}</p>
              {ticket.custody.conditionChecks.length || ticket.custody.condition ? (
                <p>Condition: {[...ticket.custody.conditionChecks, ticket.custody.condition].filter(Boolean).join(" · ")}</p>
              ) : (
                <p>No damage noted.</p>
              )}
              <p>Received with: {ticket.custody.accessoriesReceived.length ? ticket.custody.accessoriesReceived.join(", ") : "device only"}</p>
              {ticket.custody.collectedAt ? (
                <p>
                  Collected {formatDateTime(ticket.custody.collectedAt)} by {ticket.custody.collectedByName}
                  {ticket.custody.collectedByPhone ? ` (${whatsappDisplay(ticket.custody.collectedByPhone)})` : ""}
                </p>
              ) : null}
            </section>
          ) : null}

          {ticket.repair ? <RepairSummary repair={ticket.repair} /> : null}

          <IntakePanel intake={ticket.intake} />

          <section className="flex flex-col gap-3">
            <Eyebrow>History</Eyebrow>
            <Timeline
              items={[...ticket.timeline].reverse().map((event) => ({
                id: event.id,
                title: event.note ?? event.type.replaceAll("_", " ").toLowerCase(),
                detail: event.actor ?? "Requester",
                at: event.at,
              }))}
            />
          </section>
        </div>
      ) : null}
    </Dialog>
  );
}
