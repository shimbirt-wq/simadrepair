import Link from "next/link";
import { AppShell } from "@/app/app-shell";
import { redirect } from "next/navigation";
import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";
import { prisma } from "@/lib/db/prisma";
import { listRepairTickets } from "@/lib/repair-tickets/repair-ticket-service";
import { getCurrentServerUser } from "@/lib/auth/server-user";
import { isInternalUserRole } from "@/lib/auth/roles";
import { StatusBadge } from "@/app/repair-tickets/status-badge";
import { repairTicketListQuerySchema } from "@/lib/validations/repair-ticket-filters";

type RepairTicketsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RepairTicketsPage({ searchParams }: RepairTicketsPageProps) {
  const user = await getCurrentServerUser();

  if (!user) {
    redirect("/auth/login?next=/repair-tickets");
  }

  if (!isInternalUserRole(user.role)) {
    redirect("/track");
  }

  const params = await searchParams;
  const filters = repairTicketListQuerySchema.parse({
    page: readSearchParam(params.page),
    pageSize: readSearchParam(params.pageSize),
    status: readSearchParam(params.status),
    ticketId: readSearchParam(params.ticketId),
    dateFrom: readSearchParam(params.dateFrom),
    dateTo: readSearchParam(params.dateTo),
  });

  const ticketsResult = await listRepairTickets(prisma, user, filters);

  return (
    <AppShell
      active="tickets"
      eyebrow="Repair tickets"
      title={user.role === "TECHNICIAN" ? "Assigned ticket list" : "Service desk ticket list"}
      user={user}
      actions={
        <Link href="/devices" className="btn-secondary">
          Devices
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="panel p-8">
          <p className="eyebrow">Ticket scope</p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {user.role === "TECHNICIAN" ? "Assigned tickets" : "All repair tickets"}
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Students and lecturers submit new requests through the public repair intake. This workspace is for internal
            service desk review and execution.
          </p>
        </section>

        <section className="panel p-6">
          <form className="mt-8 grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-5 sm:grid-cols-2">
            <input
              type="search"
              name="ticketId"
              defaultValue={filters.ticketId ?? ""}
              placeholder="Filter by ticket ID"
              className="field-control"
            />
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className="field-control"
            >
              <option value="">All statuses</option>
              {Object.entries(REPAIR_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="date"
              name="dateFrom"
              defaultValue={filters.dateFrom ?? ""}
              className="field-control"
            />
            <input
              type="date"
              name="dateTo"
              defaultValue={filters.dateTo ?? ""}
              className="field-control"
            />
            <input type="hidden" name="pageSize" value={String(filters.pageSize)} />
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="btn-primary"
              >
                Apply filters
              </button>
            </div>
          </form>

          <div className="mt-8 grid gap-4">
            {ticketsResult.tickets.length > 0 ? (
              ticketsResult.tickets.map((ticket) => (
                <article key={ticket.id} className="panel p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--foreground)]">{ticket.ticketId}</h2>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {ticket.device.brand} {ticket.device.model}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <StatusBadge status={ticket.status} />
                      <Link
                        href={`/repair-tickets/${ticket.id}`}
                        className="btn-secondary"
                      >
                        View ticket
                      </Link>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{ticket.issueDescription}</p>
                </article>
              ))
            ) : (
              <article className="panel p-5">
                <p className="text-sm text-[var(--muted)]">No tickets match the current filters.</p>
              </article>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-[var(--muted)]">
            <p>
              Page {ticketsResult.pagination.page} of {ticketsResult.pagination.totalPages} - {ticketsResult.pagination.totalItems} tickets
            </p>
            <div className="flex gap-3">
              {ticketsResult.pagination.page > 1 ? (
                <Link
                  href={`/repair-tickets?page=${ticketsResult.pagination.page - 1}&pageSize=${ticketsResult.pagination.pageSize}&status=${filters.status ?? ""}&ticketId=${encodeURIComponent(filters.ticketId ?? "")}&dateFrom=${filters.dateFrom ?? ""}&dateTo=${filters.dateTo ?? ""}`}
                  className="btn-secondary"
                >
                  Previous
                </Link>
              ) : null}
              {ticketsResult.pagination.page < ticketsResult.pagination.totalPages ? (
                <Link
                  href={`/repair-tickets?page=${ticketsResult.pagination.page + 1}&pageSize=${ticketsResult.pagination.pageSize}&status=${filters.status ?? ""}&ticketId=${encodeURIComponent(filters.ticketId ?? "")}&dateFrom=${filters.dateFrom ?? ""}&dateTo=${filters.dateTo ?? ""}`}
                  className="btn-secondary"
                >
                  Next
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
