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
  accent:  "border-[var(--border)] bg-white border-l-[3px] border-l-[var(--blue-600)]",
  success: "border-[var(--border)] bg-white border-l-[3px] border-l-[var(--green-700)]",
  warning: "border-[var(--border)] bg-white border-l-[3px] border-l-[var(--amber-600)]",
  danger:  "border-[var(--border)] bg-white border-l-[3px] border-l-[var(--red-600)]",
};

const metricToneDotClasses: Record<MetricTone, string> = {
  default: "bg-[var(--slate-300)]",
  accent:  "bg-[var(--blue-600)]",
  success: "bg-[var(--green-700)]",
  warning: "bg-[var(--amber-600)]",
  danger:  "bg-[var(--red-600)]",
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
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{label}</p>
        <span className={`h-2 w-2 rounded-full ${metricToneDotClasses[tone]}`} />
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
              <div className="h-full rounded-full bg-[var(--blue-600)]" style={{ width: `${Math.round((row.count / max) * 100)}%` }} />
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

function AttentionSummary({
  dashboard,
}: {
  dashboard: AdminDashboard;
}) {
  const items = [
    { label: "Needs review", value: dashboard.attentionTickets.length, tone: dashboard.attentionTickets.length > 0 ? "danger" : "default" },
    { label: "Untriaged", value: dashboard.statusBreakdown.find((row) => row.status === "REGISTRATION_COMPLETED")?.count ?? 0, tone: "accent" },
    { label: "Waiting student", value: dashboard.waitingForStudent, tone: dashboard.waitingForStudent > 0 ? "warning" : "default" },
    { label: "Custody exceptions", value: dashboard.custodyExceptions, tone: dashboard.custodyExceptions > 0 ? "danger" : "default" },
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">{item.label}</p>
          <p
            className={`metric-value mt-1 text-xl font-bold ${
              item.tone === "danger"
                ? "text-[var(--danger)]"
                : item.tone === "warning"
                  ? "text-[var(--warning)]"
                  : item.tone === "accent"
                    ? "text-[var(--blue-700)]"
                    : "text-[var(--foreground)]"
            }`}
          >
            {formatNumber(item.value)}
          </p>
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

function AdminAttentionTable({ dashboard }: { dashboard: AdminDashboard }) {
  if (dashboard.attentionTickets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border-strong)] bg-white p-5">
        <p className="text-sm font-semibold text-[var(--foreground)]">No tickets need admin review.</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Unassigned, aging, high-severity, and student-blocked requests will appear here first.
        </p>
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
            <th>Status</th>
            <th>Owner</th>
            <th className="text-right">Age</th>
          </tr>
        </thead>
        <tbody>
          {dashboard.attentionTickets.map((ticket) => (
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
                <span className="status-badge status-registration">{ticket.statusLabel}</span>
                {ticket.severity ? <span className="ml-2"><SeverityBadge severity={ticket.severity} /></span> : null}
              </td>
              <td className="text-[var(--muted-strong)]">{ticket.technicianName ?? "Unassigned"}</td>
              <td className="metric-value text-right font-semibold text-[var(--danger)]">{ticket.ageLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
              className="h-full rounded-full bg-[var(--blue-600)]"
              style={{ width: `${Math.max(8, Math.round((row.activeTickets / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RepairStatusBadge({ label, status }: { label: string; status: DashboardTicketSummary["status"] }) {
  const className =
    status === "READY_FOR_COLLECTION"
      ? "status-ready"
      : status === "QUALITY_INSPECTION"
        ? "status-quality"
        : status === "REPAIR_IN_PROGRESS"
          ? "status-repair"
          : status === "DEVICE_RECEIVED" || status === "DIAGNOSIS_IN_PROGRESS"
            ? "status-diagnosis"
            : "status-registration";

  return <span className={`status-badge ${className}`}>{label}</span>;
}

function TechnicianQueueTable({ tickets }: { tickets: DashboardTicketSummary[] }) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border-strong)] bg-white p-5">
        <p className="text-sm font-semibold text-[var(--foreground)]">No assigned repair tickets.</p>
        <p className="mt-2 text-sm text-[var(--muted)]">New assigned work will appear here when the lead routes it to you.</p>
      </div>
    );
  }

  return (
    <div className="max-h-[360px] overflow-auto">
      <table className="data-table min-w-[760px] text-left text-sm">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Requester</th>
            <th>Device / issue</th>
            <th>Status</th>
            <th>Priority</th>
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
              <td>
                <p className="font-semibold text-[var(--foreground)]">{ticket.deviceName}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{ticket.issueCategory}</p>
              </td>
              <td>
                <RepairStatusBadge status={ticket.status} label={ticket.statusLabel} />
              </td>
              <td>
                <SeverityBadge severity={ticket.severity} />
              </td>
              <td className="metric-value text-right font-semibold text-[var(--foreground)]">{ticket.ageLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TechnicianStageSummary({ dashboard }: { dashboard: TechnicianDashboard }) {
  const max = Math.max(1, ...dashboard.statusColumns.map((column) => column.tickets.length));

  return (
    <div className="grid gap-4">
      {dashboard.statusColumns.map((column) => (
        <div key={column.status}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <p className="font-semibold text-[var(--foreground)]">{column.label}</p>
            <p className="metric-value text-[var(--muted)]">{column.tickets.length}</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--slate-100)]">
            <div
              className="h-full rounded-full bg-[var(--blue-600)]"
              style={{ width: column.tickets.length === 0 ? 0 : `${Math.max(8, Math.round((column.tickets.length / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TechnicianNextAction({ dashboard }: { dashboard: TechnicianDashboard }) {
  const actionLabel =
    dashboard.overdue > 0
      ? `${dashboard.overdue} aging repairs need attention`
      : dashboard.qualityCheck > 0
        ? `${dashboard.qualityCheck} repairs are awaiting quality check`
        : dashboard.activeRepairs > 0
          ? "Continue the next assigned repair"
          : "No active repair work assigned";

  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-5">
      <p className="eyebrow">Next action</p>
      <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">{actionLabel}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Use the workspace to filter your queue, open the repair detail, update diagnosis notes, and move the ticket through the repair flow.
      </p>
      <div className="mt-4">
        <Link href="/technician/workspace" className="btn-primary">
          Open workspace
        </Link>
      </div>
    </div>
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

      <DashboardSection
        eyebrow="Admin command"
        title="Needs attention"
        action={
          <Link href="/repair-tickets" className="btn-ghost">
            View requests
          </Link>
        }
      >
        <div className="grid gap-5">
          <AttentionSummary dashboard={dashboard} />
          <AdminAttentionTable dashboard={dashboard} />
        </div>
      </DashboardSection>

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
  const queueTickets = dashboard.statusColumns.flatMap((column) => column.tickets);

  return (
    <section className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricTile label="Active Repairs" value={dashboard.activeRepairs} detail="Assigned to you" tone="accent" />
        <MetricTile label="Diagnosing" value={dashboard.diagnosing} detail="Finding the fault" />
        <MetricTile label="Repairing" value={dashboard.repairing} detail="Active bench work" />
        <MetricTile label="Quality Check" value={dashboard.qualityCheck} detail="Ready for verification" tone="warning" />
        <MetricTile label="Overdue" value={dashboard.overdue} detail="Aging requests" tone={dashboard.overdue > 0 ? "danger" : "default"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
        <DashboardSection
          eyebrow="My queue"
          title="Assigned repair work"
          action={
            <Link href="/technician/workspace" className="btn-ghost">
              Open workspace
            </Link>
          }
        >
          <TechnicianQueueTable tickets={queueTickets} />
        </DashboardSection>

        <div className="grid content-start gap-5">
          <DashboardSection eyebrow="Work stages" title="Queue by status">
            <TechnicianStageSummary dashboard={dashboard} />
          </DashboardSection>
          <TechnicianNextAction dashboard={dashboard} />
        </div>
      </div>
    </section>
  );
}

function DashboardActions({ role }: { role: "ADMIN" | "LEAD_TECHNICIAN" | "TECHNICIAN" }) {
  if (role === "ADMIN") {
    return (
      <>
        <Link href="/admin/users" className="btn-primary">
          Add staff
        </Link>
        <Link href="/admin/service-desk/reports" className="btn-secondary">
          View reports
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">{ROLE_LABELS[role]}</p>
            <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
              {role === "ADMIN"
                ? "Monitor service desk health, staff capacity, and custody exceptions."
                : role === "LEAD_TECHNICIAN"
                  ? "Control today's repair flow."
                  : "Focused assigned repair work."}
            </p>
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
