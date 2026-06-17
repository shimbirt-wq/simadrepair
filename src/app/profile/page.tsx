import Link from "next/link";
import { getCurrentServerUser } from "@/lib/auth/server-user";

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

export default async function ProfilePage() {
  const user = await getCurrentServerUser();
  const deniedMessage =
    "Admin tools require an authenticated admin account. Sign in with an admin user to open search, pagination, and role management.";

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
        <section className="w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Profile access</p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Sign in to view your profile</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted)]">
            This page shows the authenticated user profile only. Use the registration or login API first, then refresh
            this screen.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/auth/login"
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
            >
              Create account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-14">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Profile</p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{user.fullName}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Your account profile stays limited to safe public fields only. Password hashes and protected auth details
              are never returned here.
            </p>
            {user.role !== "ADMIN" ? (
              <p className="mt-4 max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                {deniedMessage}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/devices"
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              My devices
            </Link>
            {(user.role === "STUDENT" || user.role === "LECTURER") ? (
              <Link
                href="/repair-tickets"
                className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
              >
                Repair tickets
              </Link>
            ) : null}
            {user.role === "ADMIN" ? (
              <Link
                href="/admin/users"
                className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
              >
                Open admin users
              </Link>
            ) : null}
            <Link
              href="/api/users/me"
              className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
            >
              Open JSON
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {profileFields.map(({ key, label }) => (
            <article key={key} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
              <p className="mt-3 text-base font-medium text-[var(--foreground)]">
                {user[key] ? String(user[key]) : "Not provided"}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Created</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">{formatDate(user.createdAt)}</p>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Updated</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">{formatDate(user.updatedAt)}</p>
          </article>
        </div>
      </section>
    </main>
  );
}
