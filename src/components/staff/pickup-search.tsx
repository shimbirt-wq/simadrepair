"use client";

import { Search } from "lucide-react";
import { useState, useTransition } from "react";
import { PickupForm } from "@/components/staff/pickup-form";
import { Badge, Button, Card, EmptyState, Input, TagNumber } from "@/components/ui";
import { sendJson } from "@/lib/client/api";
import type { PickupLookup } from "@/lib/pickup/pickup-service";

/** Pickup screen: type the university ID from the card, hand back that person's ready devices. */
export function PickupSearch({ onChanged }: { onChanged: () => void }) {
  const [universityId, setUniversityId] = useState("");
  const [lookup, setLookup] = useState<PickupLookup | null>(null);
  const [pending, startTransition] = useTransition();

  const search = () =>
    startTransition(async () => {
      const result = await sendJson<PickupLookup>(`/api/lead/pickup?universityId=${encodeURIComponent(universityId)}`, "GET");
      setLookup(result.ok ? result.data : { requester: null, tickets: [] });
    });

  return (
    <div className="flex flex-col gap-5">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <Input autoFocus value={universityId} onChange={(e) => setUniversityId(e.target.value)} placeholder="University ID on the card, e.g. CS383833" className="font-mono uppercase" aria-label="University ID" />
        <Button type="submit" loading={pending} icon={<Search className="h-4 w-4" strokeWidth={2} />}>
          Find
        </Button>
      </form>

      {lookup && !lookup.requester ? <EmptyState title="No one with this university ID." /> : null}
      {lookup?.requester ? (
        <div className="flex flex-col gap-1">
          <p className="text-h3 text-ink">{lookup.requester.fullName}</p>
          <p className="font-mono text-small text-ink-secondary">{lookup.requester.universityId}</p>
        </div>
      ) : null}
      {lookup?.requester && lookup.tickets.length === 0 ? <EmptyState title="Nothing ready for pickup for this person." /> : null}

      {lookup?.tickets.map((ticket) => (
        <Card key={ticket.id} className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <TagNumber tag={ticket.tagNumber} size="lg" />
              <p className="text-body font-semibold text-ink">{ticket.device}</p>
              <p className="text-caption text-ink-muted">
                {ticket.trackingCode} · {ticket.eventName}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              {ticket.status === "CANNOT_BE_REPAIRED" ? <Badge>Not repaired</Badge> : <Badge tone="success">Ready</Badge>}
              {ticket.zone ? <Badge className="font-mono">Zone {ticket.zone}</Badge> : null}
            </div>
          </div>
          <PickupForm
            ticket={{ ...ticket, universityId: lookup.requester!.universityId }}
            onDone={() => {
              onChanged();
              search();
            }}
          />
        </Card>
      ))}
    </div>
  );
}
