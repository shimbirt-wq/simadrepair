import { CalendarClock } from "lucide-react";
import { ButtonLink, Card, Eyebrow } from "@/components/ui";
import type { ActiveEvent } from "@/lib/events/event-service";
import { formatDay, formatEventDates, type RegistrationState } from "@/lib/events/event-window";

const copy: Record<Exclude<RegistrationState, "OPEN">, { title: string; body: (event: ActiveEvent | null) => string | null }> = {
  NOT_YET_OPEN: {
    title: "Registration opens soon",
    body: (event) => (event ? `Requests open on ${formatDay(event.registrationOpensOn)}.` : null),
  },
  CLOSED: {
    title: "Registration is closed",
    body: (event) => (event ? `Requests for ${event.name} closed on ${formatDay(event.registrationClosesOn)}.` : null),
  },
  NO_EVENT: {
    title: "No Maintenance Week scheduled",
    body: () => "The next Computer Maintenance Week will be announced by SIMAD University.",
  },
};

export function RegistrationClosed({ state, event }: { state: Exclude<RegistrationState, "OPEN">; event: ActiveEvent | null }) {
  const { title, body } = copy[state];

  return (
    <Card className="flex flex-col items-start gap-5 p-8">
      <span className="flex h-12 w-12 items-center justify-center rounded-md bg-accent-soft text-accent">
        <CalendarClock className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-2">
        {event ? <Eyebrow>{event.name}</Eyebrow> : null}
        <h1 className="text-h1 text-ink">{title}</h1>
        <p className="text-body text-ink-secondary">{body(event)}</p>
        {event ? (
          <p className="text-small text-ink-muted">
            {formatEventDates(event.startsOn, event.endsOn)} · {event.venue} · {event.hours}
          </p>
        ) : null}
      </div>
      <ButtonLink href="/track" variant="secondary">
        Track a repair
      </ButtonLink>
    </Card>
  );
}
