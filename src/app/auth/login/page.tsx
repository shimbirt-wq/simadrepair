import { LoginForm } from "@/app/auth/login/login-form";
import { getAuthRuntimeIssue } from "@/lib/config/runtime";
import { LOCAL_SEED_EMAIL_DOMAIN, LOCAL_SEED_PASSWORD } from "../../../../prisma/seed-helpers";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const showSeedHint = process.env.NODE_ENV !== "production";
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = resolvedSearchParams?.next || "/profile";
  const runtimeIssue = getAuthRuntimeIssue();

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-14">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <LoginForm nextPath={nextPath} />

        <aside className="rounded-[2rem] border border-[var(--border)] bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Access notes</p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">Admin tools stay protected</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            In line with the project architecture and security constraints, admin user listing, search, pagination,
            and role updates only unlock after a verified admin session is active.
          </p>

          {runtimeIssue ? (
            <div className="mt-6 rounded-3xl border border-[#e9b5b5] bg-[#fff3f1] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9f2c2c]">Configuration required</p>
              <p className="mt-3 text-sm leading-7 text-[#7b2323]">{runtimeIssue}</p>
            </div>
          ) : null}

          {showSeedHint ? (
            <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface-alt)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Local seed admin</p>
              <p className="mt-3 text-sm text-[var(--foreground)]">Email: {`admin@${LOCAL_SEED_EMAIL_DOMAIN}`}</p>
              <p className="mt-1 text-sm text-[var(--foreground)]">Password: {LOCAL_SEED_PASSWORD}</p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                This is for local development only. If the account does not exist yet, run the Prisma seed command.
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
