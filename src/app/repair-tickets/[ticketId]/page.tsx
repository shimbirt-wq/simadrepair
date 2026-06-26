import Link from "next/link";
import Image from "next/image";
import { AppShell } from "@/app/app-shell";
import { notFound, redirect } from "next/navigation";
import { getNextRepairStatus, REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";
import { TechnicianAssignmentForm } from "@/app/repair-tickets/technician-assignment-form";
import { StatusUpdateForm } from "@/app/repair-tickets/status-update-form";
import { getCurrentServerUser } from "@/lib/auth/server-user";
import { isInternalUserRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import { buildTicketQrCodeUrl, buildTicketLookupUrl } from "@/lib/lookup/ticket-lookup-service";
import { getRepairTicketDetail } from "@/lib/repair-tickets/repair-ticket-service";
import { listAssignableTechnicians } from "@/lib/users/user-service";
import { StatusBadge } from "@/app/repair-tickets/status-badge";

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

  if (!isInternalUserRole(user.role)) {
    redirect("/track");
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
  const lookupUrl = buildTicketLookupUrl(ticket.ticketId);
  const qrCodeUrl = buildTicketQrCodeUrl(ticket.ticketId);

  return (
    <AppShell
      active="tickets"
      eyebrow="Repair ticket"
      title={ticket.ticketId}
      user={user}
      actions={
        <Link href="/repair-tickets" className="btn-secondary">
            Back to tickets
        </Link>
      }
    >
      <section className="panel p-6">
        <p className="max-w-3xl text-sm leading-7 text-[var(--muted)]">{ticket.issueDescription}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <article className="panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Status</p>
            <div className="mt-3">
              <StatusBadge status={ticket.status} />
            </div>
          </article>
          <article className="panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Device</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">
              {ticket.device.brand} {ticket.device.model}
            </p>
          </article>
          <article className="panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Requester</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">
              {ticket.device.owner?.fullName ?? ticket.requester?.fullName ?? "Unknown requester"}
            </p>
          </article>
          <article className="panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Assigned technician</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">{ticket.technician?.fullName ?? "Not assigned"}</p>
          </article>
          <article className="panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Photo URL</p>
            <p className="mt-3 text-base font-medium text-[var(--foreground)]">{ticket.photoUrl ?? "Not provided"}</p>
          </article>
          <article className="panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">QR lookup</p>
            <Image src={qrCodeUrl} alt={`QR code for ${ticket.ticketId}`} width={112} height={112} className="mt-3 h-28 w-28" />
            <Link href={lookupUrl} className="mt-3 inline-flex text-sm font-semibold text-[var(--accent)]">
              Open limited lookup
            </Link>
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
            {ticket.events.map((event) => (
              <article key={event.id} className="panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <StatusBadge status={event.status} />
                  <p className="text-sm text-[var(--muted)]">{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(event.createdAt)}</p>
                </div>
                {event.actor ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">Updated by: {event.actor.fullName}</p>
                ) : null}
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{event.note ?? event.eventType.replaceAll("_", " ").toLowerCase()}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
