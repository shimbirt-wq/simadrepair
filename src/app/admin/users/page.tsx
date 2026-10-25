import { AppShell } from "@/app/app-shell";
import { hasAccess } from "@/lib/auth/public-user";
import { requirePageRole } from "@/lib/auth/require-page-role";
import { prisma } from "@/lib/db/prisma";
import { getActiveEvent } from "@/lib/events/event-service";
import { formatDay } from "@/lib/events/event-window";
import { listStaff } from "@/lib/staff/staff-service";
import { StaffTable, type StaffRow } from "./staff-table";

export default async function StaffPage() {
  const user = await requirePageRole("/admin/users", ["ADMIN"]);
  const [staff, event] = await Promise.all([listStaff(prisma), getActiveEvent(prisma)]);

  const rows: StaffRow[] = staff.map((member) => ({
    id: member.id,
    fullName: member.fullName,
    email: member.email,
    phone: member.phone,
    role: member.role,
    skills: member.skills,
    status: !member.isActive ? "INACTIVE" : hasAccess(member) ? "ACTIVE" : "EXPIRED",
    expiresOn: member.accessExpiresOn ? formatDay(member.accessExpiresOn) : null,
  }));

  return (
    <AppShell active="users" eyebrow="Admin" title="Staff" user={user}>
      <StaffTable rows={rows} eventName={event?.name ?? null} currentUserId={user.id} />
    </AppShell>
  );
}
