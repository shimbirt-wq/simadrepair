import type { Metadata } from "next";
import Link from "next/link";
import { SimadRepairLogo } from "@/components/brand/simad-repair-logo";
import { Card } from "@/components/ui";
import { LoginForm } from "@/app/auth/login/login-form";
import { getSafeNextPath } from "@/app/auth/login/redirects";
import { getAuthRuntimeIssue } from "@/lib/config/runtime";

export const metadata: Metadata = { title: "Staff sign-in", description: "Sign-in for SIMAD IT Service Desk staff and volunteer technicians.", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ next?: string }> }) {
  const nextPath = getSafeNextPath((searchParams ? await searchParams : undefined)?.next);
  const runtimeIssue = getAuthRuntimeIssue();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-app px-4 py-12">
      <Link href="/" aria-label="SIMADRepair home">
        <SimadRepairLogo className="h-9 w-auto" />
      </Link>
      <Card className="flex w-full max-w-[400px] flex-col gap-6 p-7 sm:p-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-h2 text-ink">Staff sign-in</h1>
          <p className="text-small text-ink-secondary">
            Staff only. Students use{" "}
            <Link href="/request-repair" className="font-medium text-ink-accent hover:underline">
              Request repair
            </Link>{" "}
            or{" "}
            <Link href="/track" className="font-medium text-ink-accent hover:underline">
              Track
            </Link>
            .
          </p>
        </div>
        <LoginForm nextPath={nextPath} />
        {runtimeIssue ? (
          <div className="rounded-md border border-error bg-error-soft px-4 py-3">
            <p className="text-small font-semibold text-error-text">Configuration required</p>
            <p className="mt-1 text-small text-error-text">{runtimeIssue}</p>
          </div>
        ) : null}
      </Card>
    </main>
  );
}
