import Link from "next/link";
import { AppShell } from "@/app/app-shell";
import { notFound, redirect } from "next/navigation";
import { RoleUpdateForm } from "@/app/admin/users/role-update-form";
import { getCurrentServerUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
import { getUserById } from "@/lib/users/user-service";

type PageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function AdminUserDetailPage({ params }: PageProps) {
  const currentUser = await getCurrentServerUser();

  if (!currentUser) {
    const { userId } = await params;
    redirect(`/auth/login?next=/admin/users/${userId}`);
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/profile?denied=admin-users");
  }

  const { userId } = await params;
  const user = await getUserById(prisma, userId);

  if (!user) {
    notFound();
  }

  return (
    <AppShell
      active="users"
      eyebrow="Admin user detail"
      title={user.fullName}
      user={currentUser}
      actions={
        <Link href="/admin/users" className="btn-secondary">
          Back to list
        </Link>
      }
    >
      <section className="panel p-6">
        <p className="text-sm leading-7 text-[var(--muted)]">
          Review the public profile fields below and update the access role safely when needed.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            ["Email", user.email],
            ["Current role", user.role],
            ["Account status", user.isActive ? "Active" : "Inactive"],
            ["University ID", user.universityId ?? "Not provided"],
            ["Phone", user.phone ?? "Not provided"],
          ].map(([label, value]) => (
            <article key={label} className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
              <p className="mt-3 text-base font-medium text-[var(--foreground)]">{value}</p>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <RoleUpdateForm currentIsActive={user.isActive} currentRole={user.role} userId={user.id} />
        </div>
      </section>
    </AppShell>
  );
}
