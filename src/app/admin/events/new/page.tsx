import { AppShell } from "@/app/app-shell";
import { requirePageRole } from "@/lib/auth/require-page-role";
import { EventForm } from "../event-form";

export default async function NewEventPage() {
  const user = await requirePageRole("/admin/events/new", ["ADMIN"]);
  const year = new Date().getFullYear();

  return (
    <AppShell active="events" eyebrow="Events" title="New event" user={user}>
      <EventForm
        initial={{
          name: `Computer Maintenance Week ${year}`,
          startsOn: "",
          endsOn: "",
          registrationOpensOn: "",
          registrationClosesOn: "",
          venue: "",
          hours: "8:00–16:00",
          deskWhatsapp: "",
          holdDays: 30,
        }}
      />
    </AppShell>
  );
}
