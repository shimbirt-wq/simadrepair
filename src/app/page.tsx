import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(11,120,107,0.16),_transparent_38%),linear-gradient(180deg,_#f5f8ff_0%,_#f3efe7_100%)]">
      <section className="border-b border-[var(--border)] bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:px-8">
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                XeelTech Solutions
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-normal text-[var(--foreground)] sm:text-5xl">
                FarsamoTech Repair Hub
              </h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth/login"
                className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
              >
                Register
              </Link>
              <Link
                href="/admin/users"
                className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
              >
                Admin users
              </Link>
              <Link
                href="/devices"
                className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
              >
                Devices
              </Link>
              <Link
                href="/repair-tickets"
                className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
              >
                Repair tickets
              </Link>
              <Link
                href="/api/health"
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                API health
              </Link>
            </div>
          </nav>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                Feature 5
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                Profile access and admin user management are live on this branch
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                Users can inspect their own safe profile fields, while admins get a searchable user directory and a
                controlled role update flow that never exposes password hashes.
              </p>
            </div>

            <div className="grid gap-4">
              <article className="rounded-[1.75rem] border border-[var(--border)] bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Profile</p>
                <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">Current user page</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  Safe public fields only, with password hashes excluded from API and UI responses.
                </p>
              </article>
              <article className="rounded-[1.75rem] border border-[var(--border)] bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Admin</p>
                <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">Search, paginate, update roles</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  Admin-only user listing and safe role changes, including a last-admin guard.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
