"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Card, Field, Input } from "@/components/ui";
import { firstIssue, sendJson } from "@/lib/client/api";

export type EventFormValues = {
  name: string;
  startsOn: string;
  endsOn: string;
  registrationOpensOn: string;
  registrationClosesOn: string;
  venue: string;
  hours: string;
  deskWhatsapp: string;
  holdDays: number;
};

export function EventForm({ eventId, initial }: { eventId?: string; initial: EventFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [issues, setIssues] = useState<Record<string, string[] | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (field: keyof EventFormValues) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setValues((current) => ({ ...current, [field]: field === "holdDays" ? Number(event.target.value) : event.target.value }));
  const issue = (field: string) => firstIssue(issues, field);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = eventId
        ? await sendJson(`/api/admin/events/${eventId}`, "PATCH", values)
        : await sendJson<{ event: { id: string } }>("/api/admin/events", "POST", { ...values, activate: true });
      if (!result.ok) {
        setIssues(result.issues);
        setError(result.error);
        return;
      }
      router.push("/admin/events");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex max-w-form flex-col gap-6" noValidate>
      <Card className="flex flex-col gap-5 p-6">
        <Field label="Name" error={issue("name")}>
          <Input value={values.name} onChange={set("name")} placeholder="Computer Maintenance Week 2026" aria-invalid={Boolean(issue("name"))} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First day" error={issue("startsOn")}>
            <Input type="date" value={values.startsOn} onChange={set("startsOn")} aria-invalid={Boolean(issue("startsOn"))} />
          </Field>
          <Field label="Last day" error={issue("endsOn")}>
            <Input type="date" value={values.endsOn} onChange={set("endsOn")} aria-invalid={Boolean(issue("endsOn"))} />
          </Field>
          <Field label="Registration opens" error={issue("registrationOpensOn")}>
            <Input type="date" value={values.registrationOpensOn} onChange={set("registrationOpensOn")} aria-invalid={Boolean(issue("registrationOpensOn"))} />
          </Field>
          <Field label="Registration closes" error={issue("registrationClosesOn")}>
            <Input type="date" value={values.registrationClosesOn} onChange={set("registrationClosesOn")} aria-invalid={Boolean(issue("registrationClosesOn"))} />
          </Field>
        </div>
      </Card>

      <Card className="flex flex-col gap-5 p-6">
        <Field label="Venue" hint="Where students drop off and collect devices." error={issue("venue")}>
          <Input value={values.venue} onChange={set("venue")} placeholder="Main Hall, Block B" aria-invalid={Boolean(issue("venue"))} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Hours" error={issue("hours")}>
            <Input value={values.hours} onChange={set("hours")} placeholder="8:00–16:00" aria-invalid={Boolean(issue("hours"))} />
          </Field>
          <Field label="Desk WhatsApp" error={issue("deskWhatsapp")}>
            <Input type="tel" value={values.deskWhatsapp} onChange={set("deskWhatsapp")} placeholder="+252 61 234 5678" aria-invalid={Boolean(issue("deskWhatsapp"))} />
          </Field>
        </div>
        <Field label="Keep uncollected devices for" hint="Days after the event ends." error={issue("holdDays")}>
          <Input type="number" min={1} max={365} value={values.holdDays} onChange={set("holdDays")} className="max-w-32" aria-invalid={Boolean(issue("holdDays"))} />
        </Field>
      </Card>

      {error ? <p className="text-small text-error-text" role="alert">{error}</p> : null}

      <div className="flex gap-2">
        <Button type="submit" loading={pending}>
          {eventId ? "Save changes" : "Create and activate"}
        </Button>
        <Button variant="ghost" onClick={() => router.push("/admin/events")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
