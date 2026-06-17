import Link from "next/link";
import { redirect } from "next/navigation";
import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";
import { prisma } from "@/lib/db/prisma";
import { listDevices } from "@/lib/devices/device-service";
import { listRepairTickets } from "@/lib/repair-tickets/repair-ticket-service";
import { getCurrentServerUser } from "@/lib/auth/server-user";
import { RepairTicketForm } from "@/app/repair-tickets/repair-ticket-form";
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

  const params = await searchParams;
  const filters = repairTicketListQuerySchema.parse({
    page: readSearchParam(params.page),
    pageSize: readSearchParam(params.pageSize),
    status: readSearchParam(params.status),
    ticketId: readSearchParam(params.ticketId),
    dateFrom: readSearchParam(params.dateFrom),
    dateTo: readSearchParam(params.dateTo),
  });

  const [ticketsResult, deviceResult] = await Promise.all([
    listRepairTickets(prisma, user, filters),
    user.role === "STUDENT" || user.role === "LECTURER"
      ? listDevices(prisma, user, {
          page: 1,
          pageSize: 25,
          query: undefined,
          ownerId: user.id,
        })
      : Promise.resolve({ devices: [], pagination: { page: 1, pageSize: 25, totalItems: 0, totalPages: 1 } }),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-14">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        {user.role === "STUDENT" || user.role === "LECTURER" ? (
          <RepairTicketForm
            devices={deviceResult.devices.map((device) => ({
              id: device.id,
              brand: device.brand,
              model: device.model,
              deviceType: device.deviceType,
            }))}
          />
        ) : (
          <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Ticket scope</p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
              {user.role === "TECHNICIAN" ? "Assigned tickets" : "All repair tickets"}
            </h1>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              Filters and list results are enforced server-side based on your role.
            </p>
          </section>
        )}

        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Repair tickets</p>
              <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                {user.role === "TECHNICIAN"
                  ? "Assigned ticket list"
                  : user.role === "ADMIN"
                    ? "Admin ticket list"
                    : "My repair requests"}
              </h1>
            </div>
            <Link
              href="/devices"
              className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
            >
              Devices
            </Link>
          </div>

          <form className="mt-8 grid gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface-alt)] p-5 sm:grid-cols-2">
            <input
              type="search"
              name="ticketId"
              defaultValue={filters.ticketId ?? ""}
              placeholder="Filter by ticket ID"
              className="rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
            />
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className="rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
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
              className="rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
            />
            <input
              type="date"
              name="dateTo"
              defaultValue={filters.dateTo ?? ""}
              className="rounded-2xl border border-[var(--border-strong)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
            />
            <input type="hidden" name="pageSize" value={String(filters.pageSize)} />
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Apply filters
              </button>
            </div>
          </form>

          <div className="mt-8 grid gap-4">
            {ticketsResult.tickets.length > 0 ? (
              ticketsResult.tickets.map((ticket) => (
                <article key={ticket.id} className="rounded-3xl border border-[var(--border)] bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--foreground)]">{ticket.ticketId}</h2>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {ticket.device.brand} {ticket.device.model}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <span className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]">
                        {REPAIR_STATUS_LABELS[ticket.status]}
                      </span>
                      <Link
                        href={`/repair-tickets/${ticket.id}`}
                        className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
                      >
                        View ticket
                      </Link>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{ticket.issueDescription}</p>
                </article>
              ))
            ) : (
              <article className="rounded-3xl border border-[var(--border)] bg-white p-5">
                <p className="text-sm text-[var(--muted)]">No tickets match the current filters.</p>
              </article>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-[var(--muted)]">
            <p>
              Page {ticketsResult.pagination.page} of {ticketsResult.pagination.totalPages} · {ticketsResult.pagination.totalItems} tickets
            </p>
            <div className="flex gap-3">
              {ticketsResult.pagination.page > 1 ? (
                <Link
                  href={`/repair-tickets?page=${ticketsResult.pagination.page - 1}&pageSize=${ticketsResult.pagination.pageSize}&status=${filters.status ?? ""}&ticketId=${encodeURIComponent(filters.ticketId ?? "")}&dateFrom=${filters.dateFrom ?? ""}&dateTo=${filters.dateTo ?? ""}`}
                  className="rounded-full border border-[var(--border-strong)] px-4 py-2 font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
                >
                  Previous
                </Link>
              ) : null}
              {ticketsResult.pagination.page < ticketsResult.pagination.totalPages ? (
                <Link
                  href={`/repair-tickets?page=${ticketsResult.pagination.page + 1}&pageSize=${ticketsResult.pagination.pageSize}&status=${filters.status ?? ""}&ticketId=${encodeURIComponent(filters.ticketId ?? "")}&dateFrom=${filters.dateFrom ?? ""}&dateTo=${filters.dateTo ?? ""}`}
                  className="rounded-full border border-[var(--border-strong)] px-4 py-2 font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
                >
                  Next
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
