import type { RepairStatus } from "@prisma/client";
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
  default: "border-[var(--border)] bg-white border-l-[3px] border-l-[var(--slate-300)]",
  accent: "border-[var(--border)] bg-white border-l-[3px] border-l-[var(--blue-600)]",
  success: "border-[var(--border)] bg-white border-l-[3px] border-l-[var(--green-700)]",
  warning: "border-[var(--border)] bg-white border-l-[3px] border-l-[var(--amber-600)]",
  danger: "border-[var(--border)] bg-white border-l-[3px] border-l-[var(--red-600)]",
};

const statusClassName: Record<RepairStatus, string> = {
  REGISTRATION_COMPLETED: "status-registration",
  DEVICE_RECEIVED: "status-received",
  REPAIR_IN_PROGRESS: "status-repair",
  READY_FOR_COLLECTION: "status-ready",
  DEVICE_COLLECTED: "status-collected",
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
    <article className={`rounded-lg border p-4 ${metricToneClasses[tone]}`}>
      <p className="eyebrow">{label}</p>
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

function StatusBadge({ status, label }: { status: RepairStatus; label: string }) {
  return <span className={`status-badge ${statusClassName[status]}`}>{label}</span>;
}

function StatusList({ rows }: { rows: DashboardStatusCount[] }) {
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <div key={row.status}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-[var(--foreground)]">{row.label}</span>
            <span className="metric-value font-semibold text-[var(--foreground)]">{formatNumber(row.count)}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--slate-100)]">
            <div className="h-full rounded-full bg-[var(--blue-600)]" style={{ width: row.count === 0 ? 0 : `${Math.round((row.count / max) * 100)}%` }} />
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
              className="w-full rounded-t-md bg-[var(--blue-600)]"
              style={{ height: row.count === 0 ? 0 : `${Math.max(8, Math.round((row.count / max) * 96))}px` }}
            />
          </div>
          <p className="text-center text-xs font-medium text-[var(--muted)]">{row.label}</p>
        </div>
      ))}
    </div>
  );
}

function TrackingLink({ ticket }: { ticket: DashboardTicketSummary }) {
  return (
    <Link href={`/repair-tickets/${ticket.id}`} className="tracking-code font-bold text-[var(--blue-700)]">
      {ticket.trackingCode}
    </Link>
  );
}

function TicketTable({ emptyText, tickets }: { emptyText: string; tickets: DashboardTicketSummary[] }) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border-strong)] bg-white p-5">
        <p className="text-sm font-semibold text-[var(--foreground)]">{emptyText}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">New work will appear here as requests move through the service desk.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table min-w-[760px] text-left text-sm">
        <thead>
          <tr>
            <th>Tracking</th>
            <th>Requester</th>
            <th>Device</th>
            <th>Status</th>
            <th>Owner</th>
            <th className="text-right">Age</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td>
                <TrackingLink ticket={ticket} />
                <p className="mt-1 text-xs text-[var(--muted)]">{ticket.ticketId}</p>
              </td>
              <td>
                <p className="font-semibold text-[var(--foreground)]">{ticket.requesterName}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{ticket.faculty}</p>
              </td>
              <td className="font-medium text-[var(--foreground)]">{ticket.deviceName}</td>
              <td>
                <StatusBadge status={ticket.status} label={ticket.statusLabel} />
              </td>
              <td className="text-[var(--muted-strong)]">{ticket.technicianName ?? "Unassigned"}</td>
              <td className="metric-value text-right font-semibold text-[var(--foreground)]">{ticket.ageLabel}</td>
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
              className="h-full rounded-full bg-[var(--blue-600)]"
              style={{ width: `${Math.max(8, Math.round((row.activeTickets / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminDashboardView({ dashboard }: { dashboard: AdminDashboard }) {
  return (
    <section className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Open Tickets" value={dashboard.openTickets} detail={`${dashboard.totalTickets} total`} tone="accent" />
        <MetricTile label="Closed Tickets" value={dashboard.closedTickets} detail="Collected" tone="success" />
        <MetricTile label="Waiting Assignment" value={dashboard.waitingAssignment} detail="Needs technician" tone="warning" />
        <MetricTile label="Custody Exceptions" value={dashboard.custodyExceptions} detail="Needs review" tone="danger" />
      </div>

      <DashboardSection eyebrow="Admin command" title="Needs attention" action={<Link href="/repair-tickets" className="btn-ghost">View requests</Link>}>
        <TicketTable tickets={dashboard.attentionTickets} emptyText="No tickets need admin review." />
      </DashboardSection>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
        <DashboardSection eyebrow="Last 6 weeks" title="Repairs closed per week" action={<Link href="/reports" className="btn-ghost">Details</Link>}>
          <WeeklyClosedChart rows={dashboard.weeklyClosedRepairs} />
        </DashboardSection>
        <DashboardSection eyebrow="Live snapshot" title="Tickets by status">
          <StatusList rows={dashboard.statusBreakdown} />
        </DashboardSection>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Not Received" value={dashboard.devicesNotReceived} detail="Requester has not brought device" />
        <MetricTile label="Ready Pickup" value={dashboard.readyForPickup} detail="Collection queue" tone="success" />
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
        <MetricTile label="Overdue" value={dashboard.overdue} detail="Aging requests" tone={dashboard.overdue > 0 ? "danger" : "default"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
        <DashboardSection eyebrow="Lead attention" title="Queue requiring action" action={<Link href="/lead" className="btn-ghost">Open command center</Link>}>
          <TicketTable tickets={dashboard.atRiskTickets} emptyText="No requests require lead action." />
        </DashboardSection>
        <DashboardSection eyebrow="Capacity" title="Workload by technician">
          <WorkloadPanel rows={dashboard.workloadByTechnician} />
        </DashboardSection>
      </div>
    </section>
  );
}

function TechnicianDashboardView({ dashboard }: { dashboard: TechnicianDashboard }) {
  const queueTickets = dashboard.statusColumns.flatMap((column) => column.tickets);

  return (
    <section className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricTile label="Active Repairs" value={dashboard.activeRepairs} detail="Assigned to you" tone="accent" />
        <MetricTile label="Waiting Start" value={dashboard.waitingToStart} detail="Device received" />
        <MetricTile label="In Repair" value={dashboard.inRepair} detail="Active bench work" />
        <MetricTile label="Ready Pickup" value={dashboard.readyForPickup} detail="Completed work" tone="success" />
        <MetricTile label="Overdue" value={dashboard.overdue} detail="Aging requests" tone={dashboard.overdue > 0 ? "danger" : "default"} />
      </div>

      <DashboardSection eyebrow="My queue" title="Assigned repair work" action={<Link href="/technician/workspace" className="btn-ghost">Open workspace</Link>}>
        <TicketTable tickets={queueTickets} emptyText="No assigned repair tickets." />
      </DashboardSection>
    </section>
  );
}

function DashboardActions({ role }: { role: "ADMIN" | "LEAD_TECHNICIAN" | "TECHNICIAN" }) {
  if (role === "ADMIN") {
    return (
      <>
        <Link href="/admin/users/new" className="btn-primary">Add staff</Link>
        <Link href="/reports" className="btn-secondary">View reports</Link>
      </>
    );
  }

  if (role === "LEAD_TECHNICIAN") {
    return (
      <>
        <Link href="/lead" className="btn-primary">Command Center</Link>
        <Link href="/reports" className="btn-secondary">Reports</Link>
      </>
    );
  }

  return <Link href="/technician/workspace" className="btn-primary">Open Workspace</Link>;
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
    return "Admin overview";
  }

  if (role === "LEAD_TECHNICIAN") {
    return "Dashboard";
  }

  return "My queue";
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
        <div>
          <p className="eyebrow">{ROLE_LABELS[role]}</p>
          <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
            {role === "ADMIN"
              ? "Monitor service desk health, staff capacity, and custody exceptions."
              : role === "LEAD_TECHNICIAN"
                ? "Control today's repair flow."
                : "Manage your assigned repairs."}
          </p>
        </div>
        {renderDashboard(dashboard)}
      </div>
    </AppShell>
  );
}
