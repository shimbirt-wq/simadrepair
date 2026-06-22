import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/app/app-shell";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { getCurrentServerUser } from "@/lib/auth/server-user";
import type {
  AdminDashboard,
  DashboardStatusCount,
  DashboardTicketSummary,
  DashboardWorkload,
  LeadTechnicianDashboard,
  TechnicianDashboard,
} from "@/lib/dashboard/dashboard-service";
import { getRoleDashboard } from "@/lib/dashboard/dashboard-service";
import { prisma } from "@/lib/db/prisma";

type MetricTone = "default" | "accent" | "success" | "warning" | "danger";

const metricToneClasses: Record<MetricTone, string> = {
  default: "border-[var(--border)] bg-white",
  accent: "border-[var(--fill-accent-soft-border)] bg-[var(--fill-accent-soft)]",
  success: "border-[var(--fill-success-soft-border)] bg-[var(--fill-success-soft)]",
  warning: "border-[var(--fill-warning-soft-border)] bg-[var(--fill-warning-soft)]",
  danger: "border-[var(--fill-danger-soft-border)] bg-[var(--fill-danger-soft)]",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function MetricTile({
  detail,
  label,
  tone = "default",
  value,
}: {
  detail?: string;
  label: string;
  tone?: MetricTone;
  value: number | string;
}) {
  return (
    <article className={`rounded-lg border p-4 shadow-[var(--shadow-xs)] ${metricToneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{label}</p>
        <span className="h-2 w-2 rounded-full bg-current text-[var(--accent)]" />
      </div>
      <p className="metric-value mt-3 text-3xl font-bold leading-none text-[var(--foreground)]">
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
      {detail ? <p className="mt-2 text-xs font-medium text-[var(--muted)]">{detail}</p> : null}
    </article>
  );
}

function DashboardSection({
  action,
  children,
  eyebrow,
  title,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
}) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-white px-5 py-4">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2 className="mt-1 text-base font-semibold text-[var(--foreground)]">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function StatusList({ rows }: { rows: DashboardStatusCount[] }) {
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <div key={row.status} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-[var(--foreground)]">{row.label}</span>
              <span className="metric-value font-semibold text-[var(--foreground)]">{formatNumber(row.count)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--slate-100)]">
              <div className="h-full rounded-full bg-[var(--blue-700)]" style={{ width: `${Math.round((row.count / max) * 100)}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function WeeklyClosedChart({ rows }: { rows: AdminDashboard["weeklyClosedRepairs"] }) {
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <div className="grid min-h-[168px] grid-cols-6 items-end gap-4">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-2">
          <p className="metric-value text-center text-xs font-semibold text-[var(--slate-700)]">{formatNumber(row.count)}</p>
          <div className="mx-auto flex h-24 w-8 items-end overflow-hidden rounded-t-md bg-[var(--slate-100)]">
            <div
              className="w-full rounded-t-md bg-[var(--blue-700)]"
              style={{ height: `${Math.max(8, Math.round((row.count / max) * 96))}px` }}
            />
          </div>
          <p className="text-center text-xs font-medium text-[var(--muted)]">{row.label}</p>
        </div>
      ))}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string | null }) {
  if (!severity) {
    return <span className="status-badge status-received">Unset</span>;
  }

  const className =
    severity === "CRITICAL" || severity === "HIGH"
      ? "status-overdue"
      : severity === "MEDIUM"
        ? "status-quality"
        : "status-received";

  return <span className={`status-badge ${className}`}>{severity.charAt(0) + severity.slice(1).toLowerCase()}</span>;
}

function TrackingLink({ ticket }: { ticket: DashboardTicketSummary }) {
  return (
    <Link href={`/repair-tickets/${ticket.id}`} className="tracking-code font-bold text-[var(--blue-700)]">
      {ticket.trackingCode}
    </Link>
  );
}

function AtRiskTable({ tickets }: { tickets: DashboardTicketSummary[] }) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-white p-5">
        <p className="text-sm font-semibold text-[var(--foreground)]">No overdue or at-risk tickets.</p>
        <p className="mt-2 text-sm text-[var(--muted)]">High-severity and aging requests will appear here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table min-w-[680px] text-left text-sm">
        <thead>
          <tr>
            <th>Tracking</th>
            <th>Student</th>
            <th>Priority</th>
            <th className="text-right">Age</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td>
                <TrackingLink ticket={ticket} />
                <p className="mt-1 text-xs text-[var(--muted)]">{ticket.deviceName}</p>
              </td>
              <td>
                <p className="font-semibold text-[var(--foreground)]">{ticket.requesterName}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{ticket.faculty}</p>
              </td>
              <td>
                <SeverityBadge severity={ticket.severity} />
              </td>
              <td className="metric-value text-right font-semibold text-[var(--danger)]">{ticket.ageLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkloadPanel({ rows }: { rows: DashboardWorkload[] }) {
  const max = Math.max(1, ...rows.map((row) => row.activeTickets));

  if (rows.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No active technician workload yet.</p>;
  }

  return (
    <div className="grid gap-4">
      {rows.map((row) => (
        <div key={row.technicianId}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <p className="font-semibold text-[var(--foreground)]">{row.fullName}</p>
            <p className="metric-value text-[var(--muted)]">{row.activeTickets} active</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--slate-100)]">
            <div
              className="h-full rounded-full bg-[var(--blue-700)]"
              style={{ width: `${Math.max(8, Math.round((row.activeTickets / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TicketCard({ ticket }: { ticket: DashboardTicketSummary }) {
  return (
    <article className="rounded-lg border border-l-4 border-[var(--border)] border-l-[var(--blue-700)] bg-white p-4 shadow-[var(--shadow-xs)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <TrackingLink ticket={ticket} />
          <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{ticket.requesterName}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{ticket.deviceName}</p>
        </div>
        <SeverityBadge severity={ticket.severity} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted-strong)]">{ticket.faculty}</p>
        <p className="metric-value text-xs text-[var(--muted)]">{ticket.ageLabel}</p>
      </div>
    </article>
  );
}

function AdminDashboardView({ dashboard }: { dashboard: AdminDashboard }) {
  return (
    <section className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Open Tickets" value={dashboard.openTickets} detail={`${dashboard.totalTickets} total`} tone="accent" />
        <MetricTile label="Closed Tickets" value={dashboard.closedTickets} detail="Collected or closed" tone="success" />
        <MetricTile label="Devices In Custody" value={dashboard.devicesInCustody} detail="Physical accountability" />
        <MetricTile label="Custody Exceptions" value={dashboard.custodyExceptions} detail="Needs review" tone="danger" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
        <DashboardSection
          eyebrow="Last 6 weeks"
          title="Repairs closed per week"
          action={
            <Link href="/admin/service-desk/reports" className="btn-ghost">
              Details
            </Link>
          }
        >
          <WeeklyClosedChart rows={dashboard.weeklyClosedRepairs} />
        </DashboardSection>

        <DashboardSection eyebrow="Live snapshot" title="Tickets by status">
          <StatusList rows={dashboard.statusBreakdown} />
        </DashboardSection>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Waiting Student" value={dashboard.waitingForStudent} detail="Requester action required" tone="warning" />
        <MetricTile label="Ready Pickup" value={dashboard.readyForPickup} detail="Ready for collection" tone="success" />
        <MetricTile label="Active Staff" value={dashboard.activeStaff} detail="Admins, leads, technicians" />
        <MetricTile label="Technicians" value={dashboard.activeTechnicians} detail="Active repair owners" />
      </div>
    </section>
  );
}

function LeadDashboardView({ dashboard }: { dashboard: LeadTechnicianDashboard }) {
  return (
    <section className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricTile label="New Requests" value={dashboard.newRequests} detail="Fresh intake" tone="accent" />
        <MetricTile label="Waiting Assignment" value={dashboard.waitingAssignment} detail="Needs owner" tone="warning" />
        <MetricTile label="Waiting Device" value={dashboard.waitingForDevice} detail="Not received" />
        <MetricTile label="In Repair" value={dashboard.inRepair} detail="Active bench work" />
        <MetricTile label="Ready Pickup" value={dashboard.readyForPickup} detail="Collection queue" tone="success" />
        <MetricTile label="Overdue" value={dashboard.overdue} detail="Aging requests" tone="danger" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
        <DashboardSection
          eyebrow="Lead attention"
          title="Overdue and at-risk"
          action={
            <Link href="/lead" className="btn-ghost">
              View board
            </Link>
          }
        >
          <AtRiskTable tickets={dashboard.atRiskTickets} />
        </DashboardSection>

        <DashboardSection eyebrow="Capacity" title="Workload by technician">
          <WorkloadPanel rows={dashboard.workloadByTechnician} />
        </DashboardSection>
      </div>
    </section>
  );
}

function TechnicianDashboardView({ dashboard }: { dashboard: TechnicianDashboard }) {
  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-[var(--slate-900)] bg-[var(--slate-900)] p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--blue-200)]">My queue</p>
            <h2 className="mt-2 text-lg font-semibold">You have {dashboard.activeRepairs} active repairs</h2>
            <p className="mt-1 text-sm text-[var(--slate-300)]">
              {dashboard.overdue} overdue · {dashboard.qualityCheck} awaiting quality check
            </p>
          </div>
          <Link href="/technician/workspace" className="btn-secondary">
            Start next
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {dashboard.statusColumns.map((column) => (
          <section key={column.status} className="grid content-start gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-[var(--foreground)]">{column.label}</h2>
              <span className="rounded-full bg-[var(--slate-100)] px-2 py-0.5 text-xs font-bold text-[var(--slate-600)]">
                {column.tickets.length}
              </span>
            </div>
            {column.tickets.length > 0 ? (
              column.tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--border-strong)] bg-white p-5 text-sm text-[var(--muted)]">
                No tickets in this stage.
              </div>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}

function DashboardActions({ role }: { role: "ADMIN" | "LEAD_TECHNICIAN" | "TECHNICIAN" }) {
  if (role === "ADMIN") {
    return (
      <>
        <Link href="/admin/users" className="btn-primary">
          Staff
        </Link>
        <Link href="/admin/service-desk/reports" className="btn-secondary">
          Reports
        </Link>
      </>
    );
  }

  if (role === "LEAD_TECHNICIAN") {
    return (
      <>
        <Link href="/lead" className="btn-primary">
          Command Center
        </Link>
        <Link href="/admin/service-desk/reports" className="btn-secondary">
          Reports
        </Link>
      </>
    );
  }

  return (
    <Link href="/technician/workspace" className="btn-primary">
      Open Workspace
    </Link>
  );
}

function renderDashboard(dashboard: AdminDashboard | LeadTechnicianDashboard | TechnicianDashboard) {
  if (dashboard.role === "ADMIN") {
    return <AdminDashboardView dashboard={dashboard} />;
  }

  if (dashboard.role === "LEAD_TECHNICIAN") {
    return <LeadDashboardView dashboard={dashboard} />;
  }

  return <TechnicianDashboardView dashboard={dashboard} />;
}

function getDashboardTitle(role: "ADMIN" | "LEAD_TECHNICIAN" | "TECHNICIAN") {
  if (role === "ADMIN") {
    return "Overview";
  }

  if (role === "LEAD_TECHNICIAN") {
    return "Dashboard";
  }

  return "My Queue";
}

function getDashboardEyebrow(role: "ADMIN" | "LEAD_TECHNICIAN" | "TECHNICIAN") {
  if (role === "ADMIN") {
    return "Administration";
  }

  if (role === "LEAD_TECHNICIAN") {
    return "Operations";
  }

  return "Work";
}

export default async function DashboardPage() {
  const user = await getCurrentServerUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard");
  }

  const dashboard = await getRoleDashboard(prisma, user);
  const role = dashboard.role;

  return (
    <AppShell
      active="dashboard"
      eyebrow={getDashboardEyebrow(role)}
      title={getDashboardTitle(role)}
      user={user}
      actions={<DashboardActions role={role} />}
    >
      <div className="grid gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">{ROLE_LABELS[role]}</p>
            <h1 className="mt-1 text-xl font-semibold text-[var(--foreground)]">
              {role === "ADMIN"
                ? "Management visibility for SIMADRepair."
                : role === "LEAD_TECHNICIAN"
                  ? "Control today's repair flow."
                  : "Focused assigned repair work."}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="status-badge status-received">Notifications {dashboard.unreadNotifications}</span>
          </div>
        </div>
        {renderDashboard(dashboard)}
      </div>
    </AppShell>
  );
}
