"use client";

import { useEffect, useState, useTransition } from "react";
import type { ServiceDeskReportBundle } from "@/lib/service-desk/service-desk-reports";

type ReportsResponse = {
  error?: string;
  reports?: ServiceDeskReportBundle;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
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

const overviewToneClasses = {
  default: "border-[var(--border)] bg-white",
  warning: "border-[var(--fill-warning-soft-border)] bg-[var(--fill-warning-soft)]",
  danger: "border-[var(--fill-danger-soft-border)] bg-[var(--fill-danger-soft)]",
} as const;

function OverviewCard({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: keyof typeof overviewToneClasses;
  value: number;
}) {
  return (
    <article className={`rounded-lg border p-4 shadow-[var(--shadow-xs)] ${overviewToneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
      <p className="metric-value mt-2 text-2xl font-black text-[var(--foreground)]">{formatNumber(value)}</p>
    </article>
  );
}

function CountTable({ emptyText, label, rows, title }: { emptyText: string; label: string; rows: Array<{ name: string; count: number }>; title: string }) {
  return (
    <section className="panel p-5">
      <h2 className="text-lg font-bold text-[var(--foreground)]">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="data-table text-left text-sm">
          <thead>
            <tr>
              <th>{label}</th>
              <th className="text-right">Tickets</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-4 text-[var(--muted)]">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${title}-${row.name}`} className="border-b border-[var(--border)] last:border-0">
                  <th className="py-3 pr-4 font-semibold text-[var(--foreground)]">{row.name}</th>
                  <td className="py-3 text-right text-[var(--muted)]">{formatNumber(row.count)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TechnicianWorkloadTable({ reports }: { reports: ServiceDeskReportBundle }) {
  return (
    <section className="panel p-5">
      <h2 className="text-lg font-bold text-[var(--foreground)]">Technician workload</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="data-table min-w-[560px] text-left text-sm">
          <thead>
            <tr>
              <th>Technician</th>
              <th>Role</th>
              <th className="text-right">Assigned</th>
              <th className="text-right">Completed</th>
            </tr>
          </thead>
          <tbody>
            {reports.technicianWorkload.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-[var(--muted)]">
                  No technician workload data.
                </td>
              </tr>
            ) : (
              reports.technicianWorkload.map((row) => (
                <tr key={row.technicianId} className="border-b border-[var(--border)] last:border-0">
                  <th className="py-3 pr-4 font-semibold text-[var(--foreground)]">{row.fullName}</th>
                  <td className="py-3 text-[var(--muted)]">{formatLabel(row.role)}</td>
                  <td className="py-3 text-right text-[var(--muted)]">{formatNumber(row.assignedTickets)}</td>
                  <td className="py-3 text-right text-[var(--muted)]">{formatNumber(row.completedTickets)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CustodyExceptionsTable({ reports }: { reports: ServiceDeskReportBundle }) {
  return (
    <section className="rounded-lg border border-[var(--fill-warning-soft-border)] bg-[var(--fill-warning-soft)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Custody accountability</p>
          <h2 className="mt-2 text-lg font-bold text-[var(--foreground)]">Open custody exceptions</h2>
        </div>
        <span className="rounded-full border border-[var(--amber-200)] bg-white px-3 py-1 text-sm font-bold text-[var(--amber-800)]">
          {formatNumber(reports.custodyExceptions.length)}
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="data-table min-w-[760px] text-left text-sm">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Requester</th>
              <th>Device</th>
              <th>Custody</th>
              <th>Storage</th>
              <th>Received</th>
              <th>Ready</th>
            </tr>
          </thead>
          <tbody>
            {reports.custodyExceptions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-[var(--amber-800)]">
                  No open custody exceptions.
                </td>
              </tr>
            ) : (
              reports.custodyExceptions.map((row) => (
                <tr key={row.custodyId}>
                  <th className="tracking-code py-3 pr-4 font-black text-[var(--foreground)]">{row.trackingCode}</th>
                  <td className="py-3 pr-4 text-[var(--muted)]">{row.requesterName ?? "Requester"}</td>
                  <td className="py-3 pr-4 text-[var(--muted)]">
                    {row.device.deviceType} - {row.device.brand} {row.device.model}
                  </td>
                  <td className="py-3 pr-4 font-semibold text-[var(--amber-800)]">{formatLabel(row.custodyStatus)}</td>
                  <td className="py-3 pr-4 font-semibold text-[var(--foreground)]">{row.storageLocation ?? "Not set"}</td>
                  <td className="py-3 pr-4 text-[var(--muted)]">{formatDate(row.receivedAt)}</td>
                  <td className="py-3 text-[var(--muted)]">{formatDate(row.readyForCollectionAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ServiceDeskReports() {
  const [reports, setReports] = useState<ServiceDeskReportBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
    <div className="grid gap-6">
      <section className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Management overview</p>
            <h2 className="mt-2 text-xl font-bold text-[var(--foreground)]">Service desk health</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-strong)]">
              Monitor ticket volume, workload, issue patterns, and custody exceptions from the same operational report.
            </p>
          </div>
          <button type="button" onClick={loadReports} disabled={isPending} className="btn-secondary">
            {isPending ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-[var(--fill-warning-soft-border)] bg-[var(--fill-warning-soft)] p-4 text-sm font-medium text-[var(--amber-800)]">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <OverviewCard label="Total tickets" value={reports.overview.totalTickets} />
        <OverviewCard label="Open" value={reports.overview.openTickets} />
        <OverviewCard label="Closed" value={reports.overview.closedTickets} />
        <OverviewCard label="Waiting student" tone="warning" value={reports.overview.waitingForStudent} />
        <OverviewCard label="Ready pickup" tone="warning" value={reports.overview.readyForPickup} />
        <OverviewCard label="Cancelled" value={reports.overview.cancelledTickets} />
        <OverviewCard label="Waiting parts" tone="warning" value={reports.overview.waitingForReplacementPart} />
        <OverviewCard label="In custody" tone="warning" value={reports.overview.devicesCurrentlyInCustody} />
        <OverviewCard label="Overdue pickup" tone="warning" value={reports.overview.overdueReadyForPickup} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <CountTable
          title="Tickets by faculty"
          label="Faculty"
          emptyText="No faculty data."
          rows={reports.ticketsByFaculty.map((row) => ({ name: row.faculty, count: row.count }))}
        />
        <CountTable
          title="Tickets by issue category"
          label="Issue category"
          emptyText="No issue category data."
          rows={reports.ticketsByIssueCategory.map((row) => ({ name: formatLabel(row.issueCategory), count: row.count }))}
        />
      </section>

      <TechnicianWorkloadTable reports={reports} />
      <CustodyExceptionsTable reports={reports} />
    </div>
  );
}
