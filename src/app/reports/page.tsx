import { BarChart3, Download, FileText } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/app/app-shell";
import { BarList, DataTable, Section, StatTile } from "@/components/reports/report-parts";
import { Badge, EmptyState, buttonClasses, cn } from "@/components/ui";
import { requirePageRole } from "@/lib/auth/require-page-role";
import { prisma } from "@/lib/db/prisma";
import { getEventReport, listReportEvents, type GroupRow } from "@/lib/reports/event-report";
import { formatHours, formatPercent, formatRating } from "@/lib/reports/format";

type ReportsPageProps = { searchParams: Promise<{ event?: string | string[] }> };

const groupRows = (rows: GroupRow[]) => rows.map((row) => [row.label, row.registered, row.fixed]);

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const user = await requirePageRole("/reports", ["ADMIN", "LEAD_TECHNICIAN"]);
  const events = await listReportEvents(prisma);
  const requested = [(await searchParams).event].flat()[0];
  const selected = events.find((event) => event.id === requested) ?? events.find((event) => event.isActive) ?? events[0];
  const report = selected ? await getEventReport(prisma, selected.id) : null;

  if (!report) {
    return (
      <AppShell active="reports" eyebrow="Reports" title="Event report" user={user}>
        <EmptyState icon={<BarChart3 className="h-8 w-8" strokeWidth={1.5} />} title="No maintenance program yet. The report appears once an event has requests." />
      </AppShell>
    );
  }

  const s = report.summary;
  const base = `/api/reports/events/${report.event.id}`;

  return (
    <AppShell
      active="reports"
      eyebrow={report.event.dates}
      title={report.event.name}
      user={user}
      actions={
        <div className="flex flex-wrap gap-2">
          {/* Plain links: these are file downloads, not pages to prefetch. */}
          <a href={`${base}/pdf`} download className={buttonClasses("secondary", "md")}>
            <FileText className="h-4 w-4" strokeWidth={2} aria-hidden />
            PDF summary
          </a>
          <a href={`${base}/csv`} download className={buttonClasses("secondary", "md")}>
            <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
            CSV of tickets
          </a>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {events.length > 1 ? (
          <nav aria-label="Events" className="flex flex-wrap gap-2">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/reports?event=${event.id}`}
                aria-current={event.id === report.event.id ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-small font-medium",
                  event.id === report.event.id ? "border-accent bg-accent-soft text-ink-accent" : "border-line bg-surface text-ink-secondary hover:text-ink",
                )}
              >
                {event.name}
                {event.isActive ? <Badge tone="accent">Active</Badge> : null}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Registered" value={s.registered} detail={s.cancelled ? `${s.cancelled} cancelled` : undefined} />
          <StatTile label="Received" value={s.received} detail={s.inProgress ? `${s.inProgress} in progress` : undefined} />
          <StatTile label="Fixed" value={s.fixed} emphasis />
          <StatTile label="Cannot repair" value={s.cannotRepair} />
          <StatTile label="Collected" value={s.collected} />
          <StatTile label="Uncollected" value={s.uncollected} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Fix rate" value={formatPercent(s.fixRate)} detail="of finished devices" />
          <StatTile label="Median time to ready" value={formatHours(s.medianHoursToReady)} detail="from drop-off" />
          <StatTile label="Average rating" value={formatRating(s.averageRating)} detail={`${s.ratings} ${s.ratings === 1 ? "rating" : "ratings"}`} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Top faults found">
            <BarList rows={report.topFaults} empty="No repairs recorded yet." />
          </Section>
          <Section title="Top work done">
            <BarList rows={report.topActions} empty="No repairs recorded yet." />
          </Section>
          <Section title="By faculty">
            <DataTable columns={[{ label: "Faculty" }, { label: "Registered", align: "right" }, { label: "Fixed", align: "right" }]} rows={groupRows(report.byFaculty)} empty="No requests yet." />
          </Section>
          <Section title="By device type">
            <DataTable columns={[{ label: "Device" }, { label: "Registered", align: "right" }, { label: "Fixed", align: "right" }]} rows={groupRows(report.byDeviceType)} empty="No requests yet." />
          </Section>
        </div>

        <Section title="Technicians">
          <DataTable
            columns={[{ label: "Technician" }, { label: "Fixed", align: "right" }, { label: "Cannot repair", align: "right" }, { label: "Open", align: "right" }, { label: "Rating", align: "right" }]}
            rows={report.byTechnician.map((t) => [t.name, t.fixed, t.cannotRepair, t.open, formatRating(t.averageRating)])}
            empty="No technician work recorded yet."
          />
        </Section>

        <Section title="Compared with previous events">
          <DataTable
            columns={[{ label: "Event" }, { label: "Registered", align: "right" }, { label: "Fixed", align: "right" }, { label: "Fix rate", align: "right" }, { label: "Rating", align: "right" }]}
            rows={
              report.previous.length
                ? [{ name: `${report.event.name} (this event)`, summary: s }, ...report.previous].map((e) => [e.name, e.summary.registered, e.summary.fixed, formatPercent(e.summary.fixRate), formatRating(e.summary.averageRating)])
                : []
            }
            empty="This is the first event, so there is nothing to compare yet."
          />
        </Section>
      </div>
    </AppShell>
  );
}
