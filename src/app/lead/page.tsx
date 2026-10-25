import { AppShell } from "@/app/app-shell";
import { LeadBoard } from "@/components/staff/lead-board";
import { requirePageRole } from "@/lib/auth/require-page-role";

export default async function LeadBoardPage() {
  const user = await requirePageRole("/lead", ["LEAD_TECHNICIAN", "ADMIN"]);

  return (
    <AppShell active="lead" eyebrow="Desk" title="Board" user={user} width="wide">
      <LeadBoard isAdmin={user.role === "ADMIN"} />
    </AppShell>
  );
}
