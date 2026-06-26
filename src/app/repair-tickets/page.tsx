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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
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
  const hasActiveFilters = Boolean(filters.ticketId || filters.status || filters.dateFrom || filters.dateTo);
  const pageTitle =
    user.role === "TECHNICIAN"
      ? "Assigned ticket list"
      : user.role === "LEAD_TECHNICIAN"
        ? "Ticket queue"
        : "Service desk ticket list";
  const sectionEyebrow =
    user.role === "TECHNICIAN"
      ? "Assigned repairs"
      : user.role === "LEAD_TECHNICIAN"
        ? "Lead queue"
        : "Ticket archive";
  const sectionTitle =
    user.role === "TECHNICIAN"
      ? "Assigned ticket history"
      : user.role === "LEAD_TECHNICIAN"
        ? "All service desk requests"
        : "All repair requests";
  const sectionDescription =
    user.role === "LEAD_TECHNICIAN"
      ? "Search and review service desk requests from the lead technician workspace."
      : user.role === "TECHNICIAN"
        ? "Search and review repair tickets assigned to your technician workspace."
        : "Search and review internal service desk requests without leaving the admin workspace.";

  return (
    <AppShell
      active="tickets"
      eyebrow="Repair tickets"
      title={pageTitle}
      user={user}
      actions={
        <>
          {hasActiveFilters ? (
            <Link href="/repair-tickets" className="btn-secondary">
              Reset filters
            </Link>
          ) : null}
          <Link href="/devices" className="btn-secondary">
            Devices
          </Link>
        </>
      }
    >
      <section className="panel overflow-hidden">
        <div className="border-b border-[var(--border)] bg-white px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">{sectionEyebrow}</p>
              <h2 className="mt-2 text-lg font-semibold text-[var(--foreground)]">{sectionTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                {sectionDescription}
              </p>
            </div>
            <span className="status-badge status-received">{ticketsResult.pagination.totalItems} tickets</span>
          </div>

          <form className="mt-5 grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-4 lg:grid-cols-[1fr_220px_160px_160px_auto]">
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
            <button type="submit" className="btn-primary">
              Apply
            </button>
          </form>
        </div>

        {ticketsResult.tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[860px] text-left text-sm">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Device</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Issue</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {ticketsResult.tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <Link href={`/repair-tickets/${ticket.id}`} className="tracking-code font-bold text-[var(--blue-700)]">
                        {ticket.ticketId}
                      </Link>
                    </td>
                    <td>
                      <p className="font-semibold text-[var(--foreground)]">
                        {ticket.device.brand} {ticket.device.model}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{ticket.device.deviceType}</p>
                    </td>
                    <td>
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="text-[var(--muted-strong)]">{formatDate(ticket.createdAt)}</td>
                    <td className="max-w-[320px] truncate text-[var(--muted-strong)]">{ticket.issueDescription}</td>
                    <td className="text-right">
                      <Link href={`/repair-tickets/${ticket.id}`} className="btn-secondary">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <article className="rounded-lg border border-dashed border-[var(--border-strong)] bg-white p-6">
              <p className="text-sm font-semibold text-[var(--foreground)]">No tickets match the current filters.</p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
                Clear filters or search by another tracking code to review archived service desk requests.
              </p>
              {hasActiveFilters ? (
                <Link href="/repair-tickets" className="btn-secondary mt-4">
                  Clear filters
                </Link>
              ) : null}
            </article>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] bg-white px-5 py-4 text-sm text-[var(--muted)]">
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
    </AppShell>
  );
}
