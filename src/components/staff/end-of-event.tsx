"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { MessageButton } from "@/components/staff/message-button";
import { Button, Card, TagNumber, useToast } from "@/components/ui";
import { sendJson } from "@/lib/client/api";
import type { EndOfEventPreview } from "@/lib/events/end-of-event";

type Moved = { id: string; trackingCode: string; tagNumber: number | null };

function Step({ title, body, count, action, disabled, onRun }: { title: string; body: string; count: number; action: string; disabled?: boolean; onRun: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-h3 text-ink">{title}</p>
          <p className="text-small text-ink-secondary">{body}</p>
        </div>
        <span className="font-mono text-h2 tabular-nums text-ink">{count}</span>
      </div>
      {confirming ? (
        <div className="flex gap-2">
          <Button variant="destructive" loading={pending} onClick={() => startTransition(async () => { await onRun(); setConfirming(false); })}>
            Yes, {action.toLowerCase()} {count}
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button variant="secondary" disabled={disabled || count === 0} onClick={() => setConfirming(true)} className="self-start">
          {action}
        </Button>
      )}
    </Card>
  );
}

/** Last-day actions for the active event (LD11). */
export function EndOfEventPanel({ eventId, holdDays, onChanged }: { eventId: string; holdDays: number; onChanged: () => void }) {
  const toast = useToast();
  const [preview, setPreview] = useState<EndOfEventPreview | null>(null);
  const [moved, setMoved] = useState<Moved[]>([]);

  const load = useCallback(async () => {
    const result = await sendJson<EndOfEventPreview>(`/api/admin/events/${eventId}/end`, "GET");
    if (result.ok) setPreview(result.data);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!preview) return <p className="text-small text-ink-muted">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <Step
        title="Move uncollected devices to the IT office"
        body={`Ready or not-repairable devices still at the desk. Students then have ${holdDays} days to collect.`}
        count={preview.uncollectedAtDesk}
        action="Move"
        onRun={async () => {
          const result = await sendJson<{ moved: Moved[] }>(`/api/admin/events/${eventId}/end`, "POST", { action: "MOVE_UNCOLLECTED" });
          if (!result.ok) return toast.error(result.error);
          setMoved(result.data.moved);
          toast.success(`${result.data.moved.length} moved to the IT office`);
          await load();
          onChanged();
        }}
      />
      {moved.length ? (
        <Card className="flex flex-col gap-3 p-5">
          <p className="text-small font-semibold text-ink">Send the reminder to each student</p>
          {moved.map((ticket) => (
            <div key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
              <span className="flex items-center gap-3">
                <TagNumber tag={ticket.tagNumber} size="sm" />
                <span className="font-mono text-caption text-ink-muted">{ticket.trackingCode}</span>
              </span>
              <MessageButton ticketId={ticket.id} template="UNCOLLECTED_REMINDER" sent={[]} />
            </div>
          ))}
        </Card>
      ) : null}
      <Step
        title="Close unfinished repairs"
        body={`Marked "Cannot be repaired – event ended" and returned to the student. ${preview.notDroppedOff} request${preview.notDroppedOff === 1 ? "" : "s"} never dropped off will be cancelled. Stored device passwords are deleted.`}
        count={preview.unfinished + preview.notDroppedOff}
        action="Close"
        onRun={async () => {
          const result = await sendJson<{ closed: number; passwordsDeleted: number }>(`/api/admin/events/${eventId}/end`, "POST", { action: "CLOSE_UNFINISHED" });
          if (!result.ok) return toast.error(result.error);
          toast.success(`${result.data.closed} closed, ${result.data.passwordsDeleted} passwords deleted`);
          await load();
          onChanged();
        }}
      />
      <p className="text-caption text-ink-muted">{preview.storedPasswords} device password{preview.storedPasswords === 1 ? "" : "s"} still stored.</p>
    </div>
  );
}
