import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSafeTicketLookup } from "@/lib/lookup/ticket-lookup-service";
import { ticketLookupSchema } from "@/lib/validations/lookup";

type LookupPageProps = {
  params: Promise<{
    ticketId: string;
  }>;
};

export default async function LookupPage({ params }: LookupPageProps) {
  const { ticketId } = await params;
  const parsed = ticketLookupSchema.safeParse({ ticketId });

  if (!parsed.success) {
    notFound();
  }

  const lookup = await getSafeTicketLookup(prisma, parsed.data.ticketId);

  if (!lookup) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-14">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Ticket lookup</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{lookup.ticketId}</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-[var(--border)] bg-white p-5">
            <p className="text-sm text-[var(--muted)]">Status</p>
            <p className="mt-2 font-semibold">{lookup.statusLabel}</p>
          </article>
          <article className="rounded-xl border border-[var(--border)] bg-white p-5">
            <p className="text-sm text-[var(--muted)]">Device type</p>
            <p className="mt-2 font-semibold">{lookup.deviceType}</p>
          </article>
        </div>
        <p className="mt-6 text-sm leading-6 text-[var(--muted)]">
          Full repair details require an authorized account. This lookup intentionally hides owner details and internal notes.
        </p>
        <Link href="/auth/login" className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white">
          Sign in for full detail
        </Link>
      </section>
    </main>
  );
}
