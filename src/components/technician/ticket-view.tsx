"use client";

import { ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition, type ReactNode } from "react";
import { IntakePanel } from "@/components/staff/intake-panel";
import { Badge, Button, Card, Eyebrow, Field, Input, StatusBadge, TagNumber, Textarea, Timeline, UrgentBadge, useToast } from "@/components/ui";
import { sendJson } from "@/lib/client/api";
import { formatDateTime } from "@/lib/client/format";
import type { StaffTicketDetail } from "@/lib/tickets/ticket-detail";

export type ActionRunner = (body: Record<string, unknown>, success: string) => Promise<boolean>;

function PasswordReveal({ ticketId }: { ticketId: string }) {
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3 rounded-md border border-line px-4 py-3">
      <KeyRound className="h-5 w-5 text-ink-muted" strokeWidth={1.75} />
      <span className="flex-1 font-mono text-body text-ink">{password ?? "••••••••"}</span>
      {error ? <span className="text-caption text-error-text">{error}</span> : null}
      <Button
        variant="ghost"
        size="sm"
        loading={pending}
        icon={password ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
        onClick={() =>
          password
            ? setPassword(null)
            : startTransition(async () => {
                const result = await sendJson<{ password: string }>(`/api/staff/tickets/${ticketId}/password`, "GET");
                if (result.ok) setPassword(result.data.password);
                else setError(result.error);
              })
        }
      >
        {password ? "Hide" : "Show"}
      </Button>
    </div>
  );
}

function ReasonForm({ label, placeholder, submitLabel, onSubmit, onCancel }: { label: string; placeholder: string; submitLabel: string; onSubmit: (text: string) => void; onCancel: () => void }) {
  const [text, setText] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <Field label={label}>
        <Input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} />
      </Field>
      <div className="flex gap-2">
        <Button disabled={text.trim().length < 3} onClick={() => onSubmit(text)}>
          {submitLabel}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/**
 * One ticket for the technician (TA1–TA11): the next action as the big button,
 * everything from intake and check-in, password, notes and history.
 * `extraActions` lets the blocked-state and repair-record flows plug in.
 */
export function TechnicianTicketView({
  ticketId,
  userId,
  renderInProgress,
}: {
  ticketId: string;
  userId: string;
  renderInProgress?: (ticket: StaffTicketDetail, run: ActionRunner) => ReactNode;
}) {
  const toast = useToast();
  const [ticket, setTicket] = useState<StaffTicketDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"none" | "release">("none");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    const result = await sendJson<{ ticket: StaffTicketDetail }>(`/api/staff/tickets/${ticketId}`, "GET");
    if (result.ok) setTicket(result.data.ticket);
    else setError(result.error);
  }, [ticketId]);

  useEffect(() => {
    void load();
  }, [load]);

  const run: ActionRunner = (body, success) =>
    new Promise((resolve) =>
      startTransition(async () => {
        const result = await sendJson(`/api/staff/tickets/${ticketId}/actions`, "POST", body);
        if (!result.ok) {
          toast.error(Object.values(result.issues)[0]?.[0] ?? result.error);
          resolve(false);
          return;
        }
        toast.success(success);
        setMode("none");
        await load();
        resolve(true);
      }),
    );

  if (error) return <p className="text-small text-error-text">{error}</p>;
  if (!ticket) return <p className="text-small text-ink-muted">Loading…</p>;

  const mine = ticket.technician?.id === userId;
  const inPool = ticket.status === "RECEIVED" && !ticket.technician;

  let primary: ReactNode = null;
  if (inPool) primary = <Button size="lg" className="w-full" loading={pending} onClick={() => run({ type: "CLAIM" }, "Claimed — it's yours")}>Claim this ticket</Button>;
  else if (mine && ticket.status === "RECEIVED") primary = <Button size="lg" className="w-full" loading={pending} onClick={() => run({ type: "START" }, "Repair started")}>Start repair</Button>;
  else if (mine && ticket.status === "IN_REPAIR" && !renderInProgress)
    primary = <Button size="lg" className="w-full" loading={pending} onClick={() => run({ type: "MARK_READY" }, "Marked ready")}>Mark ready</Button>;

  return (
    <div className="mx-auto flex max-w-form flex-col gap-5">
      <Link href="/technician/workspace" className="inline-flex items-center gap-1.5 text-small font-medium text-ink-secondary hover:text-ink">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        Back
      </Link>

      <Card className="flex flex-col gap-4 p-5" focal={Boolean(primary)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <TagNumber tag={ticket.tagNumber} size="lg" />
            <p className="font-mono text-caption text-ink-muted">{ticket.trackingCode}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <StatusBadge status={ticket.status} />
            {ticket.priority === "URGENT" ? <UrgentBadge /> : null}
            {ticket.custody.zone ? <Badge className="font-mono">Zone {ticket.custody.zone}</Badge> : null}
          </div>
        </div>
        <p className="text-h3 text-ink">{ticket.intake.device.name}</p>
        {primary}
        {mine && renderInProgress ? renderInProgress(ticket, run) : null}
        {mine && (ticket.status === "RECEIVED" || ticket.status === "IN_REPAIR") ? (
          mode === "release" ? (
            <ReasonForm
              label="Why are you releasing it?"
              placeholder="Needs a hardware specialist"
              submitLabel="Release to pool"
              onSubmit={(reason) => void run({ type: "RELEASE", reason }, "Released to the pool")}
              onCancel={() => setMode("none")}
            />
          ) : (
            <button type="button" className="self-start text-small font-medium text-ink-secondary hover:text-ink" onClick={() => setMode("release")}>
              Release to pool
            </button>
          )
        ) : null}
      </Card>

      {mine && ticket.hasPassword ? (
        <section className="flex flex-col gap-2">
          <Eyebrow>Device password</Eyebrow>
          <PasswordReveal ticketId={ticket.id} />
        </section>
      ) : null}

      <Card className="p-5">
        <IntakePanel intake={ticket.intake} />
      </Card>

      {ticket.custody.receivedAt ? (
        <Card className="flex flex-col gap-1 p-5 text-small text-ink-secondary">
          <Eyebrow className="mb-1">Check-in</Eyebrow>
          <p>Received {formatDateTime(ticket.custody.receivedAt)}{ticket.custody.receivedBy ? ` by ${ticket.custody.receivedBy}` : ""}</p>
          <p>Condition: {[...ticket.custody.conditionChecks, ticket.custody.condition].filter(Boolean).join(" · ") || "no damage noted"}</p>
          <p>Received with: {ticket.custody.accessoriesReceived.join(", ") || "device only"}</p>
        </Card>
      ) : null}

      {mine ? (
        <Card className="flex flex-col gap-2 p-5">
          <Eyebrow>Internal note</Eyebrow>
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Only staff see notes." />
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            disabled={note.trim().length < 3}
            loading={pending}
            onClick={async () => {
              if (await run({ type: "ADD_NOTE", note }, "Note added")) setNote("");
            }}
          >
            Add note
          </Button>
        </Card>
      ) : null}

      <Card className="p-5">
        <Eyebrow className="mb-4">History</Eyebrow>
        <Timeline items={[...ticket.timeline].reverse().map((event) => ({ id: event.id, title: event.note ?? event.type, detail: event.actor ?? "Requester", at: event.at }))} />
      </Card>
    </div>
  );
}
