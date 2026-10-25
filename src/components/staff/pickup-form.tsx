"use client";

import { useState, useTransition } from "react";
import { Button, ChoiceCard, ChoiceGroup, Field, Input, TagNumber, useToast } from "@/components/ui";
import { sendJson } from "@/lib/client/api";

export type PickupTicket = { id: string; tagNumber: number | null; device: string; universityId: string; accessoriesReceived: Array<{ value: string; label: string }> };

/** Hand a device back: owner's ID card checked, real collector recorded, accessories ticked off (LD8, D10). */
export function PickupForm({ ticket, onDone }: { ticket: PickupTicket; onDone: () => void }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [idChecked, setIdChecked] = useState(false);
  const [returned, setReturned] = useState<string[]>(ticket.accessoriesReceived.map((a) => a.value));
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await sendJson(`/api/staff/tickets/${ticket.id}/actions`, "POST", {
        type: "PICKUP",
        idChecked,
        collectedByName: name,
        collectedByPhone: phone || null,
        accessoriesReturned: returned,
      });
      if (!result.ok) {
        setError(Object.values(result.issues)[0]?.[0] ?? result.error);
        return;
      }
      toast.success("Device handed back");
      onDone();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ChoiceCard
        type="checkbox"
        checked={idChecked}
        onChange={(e) => setIdChecked(e.target.checked)}
        label="Owner's ID card checked"
        description={
          <>
            Card shows <span className="font-mono font-semibold text-ink">{ticket.universityId}</span> and the sticker shows{" "}
            <span className="font-mono font-semibold text-ink">{ticket.tagNumber ? `#${ticket.tagNumber.toString().padStart(3, "0")}` : "the code"}</span>
          </>
        }
      />
      {ticket.accessoriesReceived.length ? (
        <ChoiceGroup legend="Returned" columns={2}>
          {ticket.accessoriesReceived.map((accessory) => (
            <ChoiceCard
              key={accessory.value}
              type="checkbox"
              label={accessory.label}
              checked={returned.includes(accessory.value)}
              onChange={(e) => setReturned((list) => (e.target.checked ? [...list, accessory.value] : list.filter((v) => v !== accessory.value)))}
            />
          ))}
        </ChoiceGroup>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Collected by">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        </Field>
        <Field label="Their phone" optional>
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>
      {error ? (
        <p className="text-caption text-error-text" role="alert">
          {error}
        </p>
      ) : null}
      <Button size="lg" loading={pending} disabled={!idChecked || name.trim().length < 3} onClick={submit} icon={ticket.tagNumber ? <TagNumber tag={ticket.tagNumber} size="sm" className="text-white" /> : undefined}>
        Hand back
      </Button>
    </div>
  );
}
