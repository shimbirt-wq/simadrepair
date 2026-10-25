import { AppShell } from "@/app/app-shell";
import { TechnicianWorkspace } from "@/components/technician/workspace";
import { requirePageRole } from "@/lib/auth/require-page-role";

export default async function TechnicianWorkspacePage() {
  const user = await requirePageRole("/technician/workspace", ["TECHNICIAN", "LEAD_TECHNICIAN"]);

  return (
    <AppShell active="technician" eyebrow="Repairs" title={`Salaam, ${user.fullName.split(" ")[0]}`} user={user}>
      <TechnicianWorkspace />
    </AppShell>
  );
}
