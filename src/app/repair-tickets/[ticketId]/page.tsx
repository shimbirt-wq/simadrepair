import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getNextRepairStatus, REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";
import { TechnicianAssignmentForm } from "@/app/repair-tickets/technician-assignment-form";
import { StatusUpdateForm } from "@/app/repair-tickets/status-update-form";
import { getCurrentServerUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
import { getRepairTicketDetail } from "@/lib/repair-tickets/repair-ticket-service";
import { listAssignableTechnicians } from "@/lib/users/user-service";

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
  const [result, technicians] = await Promise.all([
    getRepairTicketDetail(prisma, user, ticketId),
    user.role === "ADMIN" ? listAssignableTechnicians(prisma) : Promise.resolve([]),
  ]);

  if (!result.ok) {
    if (result.status === 404) {
      notFound();
    }

    redirect("/repair-tickets");
  }

  const { ticket } = result;
  const nextStatus = getNextRepairStatus(ticket.status);
  const canUpdateStatus = user.role === "ADMIN" || (user.role === "TECHNICIAN" && ticket.technicianId === user.id);

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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Assigned technician</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">{ticket.technician?.fullName ?? "Not assigned"}</p>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Photo URL</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">{ticket.photoUrl ?? "Not provided"}</p>
          </article>
        </div>

        {user.role === "ADMIN" ? (
          <div className="mt-8">
            <TechnicianAssignmentForm
              currentTechnicianId={ticket.technicianId}
              technicians={technicians.map((technician) => ({
                id: technician.id,
                fullName: technician.fullName,
                email: technician.email,
              }))}
              ticketId={ticket.id}
            />
          </div>
        ) : null}

        {canUpdateStatus && nextStatus ? (
          <div className="mt-8">
            <StatusUpdateForm
              currentStatus={ticket.status}
              nextStatus={nextStatus}
              nextStatusLabel={REPAIR_STATUS_LABELS[nextStatus]}
              ticketId={ticket.id}
            />
          </div>
        ) : null}

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
