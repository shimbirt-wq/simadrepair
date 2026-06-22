import Link from "next/link";
import { SimadRepairLogo } from "@/components/brand/simad-repair-logo";
import { PublicRepairRequestForm } from "@/components/service-desk/public-repair-request-form";

export default function RequestRepairPage() {
  return (
    <main className="app-shell">
      <section className="border-b border-[var(--border)] bg-white">
        <div className="page-container">
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" aria-label="SIMADRepair home">
              <SimadRepairLogo className="h-12 w-auto" />
            </Link>
            <Link href="/auth/login" className="btn-secondary">
              Staff login
            </Link>
          </nav>
        </div>
      </section>

      <section className="page-container grid gap-8 py-8 lg:grid-cols-[0.82fr_1.18fr] lg:py-12">
        <div className="lg:pt-8">
          <p className="eyebrow">SIMAD computer maintenance</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-normal text-[var(--foreground)] sm:text-5xl">
            Request help for your computer without creating an account.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-[var(--muted-strong)]">
            Students and lecturers can submit laptop or desktop repair issues here. After submitting, keep your
            tracking code so you can check the repair status later.
          </p>

          <div className="mt-8 grid gap-3 rounded-lg border border-[var(--border)] bg-white p-5">
            <div>
              <p className="text-sm font-bold text-[var(--foreground)]">Before you submit</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Include your SIMAD ID, reachable phone number, device details, and a clear description of the issue.
              </p>
            </div>
            <div className="border-t border-[var(--border)] pt-4">
              <p className="text-sm font-bold text-[var(--foreground)]">What happens next</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                The maintenance team reviews the request and decides the next repair step. Do not leave your device
                until staff confirm it should be received.
              </p>
            </div>
          </div>
        </div>

        <PublicRepairRequestForm />
      </section>
    </main>
  );
}
