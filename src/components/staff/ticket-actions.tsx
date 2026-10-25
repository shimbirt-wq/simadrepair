"use client";

import { useState, useTransition } from "react";
import { Button, Field, Input, Select, useToast } from "@/components/ui";
import { sendJson } from "@/lib/client/api";
import type { StaffTicketDetail } from "@/lib/tickets/ticket-detail";

export type TechnicianOption = { id: string; name: string; openCount: number; skills: string[] };

/** Desk actions for one ticket, chosen by its status. */
export function DeskActions({ ticket, technicians, onDone }: { ticket: StaffTicketDetail; technicians: TechnicianOption[]; onDone: () => void }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [technicianId, setTechnicianId] = useState("");
  const [reason, setReason] = useState("");
  const [zone, setZone] = useState("");
  const [condition, setCondition] = useState("");
  const [collector, setCollector] = useState({ name: "", phone: "" });
  const [error, setError] = useState<string | null>(null);

  function run(body: Record<string, unknown>, success: string) {
    setError(null);
    startTransition(async () => {
      const result = await sendJson(`/api/staff/tickets/${ticket.id}/actions`, "POST", body);
      if (!result.ok) {
        setError(Object.values(result.issues)[0]?.[0] ?? result.error);
        return;
      }
      toast.success(success);
      onDone();
    });
  }

  const errorLine = error ? (
    <p className="text-caption text-error-text" role="alert">
      {error}
    </p>
  ) : null;

  if (ticket.status === "SUBMITTED") {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
          <Field label="Zone" optional>
            <Input value={zone} onChange={(e) => setZone(e.target.value.toUpperCase().slice(0, 1))} placeholder="A" className="font-mono uppercase" />
          </Field>
          <Field label="Condition" optional>
            <Input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="Scratches, cracked corner…" />
          </Field>
        </div>
        {errorLine}
        <Button loading={pending} onClick={() => run({ type: "CHECK_IN", storageLocation: zone || null, condition: condition || null }, "Device checked in")}>
          Check in device
        </Button>
      </div>
    );
  }

  const assignable = ["RECEIVED", "IN_REPAIR", "WAITING_FOR_PARTS", "ACTION_NEEDED"].includes(ticket.status);
  const pickup = ticket.status === "READY_FOR_PICKUP" || ticket.status === "CANNOT_BE_REPAIRED";

  return (
    <div className="flex flex-col gap-4">
      {ticket.status === "CANNOT_REPAIR_PROPOSED" ? (
        <div className="flex flex-col gap-3 rounded-md bg-warning-soft p-4">
          <p className="text-small font-semibold text-warning-text">Technician says this cannot be repaired.</p>
          <p className="text-small text-ink">{ticket.timeline.find((event) => event.type === "CANNOT_REPAIR_PROPOSED")?.note}</p>
          <div className="flex flex-wrap gap-2">
            <Button loading={pending} onClick={() => run({ type: "CONFIRM_CANNOT_REPAIR" }, "Confirmed")}>
              Confirm
            </Button>
            <Button variant="secondary" disabled={pending} onClick={() => run({ type: "REJECT_CANNOT_REPAIR" }, "Sent back to repair")}>
              Keep repairing
            </Button>
          </div>
        </div>
      ) : null}

      {assignable ? (
        <div className="flex flex-col gap-3">
          <Field label={ticket.technician ? "Reassign to" : "Assign to"}>
            <Select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)}>
              <option value="">Choose a technician…</option>
              {technicians
                .filter((technician) => technician.id !== ticket.technician?.id)
                .map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.name} · {technician.openCount} open{technician.skills.length ? ` · ${technician.skills.join(", ")}` : ""}
                  </option>
                ))}
            </Select>
          </Field>
          {ticket.technician ? (
            <Field label="Reason">
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Needs a hardware specialist" />
            </Field>
          ) : null}
          <Button
            variant={ticket.technician ? "secondary" : "primary"}
            loading={pending}
            disabled={!technicianId}
            onClick={() => run({ type: "ASSIGN", technicianId, reason: reason || undefined }, "Technician assigned")}
          >
            {ticket.technician ? "Reassign" : "Assign"}
          </Button>
        </div>
      ) : null}

      {pickup ? (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Collected by">
              <Input value={collector.name} onChange={(e) => setCollector((c) => ({ ...c, name: e.target.value }))} placeholder="Full name" />
            </Field>
            <Field label="Their phone" optional>
              <Input type="tel" value={collector.phone} onChange={(e) => setCollector((c) => ({ ...c, phone: e.target.value }))} />
            </Field>
          </div>
          <Button loading={pending} onClick={() => run({ type: "PICKUP", collectedByName: collector.name, collectedByPhone: collector.phone || null }, "Device handed back")}>
            Hand back device
          </Button>
        </div>
      ) : null}

      {errorLine}
    </div>
  );
}
