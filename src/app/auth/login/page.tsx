import { LoginForm } from "@/app/auth/login/login-form";
import { getAuthRuntimeIssue } from "@/lib/config/runtime";
import { LOCAL_SEED_LOGIN_ACCOUNTS, LOCAL_SEED_PASSWORD } from "../../../../prisma/seed-helpers";

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
    <main className="app-shell">
      <div className="page-container grid min-h-screen items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <LoginForm nextPath={nextPath} />

        <aside className="panel p-8">
          <p className="eyebrow">Access notes</p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">Admin tools stay protected</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            In line with the project architecture and security constraints, admin user listing, search, pagination,
            and role updates only unlock after a verified admin session is active.
          </p>

          {runtimeIssue ? (
            <div className="mt-6 rounded-lg border border-[var(--fill-danger-soft-border)] bg-[var(--danger-bg)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--danger)]">Configuration required</p>
              <p className="mt-3 text-sm leading-7 text-[var(--red-800)]">{runtimeIssue}</p>
            </div>
          ) : null}

          {showSeedHint ? (
            <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Local seed accounts</p>
              <div className="mt-3 space-y-2">
                {LOCAL_SEED_LOGIN_ACCOUNTS.map((account) => (
                  <div key={account.role} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-[var(--foreground)]">{account.label}</span>
                    <span className="font-mono text-xs text-[var(--muted)]">{account.email}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-[var(--foreground)]">Password: {LOCAL_SEED_PASSWORD}</p>
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
