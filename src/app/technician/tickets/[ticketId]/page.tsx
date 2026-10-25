import { AppShell } from "@/app/app-shell";
import { TechnicianTicketView } from "@/components/technician/ticket-view";
import { requirePageRole } from "@/lib/auth/require-page-role";

export default async function TechnicianTicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const user = await requirePageRole(`/technician/tickets/${ticketId}`, ["TECHNICIAN", "LEAD_TECHNICIAN"]);

  return (
    <AppShell active="technician" eyebrow="Repairs" title="Ticket" user={user}>
      <TechnicianTicketView ticketId={ticketId} userId={user.id} />
    </AppShell>
  );
}
