import { AppShell } from "@/app/app-shell";
import { redirect } from "next/navigation";
import { getCurrentServerUser } from "@/lib/auth/server-user";
import { CreateStaffForm } from "./create-staff-form";

export default async function CreateStaffAccountPage() {
  const currentUser = await getCurrentServerUser();

  if (!currentUser) {
    redirect("/auth/login?next=/admin/users/new");
  }

  if (currentUser.role !== "ADMIN" && currentUser.role !== "LEAD_TECHNICIAN") {
    redirect("/dashboard");
  }

  return (
    <AppShell
      active="users"
      eyebrow="Staff management"
      title={currentUser.role === "LEAD_TECHNICIAN" ? "Add Technician" : "Create Staff Account"}
      user={currentUser}
    >
      <CreateStaffForm actorRole={currentUser.role} />
    </AppShell>
  );
}
