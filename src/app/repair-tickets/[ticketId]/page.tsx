import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";
import { getCurrentServerUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
import { getRepairTicketDetail } from "@/lib/repair-tickets/repair-ticket-service";

type RepairTicketDetailPageProps = {
  params: Promise<{
    ticketId: string;
  }>;
};

export default async function RepairTicketDetailPage({ params }: RepairTicketDetailPageProps) {
  const user = await getCurrentServerUser();

  if (!user) {
    const { ticketId } = await params;
    redirect(`/auth/login?next=/repair-tickets/${ticketId}`);
  }

  const { ticketId } = await params;
  const result = await getRepairTicketDetail(prisma, user, ticketId);

  if (!result.ok) {
    if (result.status === 404) {
      notFound();
    }

    redirect("/repair-tickets");
  }

  const { ticket } = result;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-14">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Repair ticket</p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{ticket.ticketId}</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{ticket.issueDescription}</p>
          </div>
          <Link
            href="/repair-tickets"
            className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
          >
            Back to tickets
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Status</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">{REPAIR_STATUS_LABELS[ticket.status]}</p>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Device</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">
              {ticket.device.brand} {ticket.device.model}
            </p>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Owner</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">{ticket.device.owner.fullName}</p>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Photo URL</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">{ticket.photoUrl ?? "Not provided"}</p>
          </article>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Timeline</h2>
          <div className="mt-4 grid gap-4">
            {ticket.logs.map((log) => (
              <article key={log.id} className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{REPAIR_STATUS_LABELS[log.status]}</p>
                  <p className="text-sm text-[var(--muted)]">{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(log.createdAt)}</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{log.repairNotes ?? "No repair note recorded."}</p>
                {log.diagnosis ? <p className="mt-2 text-sm leading-7 text-[var(--muted)]">Diagnosis: {log.diagnosis}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
