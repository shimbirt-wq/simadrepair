import { AlertTriangle, CalendarDays } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/app/app-shell";
import { DataTable, Section, StatTile } from "@/components/reports/report-parts";
import { ButtonLink, EmptyState, StatusBadge, TagNumber } from "@/components/ui";
import { requirePageRole } from "@/lib/auth/require-page-role";
import { prisma } from "@/lib/db/prisma";
import { getLiveOverview } from "@/lib/reports/event-report";

const since = new Intl.DateTimeFormat("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Mogadishu" });

/** Live overview during the event (AA3): today, open work, stuck tickets, technician load. */
export default async function OverviewPage() {
  const user = await requirePageRole("/dashboard", ["ADMIN", "LEAD_TECHNICIAN", "TECHNICIAN"]);
  if (user.role === "TECHNICIAN") redirect("/technician/workspace");
  const overview = await getLiveOverview(prisma);

  if (!overview.event) {
    return (
      <AppShell active="dashboard" eyebrow="Overview" title="No active event" user={user}>
        <EmptyState
          icon={<CalendarDays className="h-8 w-8" strokeWidth={1.5} />}
          title="Activate a maintenance program to see live numbers."
          action={user.role === "ADMIN" ? <ButtonLink href="/admin/events">Events</ButtonLink> : undefined}
        />
      </AppShell>
    );
  }

  const { today, open, stuck, technicians } = overview;

  return (
    <AppShell
      active="dashboard"
      eyebrow={overview.event.dates}
      title={overview.event.name}
      user={user}
      actions={<ButtonLink href="/lead" variant="secondary">Open board</ButtonLink>}
    >
      <div className="flex flex-col gap-6">
        <section aria-labelledby="today" className="flex flex-col gap-3">
          <h2 id="today" className="text-h3 text-ink">Today</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Registered" value={today.registered} />
            <StatTile label="Received" value={today.received} />
            <StatTile label="Ready" value={today.ready} emphasis />
            <StatTile label="Collected" value={today.collected} />
          </div>
        </section>

        <section aria-labelledby="now" className="flex flex-col gap-3">
          <h2 id="now" className="text-h3 text-ink">Right now</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile label="Waiting drop-off" value={open.dropOff} />
            <StatTile label="To assign" value={open.toAssign} />
            <StatTile label="In repair" value={open.inRepair} />
            <StatTile label="Blocked" value={open.blocked} />
            <StatTile label="Ready for pickup" value={open.ready} />
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          <Section title={stuck.length ? `Stuck (${stuck.length})` : "Stuck"}>
            {stuck.length === 0 ? (
              <p className="text-small text-ink-muted">Nothing stuck.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {stuck.map((ticket) => (
                  <li key={ticket.id}>
                    <Link href={`/lead?ticket=${ticket.id}`} className="flex flex-wrap items-center gap-3 py-2.5 hover:bg-n-50">
                      <AlertTriangle className="h-4 w-4 text-warning" strokeWidth={2} aria-hidden />
                      <TagNumber tag={ticket.tagNumber} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-small text-ink">{ticket.device}</span>
                      <span className="text-caption text-ink-muted">{ticket.technician ?? "Unassigned"}</span>
                      <StatusBadge status={ticket.status} />
                      <span className="font-mono text-caption text-ink-muted">since {since.format(new Date(ticket.since))}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title="Technician load">
            <DataTable
              columns={[{ label: "Technician" }, { label: "Open repairs", align: "right" }]}
              rows={technicians.map((t) => [t.name, t.openCount])}
              empty="No technicians with access."
            />
          </Section>
        </div>
      </div>
    </AppShell>
  );
}
