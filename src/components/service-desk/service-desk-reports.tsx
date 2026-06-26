"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { ServiceDeskReportBundle } from "@/lib/service-desk/service-desk-reports";

type ReportsResponse = {
  error?: string;
  reports?: ServiceDeskReportBundle;
};

const reportTabs = [
  { key: "faculty", label: "Tickets by faculty" },
  { key: "issues", label: "Issue categories" },
  { key: "workload", label: "Technician workload" },
  { key: "repairTime", label: "Average repair time" },
  { key: "custody", label: "Custody exceptions" },
] as const;

type ReportTab = (typeof reportTabs)[number]["key"];
type MetricTone = "default" | "accent" | "success" | "warning" | "danger";

const metricToneClasses: Record<MetricTone, string> = {
  default: "border-[var(--border)] bg-white",
  accent: "border-[var(--blue-200)] bg-white",
  success: "border-[var(--green-200)] bg-white",
  warning: "border-[var(--amber-200)] bg-[var(--amber-50)]",
  danger: "border-[var(--red-200)] bg-[var(--red-50)]",
};

const barToneClasses: Record<MetricTone, string> = {
  default: "bg-[var(--blue-600)]",
  accent: "bg-[var(--blue-600)]",
  success: "bg-[var(--green-700)]",
  warning: "bg-[var(--amber-700)]",
  danger: "bg-[var(--red-700)]",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function formatDays(value: number | null) {
  return value === null ? "Not enough data" : `${value.toFixed(1)}d`;
}

function formatDate(value: Date | string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function csvValue(value: string | number | null | undefined) {
  const raw = value ?? "";
  return `"${String(raw).replaceAll("\"", "\"\"")}"`;
}

function downloadCsv(filename: string, rows: Array<Array<string | number | null | undefined>>) {
  const csv = rows.map((row) => row.map(csvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getOverallAverageDays(reports: ServiceDeskReportBundle) {
  const totals = reports.averageRepairTime.byIssueCategory.reduce(
    (current, row) => ({
      days: current.days + row.days * row.count,
      count: current.count + row.count,
    }),
    { days: 0, count: 0 },
  );

  return totals.count > 0 ? Math.round((totals.days / totals.count) * 10) / 10 : null;
}

function exportCurrentTab(reports: ServiceDeskReportBundle, activeTab: ReportTab) {
  if (activeTab === "faculty") {
    downloadCsv("tickets-by-faculty.csv", [
      ["Faculty", "Tickets"],
      ...reports.ticketsByFaculty.map((row) => [row.faculty, row.count]),
    ]);
    return;
  }

  if (activeTab === "issues") {
    downloadCsv("issue-categories.csv", [
      ["Issue category", "Tickets"],
      ...reports.ticketsByIssueCategory.map((row) => [formatLabel(row.issueCategory), row.count]),
    ]);
    return;
  }

  if (activeTab === "workload") {
    downloadCsv("technician-workload.csv", [
      ["Technician", "Role", "Assigned", "Completed"],
      ...reports.technicianWorkload.map((row) => [row.fullName, formatLabel(row.role), row.assignedTickets, row.completedTickets]),
    ]);
    return;
  }

  if (activeTab === "repairTime") {
    downloadCsv("average-repair-time.csv", [
      ["Group", "Label", "Average days", "Tickets"],
      ...reports.averageRepairTime.weekly.map((row) => ["Week", row.label, row.days, row.count]),
      ...reports.averageRepairTime.byIssueCategory.map((row) => ["Issue category", formatLabel(row.issueCategory), row.days, row.count]),
    ]);
    return;
  }

  downloadCsv("custody-exceptions.csv", [
    ["Tracking", "Requester", "Device", "Custody status", "Storage", "Received", "Ready"],
    ...reports.custodyExceptions.map((row) => [
      row.trackingCode,
      row.requesterName,
      `${row.device.deviceType} ${row.device.brand} ${row.device.model}`,
      formatLabel(row.custodyStatus),
      row.storageLocation,
      formatDate(row.receivedAt),
      formatDate(row.readyForCollectionAt),
    ]),
  ]);
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border-strong)] bg-white p-5">
      <p className="text-sm font-semibold text-[var(--foreground)]">{message}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">This panel will populate as matching service desk activity is recorded.</p>
    </div>
  );
}

function MetricCard({
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
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
      <p className="metric-value mt-2 text-2xl font-black text-[var(--foreground)]">
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
      {detail ? <p className="mt-2 text-xs font-medium text-[var(--muted)]">{detail}</p> : null}
    </article>
  );
}

function HorizontalBarList({
  emptyText,
  rows,
  valueLabel = "Tickets",
}: {
  emptyText: string;
  rows: Array<{ label: string; value: number; detail?: string; tone?: MetricTone }>;
  valueLabel?: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));

  if (rows.length === 0) {
    return <EmptyState message={emptyText} />;
  }

  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-2 sm:grid-cols-[minmax(150px,220px)_1fr_auto] sm:items-center">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">{row.label}</p>
            {row.detail ? <p className="mt-0.5 text-xs text-[var(--muted)]">{row.detail}</p> : null}
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[var(--slate-100)]">
            <div
              className={`h-full rounded-full ${barToneClasses[row.tone ?? "accent"]}`}
              style={{ width: row.value === 0 ? 0 : `${Math.max(3, Math.round((row.value / max) * 100))}%` }}
            />
          </div>
          <p className="metric-value text-sm font-bold text-[var(--foreground)]" aria-label={`${row.value} ${valueLabel}`}>
            {formatNumber(row.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

function ReportPanel({
  children,
  detail,
  title,
}: {
  children: React.ReactNode;
  detail: string;
  title: string;
}) {
  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-[var(--border)] bg-white px-5 py-4">
        <p className="text-sm font-bold text-[var(--foreground)]">{title}</p>
        <p className="mt-1 text-xs font-medium text-[var(--muted)]">{detail}</p>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function OverviewGrid({ reports }: { reports: ServiceDeskReportBundle }) {
  const averageDays = getOverallAverageDays(reports);
  const queueMetrics = [
    { label: "Waiting student", value: reports.overview.waitingForStudent, tone: reports.overview.waitingForStudent > 0 ? "warning" : "default" },
    { label: "Waiting parts", value: reports.overview.waitingForReplacementPart, tone: reports.overview.waitingForReplacementPart > 0 ? "warning" : "default" },
    { label: "Ready pickup", value: reports.overview.readyForPickup, tone: reports.overview.readyForPickup > 0 ? "success" : "default" },
    { label: "In custody", value: reports.overview.devicesCurrentlyInCustody, tone: reports.overview.devicesCurrentlyInCustody > 0 ? "accent" : "default" },
    { label: "Overdue pickup", value: reports.overview.overdueReadyForPickup, tone: reports.overview.overdueReadyForPickup > 0 ? "danger" : "default" },
  ] as const;

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total tickets" value={reports.overview.totalTickets} />
        <MetricCard label="Open" value={reports.overview.openTickets} tone={reports.overview.openTickets > 0 ? "accent" : "default"} />
        <MetricCard label="Closed" value={reports.overview.closedTickets} tone="success" />
        <MetricCard label="Avg. repair time" value={formatDays(averageDays)} />
        <MetricCard
          label="Custody exceptions"
          value={reports.custodyExceptions.length}
          tone={reports.custodyExceptions.length > 0 ? "danger" : "default"}
        />
      </section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {queueMetrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
        ))}
      </section>
    </div>
  );
}

function FacultyTab({ reports }: { reports: ServiceDeskReportBundle }) {
  return (
    <ReportPanel title="Tickets by faculty" detail={`${formatNumber(reports.overview.totalTickets)} tickets in this report`}>
      <HorizontalBarList
        emptyText="No faculty data."
        rows={reports.ticketsByFaculty.map((row) => ({ label: row.faculty, value: row.count }))}
      />
    </ReportPanel>
  );
}

function IssuesTab({ reports }: { reports: ServiceDeskReportBundle }) {
  return (
    <ReportPanel title="Issue categories" detail="Most common reported faults">
      <HorizontalBarList
        emptyText="No issue category data."
        rows={reports.ticketsByIssueCategory.map((row) => {
          const label = formatLabel(row.issueCategory);
          const warning = /liquid|overheat|power|battery/i.test(label);

          return {
            label,
            value: row.count,
            tone: warning ? "warning" : "accent",
          };
        })}
      />
    </ReportPanel>
  );
}

function WorkloadTab({ reports }: { reports: ServiceDeskReportBundle }) {
  const maxLoad = Math.max(1, ...reports.technicianWorkload.map((row) => row.assignedTickets));

  return (
    <ReportPanel title="Technician workload" detail="Assigned vs. closed in the current report">
      {reports.technicianWorkload.length === 0 ? (
        <EmptyState message="No technician workload data." />
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table min-w-[680px] text-left text-sm">
            <thead>
              <tr>
                <th>Technician</th>
                <th className="text-right">Assigned</th>
                <th className="text-right">Closed</th>
                <th className="text-right">Load</th>
              </tr>
            </thead>
            <tbody>
              {reports.technicianWorkload.map((row) => (
                <tr key={row.technicianId}>
                  <td>
                    <p className="font-semibold text-[var(--foreground)]">{row.fullName}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{formatLabel(row.role)}</p>
                  </td>
                  <td className="metric-value text-right font-semibold">{formatNumber(row.assignedTickets)}</td>
                  <td className="metric-value text-right text-[var(--muted-strong)]">{formatNumber(row.completedTickets)}</td>
                  <td>
                    <div className="ml-auto h-2 w-28 overflow-hidden rounded-full bg-[var(--slate-100)]">
                      <div
                        className="h-full rounded-full bg-[var(--blue-600)]"
                        style={{
                          width: row.assignedTickets === 0 ? 0 : `${Math.max(6, Math.round((row.assignedTickets / maxLoad) * 100))}%`,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReportPanel>
  );
}

function RepairTimeTab({ reports }: { reports: ServiceDeskReportBundle }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <ReportPanel title="Average repair time" detail="By week, in days">
        <div className="grid min-h-[168px] grid-cols-5 items-end gap-4">
          {reports.averageRepairTime.weekly.length === 0 ? (
            <div className="col-span-5">
              <EmptyState message="No completed repair time data yet." />
            </div>
          ) : (
            reports.averageRepairTime.weekly.map((row) => {
              const max = Math.max(1, ...reports.averageRepairTime.weekly.map((week) => week.days));

              return (
                <div key={row.label} className="grid gap-2">
                  <p className="metric-value text-center text-xs font-semibold text-[var(--slate-700)]">{row.days.toFixed(1)}</p>
                  <div className="mx-auto flex h-24 w-8 items-end overflow-hidden rounded-t-md bg-[var(--slate-100)]">
                    <div
                      className="w-full rounded-t-md bg-[var(--blue-600)]"
                      style={{ height: row.days === 0 ? 0 : `${Math.max(8, Math.round((row.days / max) * 96))}px` }}
                    />
                  </div>
                  <p className="text-center text-xs font-medium text-[var(--muted)]">{row.label}</p>
                </div>
              );
            })
          )}
        </div>
      </ReportPanel>
      <ReportPanel title="By issue category" detail="Mean turnaround">
        <HorizontalBarList
          emptyText="No repair time by issue category yet."
          valueLabel="days"
          rows={reports.averageRepairTime.byIssueCategory.map((row) => ({
            label: formatLabel(row.issueCategory),
            value: row.days,
            detail: `${formatNumber(row.count)} completed`,
            tone: row.days >= 4 ? "warning" : row.days <= 2 ? "success" : "accent",
          }))}
        />
      </ReportPanel>
    </div>
  );
}

function CustodyTab({ reports }: { reports: ServiceDeskReportBundle }) {
  return (
    <ReportPanel title="Custody exceptions" detail="Devices outside expected chain of custody">
      {reports.custodyExceptions.length === 0 ? (
        <EmptyState message="No open custody exceptions." />
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table min-w-[820px] text-left text-sm">
            <thead>
              <tr>
                <th>Tracking</th>
                <th>Requester</th>
                <th>Device</th>
                <th>Custody</th>
                <th>Storage</th>
                <th>Received</th>
                <th>Ready</th>
              </tr>
            </thead>
            <tbody>
              {reports.custodyExceptions.map((row) => (
                <tr key={row.custodyId}>
                  <td className="tracking-code font-bold text-[var(--blue-700)]">{row.trackingCode}</td>
                  <td className="font-semibold text-[var(--foreground)]">{row.requesterName ?? "Requester"}</td>
                  <td className="text-[var(--muted-strong)]">
                    {row.device.deviceType} - {row.device.brand} {row.device.model}
                  </td>
                  <td>
                    <span className="status-badge status-quality">{formatLabel(row.custodyStatus)}</span>
                  </td>
                  <td className="text-[var(--muted-strong)]">{row.storageLocation ?? "Not set"}</td>
                  <td className="text-[var(--muted)]">{formatDate(row.receivedAt)}</td>
                  <td className="text-[var(--muted)]">{formatDate(row.readyForCollectionAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReportPanel>
  );
}

function ActiveReportTab({ activeTab, reports }: { activeTab: ReportTab; reports: ServiceDeskReportBundle }) {
  if (activeTab === "faculty") {
    return <FacultyTab reports={reports} />;
  }

  if (activeTab === "issues") {
    return <IssuesTab reports={reports} />;
  }

  if (activeTab === "workload") {
    return <WorkloadTab reports={reports} />;
  }

  if (activeTab === "repairTime") {
    return <RepairTimeTab reports={reports} />;
  }

  return <CustodyTab reports={reports} />;
}

export function ServiceDeskReports() {
  const [reports, setReports] = useState<ServiceDeskReportBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>("faculty");
  const [isPending, startTransition] = useTransition();
  const activeTabLabel = useMemo(() => reportTabs.find((tab) => tab.key === activeTab)?.label ?? "Report", [activeTab]);

  function loadReports() {
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/admin/service-desk/reports", { method: "GET" });
      const body = (await response.json().catch(() => null)) as ReportsResponse | null;

      if (!response.ok || !body?.reports) {
        setReports(null);
        setError(body?.error ?? "Unable to load service desk reports.");
        return;
      }

      setReports(body.reports);
    });
  }

  useEffect(() => {
    loadReports();
  }, []);

  if (!reports && isPending) {
    return (
      <div className="panel p-6">
        <p className="text-sm font-semibold text-[var(--muted)]">Loading service desk reports...</p>
      </div>
    );
  }

  if (!reports && error) {
    return (
      <div className="panel border-[var(--fill-danger-soft-border)] bg-[var(--danger-bg)] p-6">
        <p className="text-sm font-semibold text-[var(--danger)]">{error}</p>
        <button type="button" onClick={loadReports} className="btn-secondary mt-4">
          Retry
        </button>
      </div>
    );
  }

  if (!reports) {
    return null;
  }

  return (
    <div className="grid gap-5">
      <section className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Management overview</p>
            <h2 className="mt-2 text-xl font-bold text-[var(--foreground)]">Service desk health</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-strong)]">
              Monitor ticket volume, workload, issue patterns, repair timing, and custody exceptions from one operational report.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={loadReports} disabled={isPending} className="btn-secondary">
              {isPending ? "Refreshing..." : "Refresh"}
            </button>
            <button type="button" onClick={() => exportCurrentTab(reports, activeTab)} className="btn-primary">
              Export CSV
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-[var(--fill-warning-soft-border)] bg-[var(--fill-warning-soft)] p-4 text-sm font-medium text-[var(--amber-800)]">
          {error}
        </div>
      ) : null}

      <OverviewGrid reports={reports} />

      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-white px-5 py-3">
          <div aria-label="Report sections" className="flex min-w-0 flex-1 gap-1 overflow-x-auto" role="tablist">
            {reportTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`border-b-2 px-3 py-2 text-sm font-semibold ${
                  activeTab === tab.key
                    ? "border-[var(--blue-600)] text-[var(--foreground)]"
                    : "border-transparent text-[var(--muted-strong)] hover:text-[var(--foreground)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="status-badge status-received">{activeTabLabel}</span>
        </div>
        <div className="bg-[var(--bg-app)] p-5">
          <ActiveReportTab activeTab={activeTab} reports={reports} />
        </div>
      </section>
    </div>
  );
}
