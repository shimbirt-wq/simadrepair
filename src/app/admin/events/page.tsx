import { CalendarDays, Plus } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/app/app-shell";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import { requirePageRole } from "@/lib/auth/require-page-role";
import { prisma } from "@/lib/db/prisma";
import { listEvents } from "@/lib/events/event-service";
import { formatDay, formatEventDates, getRegistrationState } from "@/lib/events/event-window";
import { ActivateButton } from "./activate-button";

const registrationLabel = { OPEN: "Registration open", NOT_YET_OPEN: "Opens soon", CLOSED: "Registration closed", NO_EVENT: "" } as const;

export default async function EventsPage() {
  const user = await requirePageRole("/admin/events", ["ADMIN"]);
  const events = await listEvents(prisma);
  const now = new Date();

  return (
    <AppShell
      active="events"
      eyebrow="Admin"
      title="Events"
      user={user}
      actions={
        <ButtonLink href="/admin/events/new" icon={<Plus className="h-4 w-4" strokeWidth={2} />}>
          New event
        </ButtonLink>
      }
    >
      {events.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-8 w-8" strokeWidth={1.5} />}
          title="No Maintenance Week yet. Create one to open registration."
          action={<ButtonLink href="/admin/events/new">New event</ButtonLink>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => {
            const state = getRegistrationState(event, now);
            return (
              <Card key={event.id} focal={event.isActive} className="flex flex-wrap items-center gap-4 p-5">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/events/${event.id}`} className="text-h3 text-ink hover:underline">
                      {event.name}
                    </Link>
                    {event.isActive ? <Badge tone="accent">Active</Badge> : null}
                    {event.isActive ? <Badge tone={state === "OPEN" ? "success" : "neutral"}>{registrationLabel[state]}</Badge> : null}
                  </div>
                  <p className="text-small text-ink-secondary">
                    {formatEventDates(event.startsOn, event.endsOn)} · {event.venue} · {event.hours}
                  </p>
                  <p className="text-caption text-ink-muted">
                    Registration {formatDay(event.registrationOpensOn)} – {formatDay(event.registrationClosesOn)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-right">
                    <span className="block font-mono text-h3 tabular-nums text-ink">{event._count.tickets}</span>
                    <span className="block text-caption text-ink-muted">tickets</span>
                  </span>
                  <ActivateButton eventId={event.id} active={event.isActive} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
