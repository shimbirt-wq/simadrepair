import { AppShell } from "@/app/app-shell";
import { LeadBoard } from "@/components/staff/lead-board";
import { requirePageRole } from "@/lib/auth/require-page-role";

export default async function LeadBoardPage({ searchParams }: { searchParams: Promise<{ ticket?: string | string[] }> }) {
  const user = await requirePageRole("/lead", ["LEAD_TECHNICIAN", "ADMIN"]);

  const ticket = [(await searchParams).ticket].flat()[0] ?? null;

  return (
    <AppShell active="lead" eyebrow="Desk" title="Board" user={user} width="wide">
      <LeadBoard isAdmin={user.role === "ADMIN"} initialTicket={ticket} />
    </AppShell>
  );
}
