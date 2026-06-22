import Link from "next/link";
import { AppShell } from "@/app/app-shell";
import { redirect } from "next/navigation";
import { getCurrentServerUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
import { getReportsOverview } from "@/lib/reports/report-service";
import { reportDateRangeSchema } from "@/lib/validations/reports";

type ReportsPageProps = {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
  }>;
};

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const user = await getCurrentServerUser();

  if (!user) {
    redirect("/auth/login?next=/reports");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  const params = await searchParams;
  const parsedFilters = reportDateRangeSchema.safeParse({
    dateFrom: readSearchParam(params.dateFrom),
    dateTo: readSearchParam(params.dateTo),
  });

  if (!parsedFilters.success) {
    redirect("/reports");
  }

  const filters = parsedFilters.data;
  const overview = await getReportsOverview(prisma, filters);

  return (
    <AppShell
      active="reports"
      eyebrow="Admin reports"
      title="Reports and analytics"
      user={user}
      actions={
        <Link href="/dashboard" className="btn-secondary">
          Dashboard
        </Link>
      }
    >

      <form className="grid gap-4 rounded-xl border border-[var(--border)] bg-white p-5 sm:grid-cols-[1fr_1fr_auto]">
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          From
          <input name="dateFrom" type="date" defaultValue={filters.dateFrom ?? ""} className="field-control" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          To
          <input name="dateTo" type="date" defaultValue={filters.dateTo ?? ""} className="field-control" />
        </label>
        <button className="btn-primary self-end">Apply</button>
      </form>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <article className="panel p-5">
          <p className="text-sm text-[var(--muted)]">Tickets</p>
          <p className="metric-value mt-2 text-3xl font-semibold">{overview.totals.tickets}</p>
        </article>
        <article className="panel p-5">
          <p className="text-sm text-[var(--muted)]">Active</p>
          <p className="metric-value mt-2 text-3xl font-semibold">{overview.totals.active}</p>
        </article>
        <article className="panel p-5">
          <p className="text-sm text-[var(--muted)]">Completed</p>
          <p className="metric-value mt-2 text-3xl font-semibold">{overview.totals.completed}</p>
        </article>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <ReportTable title="Repairs by faculty" rows={overview.byFaculty.map((row) => [row.faculty, row.count])} />
        <ReportTable title="Repairs by device type" rows={overview.byDeviceType.map((row) => [row.deviceType, row.count])} />
        <ReportTable title="Status mix" rows={overview.byStatus.map((row) => [row.label, row.count])} />
        <ReportTable title="Monthly trend" rows={overview.monthlyTrend.map((row) => [row.month, row.count])} />
        <ReportTable title="Common problem keywords" rows={overview.commonProblems.map((row) => [row.keyword, row.count])} />
        <ReportTable
          title="Technician performance"
          rows={overview.technicianPerformance.map((row) => [
            row.fullName,
            `${row.completedTickets}/${row.assignedTickets} completed${row.averageRepairHours === null ? "" : `, ${row.averageRepairHours}h avg`}`,
          ])}
        />
      </section>
    </AppShell>
  );
}

function ReportTable({ title, rows }: { title: string; rows: Array<[string, string | number]> }) {
  return (
    <article className="panel p-5">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="data-table text-left text-sm">
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="py-3 text-[var(--muted)]">No report data</td>
              </tr>
            ) : (
              rows.map(([label, value]) => (
                <tr key={`${title}-${label}`} className="border-t border-[var(--border)]">
                  <th className="py-3 pr-4 font-medium text-[var(--foreground)]">{label}</th>
                  <td className="py-3 text-right text-[var(--muted)]">{value}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
