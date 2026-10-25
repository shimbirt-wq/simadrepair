import { PublicLayout } from "@/components/public/public-layout";
import { RegistrationClosed } from "@/components/public/registration-closed";
import { RequestForm } from "@/components/public/request-form";
import { Eyebrow } from "@/components/ui";
import { prisma } from "@/lib/db/prisma";
import { getRegistration } from "@/lib/events/event-service";
import { formatEventDates } from "@/lib/events/event-window";

export const dynamic = "force-dynamic";
export const metadata = { title: "Request a repair", description: "Register your laptop or desktop for the free Computer Maintenance Program repair." };

export default async function RequestRepairPage() {
  const { state, event } = await getRegistration(prisma);

  if (state !== "OPEN" || !event) {
    return (
      <PublicLayout width="form">
        <RegistrationClosed state={state === "OPEN" ? "NO_EVENT" : state} event={event} />
      </PublicLayout>
    );
  }

  return (
    <PublicLayout width="form">
      <div className="mb-8 flex flex-col gap-2">
        <Eyebrow>
          {event.name} · {formatEventDates(event.startsOn, event.endsOn)}
        </Eyebrow>
        <h1 className="text-h1 text-ink">Request a repair</h1>
      </div>
      <RequestForm
        event={{ name: event.name, venue: event.venue, hours: event.hours, dates: formatEventDates(event.startsOn, event.endsOn), holdDays: event.holdDays }}
      />
    </PublicLayout>
  );
}
