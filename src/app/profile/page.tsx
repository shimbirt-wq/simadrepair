import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/app/app-shell";
import { getCurrentServerUser } from "@/lib/auth/server-user";
import { isInternalUserRole, ROLE_LABELS } from "@/lib/auth/roles";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

const profileFields = [
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "universityId", label: "University ID" },
  { key: "faculty", label: "Faculty" },
  { key: "department", label: "Department" },
  { key: "phone", label: "Phone" },
] as const;

function formatProfileValue(user: NonNullable<Awaited<ReturnType<typeof getCurrentServerUser>>>, key: (typeof profileFields)[number]["key"]) {
  if (key === "role") {
    return ROLE_LABELS[user.role];
  }

  return user[key] ? String(user[key]) : "Not provided";
}

export default async function ProfilePage() {
  const user = await getCurrentServerUser();
  const deniedMessage =
    "Admin tools require an authenticated admin account. Sign in with an admin user to open search, pagination, and role management.";

  if (!user) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center px-4 py-10">
        <section className="panel w-full max-w-3xl p-8">
          <p className="eyebrow">Profile access</p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Sign in to view your profile</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted)]">
            This page shows the authenticated user profile only. Use the registration or login API first, then refresh
            this screen.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/auth/login" className="btn-primary">
              Sign in
            </Link>
            <Link href="/auth/register" className="btn-secondary">
              Create account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!isInternalUserRole(user.role)) {
    redirect("/request-repair");
  }

  return (
    <AppShell
      active="profile"
      eyebrow="Profile"
      title={user.fullName}
      user={user}
      actions={
        <Link href="/dashboard" className="btn-secondary">
          Open dashboard
        </Link>
      }
    >
      <section className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="eyebrow">Account details</p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">Profile information</h2>
            <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Review your staff identity, department, and contact details used across the service desk workspace.
            </p>
            {user.role !== "ADMIN" ? (
              <p className="mt-4 max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                {deniedMessage}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            {user.role === "ADMIN" ? (
              <Link href="/admin/users" className="btn-secondary">
                Manage staff
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {profileFields.map(({ key, label }) => (
            <article key={key} className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
              <p className="mt-3 text-base font-medium text-[var(--foreground)]">
                {formatProfileValue(user, key)}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Created</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">{formatDate(user.createdAt)}</p>
          </article>
          <article className="rounded-xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Updated</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">{formatDate(user.updatedAt)}</p>
          </article>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-[var(--border)] bg-white p-5">
            <p className="eyebrow">Security</p>
            <h3 className="mt-3 text-base font-semibold text-[var(--foreground)]">Protected staff account</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Passwords and session secrets are not exposed in this workspace. Contact an administrator for account access changes.
            </p>
          </article>
          <article className="rounded-xl border border-[var(--border)] bg-white p-5">
            <p className="eyebrow">Preferences</p>
            <h3 className="mt-3 text-base font-semibold text-[var(--foreground)]">Manual WhatsApp updates</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Requester updates are sent manually from the repair workspace when a device is ready for pickup.
            </p>
          </article>
        </div>
      </section>
    </AppShell>
  );
}
