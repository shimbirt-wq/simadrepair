import { notFound } from "next/navigation";
import { AppShell } from "@/app/app-shell";
import { requirePageRole } from "@/lib/auth/require-page-role";
import { prisma } from "@/lib/db/prisma";
import { getEvent, LEGACY_EVENT_ID } from "@/lib/events/event-service";
import { dateOnly } from "@/lib/events/event-window";
import { EventForm } from "../event-form";

export default async function EditEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const user = await requirePageRole(`/admin/events/${eventId}`, ["ADMIN"]);
  const event = eventId === LEGACY_EVENT_ID ? null : await getEvent(prisma, eventId);
  if (!event) notFound();

  return (
    <AppShell active="events" eyebrow="Events" title={event.name} user={user}>
      <EventForm
        eventId={event.id}
        initial={{
          name: event.name,
          startsOn: dateOnly(event.startsOn),
          endsOn: dateOnly(event.endsOn),
          registrationOpensOn: dateOnly(event.registrationOpensOn),
          registrationClosesOn: dateOnly(event.registrationClosesOn),
          venue: event.venue,
          hours: event.hours,
          deskWhatsapp: event.deskWhatsapp,
          holdDays: event.holdDays,
        }}
      />
    </AppShell>
  );
}
