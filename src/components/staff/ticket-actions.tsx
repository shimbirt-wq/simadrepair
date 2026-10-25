"use client";

import { useState, useTransition } from "react";
import { PickupForm } from "@/components/staff/pickup-form";
import { PhotoUploader, type UploadedPhoto } from "@/components/public/photo-uploader";
import { Badge, Button, ChoiceCard, ChoiceGroup, Field, Input, TagNumber, useToast } from "@/components/ui";
import { neededSkills, rankTechnicians } from "@/lib/staff/skill-match";
import { ACCESSORIES } from "@/lib/intake/options";
import { CONDITION_CHECKS, MAX_DAMAGE_PHOTOS } from "@/lib/tickets/check-in-options";
import { sendJson } from "@/lib/client/api";
import type { StaffTicketDetail } from "@/lib/tickets/ticket-detail";

export type TechnicianOption = { id: string; name: string; openCount: number; skills: string[] };

/** Desk actions for one ticket, chosen by its status. */
export function DeskActions({ ticket, technicians, onDone }: { ticket: StaffTicketDetail; technicians: TechnicianOption[]; onDone: () => void }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [technicianId, setTechnicianId] = useState("");
  const [reason, setReason] = useState("");
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

  if (ticket.status === "SUBMITTED") return <CheckInForm ticket={ticket} onDone={onDone} />;

  const assignable = ["RECEIVED", "IN_REPAIR", "WAITING_FOR_PARTS", "ACTION_NEEDED"].includes(ticket.status);
  const pickup = ticket.status === "READY_FOR_PICKUP" || ticket.status === "CANNOT_BE_REPAIRED";

  return (
    <div className="flex flex-col gap-4">
      {ticket.tagNumber && ticket.status === "RECEIVED" && !ticket.technician ? (
        <div className="flex items-center justify-between gap-3 rounded-md bg-accent-soft px-4 py-3">
          <span className="text-small text-ink-secondary">Sticker</span>
          <span className="flex items-baseline gap-3">
            <TagNumber tag={ticket.tagNumber} size="lg" />
            <span className="text-h3 text-ink">{ticket.requester.fullName.split(" ")[0]}</span>
          </span>
        </div>
      ) : null}
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
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-small font-semibold text-ink">{ticket.technician ? "Reassign to" : "Assign to"}</legend>
            <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
              {rankTechnicians(
                technicians.filter((technician) => technician.id !== ticket.technician?.id),
                neededSkills(ticket.intake.categories),
              ).map((technician) => (
                <ChoiceCard
                  key={technician.id}
                  name={`assign-${ticket.id}`}
                  checked={technicianId === technician.id}
                  onChange={() => setTechnicianId(technician.id)}
                  label={
                    <span className="flex items-center gap-2">
                      {technician.name}
                      {technician.matches ? (
                        <Badge tone="accent" className="h-5 px-2">
                          Good match
                        </Badge>
                      ) : null}
                    </span>
                  }
                  description={`${technician.openCount} open${technician.skills.length ? ` · ${technician.skills.join(", ")}` : ""}`}
                />
              ))}
              {technicians.length === 0 ? <p className="text-caption text-ink-muted">No active technicians. Add volunteers on the Staff page.</p> : null}
            </div>
          </fieldset>
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
        <PickupForm
          ticket={{
            id: ticket.id,
            tagNumber: ticket.tagNumber,
            device: ticket.intake.device.name,
            universityId: ticket.requester.universityId,
            accessoriesReceived: ticket.custody.accessoriesReceivedValues.map((value, index) => ({ value, label: ticket.custody.accessoriesReceived[index] })),
          }}
          onDone={onDone}
        />
      ) : null}

      {errorLine}
    </div>
  );
}

/** Check-in at the desk (LD4, LD7, LD14, LD15, TD2). */
function CheckInForm({ ticket, onDone }: { ticket: StaffTicketDetail; onDone: () => void }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [idChecked, setIdChecked] = useState(false);
  const [checks, setChecks] = useState<string[]>([]);
  const [condition, setCondition] = useState("");
  const [accessories, setAccessories] = useState<string[]>(ticket.intake.accessoryValues);
  const [zone, setZone] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [password, setPassword] = useState("");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggle = (list: string[], value: string, on: boolean) => (on ? [...list, value] : list.filter((item) => item !== value));

  function submit() {
    if (!idChecked) {
      setError("Check the university ID card first.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await sendJson<{ ticket: { tagNumber?: number } }>(`/api/staff/tickets/${ticket.id}/actions`, "POST", {
        type: "CHECK_IN",
        idChecked,
        conditionChecks: checks,
        condition: condition || null,
        accessoriesReceived: accessories,
        zone,
        priority: urgent ? "URGENT" : "NORMAL",
        devicePassword: password || undefined,
      });
      if (!result.ok) {
        setError(Object.values(result.issues)[0]?.[0] ?? result.error);
        return;
      }
      toast.success("Checked in — write the sticker");
      onDone();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <ChoiceCard
        type="checkbox"
        label="University ID card checked"
        description={
          <>
            Card must show <span className="font-mono font-semibold text-ink">{ticket.requester.universityId}</span>
          </>
        }
        checked={idChecked}
        onChange={(e) => setIdChecked(e.target.checked)}
      />

      <ChoiceGroup legend="Condition" columns={2}>
        {CONDITION_CHECKS.map((option) => (
          <ChoiceCard key={option.value} type="checkbox" label={option.label} checked={checks.includes(option.value)} onChange={(e) => setChecks((list) => toggle(list, option.value, e.target.checked))} />
        ))}
      </ChoiceGroup>
      <Field label="Condition note" optional>
        <Input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="Crack on the lower-left corner" />
      </Field>

      <ChoiceGroup legend="Received with the device" columns={2}>
        {ACCESSORIES.map((option) => (
          <ChoiceCard key={option.value} type="checkbox" label={option.label} checked={accessories.includes(option.value)} onChange={(e) => setAccessories((list) => toggle(list, option.value, e.target.checked))} />
        ))}
      </ChoiceGroup>

      <div className="flex flex-col gap-2">
        <p className="text-small font-semibold text-ink">
          Damage photos <span className="font-normal text-ink-muted">optional</span>
        </p>
        <PhotoUploader photos={photos} onChange={setPhotos} max={MAX_DAMAGE_PHOTOS} endpoint={`/api/staff/tickets/${ticket.id}/photos`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
        <Field label="Zone" optional>
          <Input value={zone} onChange={(e) => setZone(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 1))} placeholder="A" className="font-mono uppercase" />
        </Field>
        <ChoiceGroup legend="Priority" columns={2}>
          <ChoiceCard name={`priority-${ticket.id}`} label="Normal" checked={!urgent} onChange={() => setUrgent(false)} />
          <ChoiceCard name={`priority-${ticket.id}`} label="Urgent" description="Thesis, exam" checked={urgent} onChange={() => setUrgent(true)} />
        </ChoiceGroup>
      </div>

      {ticket.intake.needsPassword ? (
        <Field label="Device password" hint="Encrypted. Only the assigned technician can see it; deleted at pickup.">
          <Input value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" spellCheck={false} />
        </Field>
      ) : null}

      {error ? (
        <p className="text-caption text-error-text" role="alert">
          {error}
        </p>
      ) : null}
      <Button size="lg" loading={pending} onClick={submit}>
        Check in and get tag number
      </Button>
    </div>
  );
}
