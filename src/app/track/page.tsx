import Link from "next/link";
import { SimadRepairLogo } from "@/components/brand/simad-repair-logo";
import { PublicTracking } from "@/components/service-desk/public-tracking";

type TrackPageProps = {
  searchParams: Promise<{
    code?: string | string[];
  }>;
};

function getInitialCode(code: string | string[] | undefined) {
  if (Array.isArray(code)) {
    return code[0] ?? "";
  }

  return code ?? "";
}

export default async function TrackPage({ searchParams }: TrackPageProps) {
  const params = await searchParams;
  const initialCode = getInitialCode(params.code);

  return (
    <main className="app-shell">
      <section className="border-b border-[var(--border)] bg-white">
        <div className="page-container">
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" aria-label="SIMADRepair home">
              <SimadRepairLogo className="h-12 w-auto" />
            </Link>
            <Link href="/request-repair" className="btn-secondary">
              Request repair
            </Link>
          </nav>
        </div>
      </section>

      <section className="page-container grid gap-8 py-8 lg:grid-cols-[0.78fr_1.22fr] lg:py-12">
        <div className="lg:pt-8">
          <p className="eyebrow">Public repair tracking</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-normal text-[var(--foreground)] sm:text-5xl">
            Check your SIMAD computer maintenance progress.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-[var(--muted-strong)]">
            Use the tracking code from your repair request confirmation. This page only shows public repair progress,
            not private contact details or internal technician notes.
          </p>

          <div className="mt-8 rounded-lg border border-[var(--border)] bg-white p-5">
            <p className="text-sm font-bold text-[var(--foreground)]">Privacy note</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Tracking results are limited to safe status details such as request progress, device type, issue category,
              and public timeline updates.
            </p>
          </div>
        </div>

        <PublicTracking initialCode={initialCode} />
      </section>
    </main>
  );
}
