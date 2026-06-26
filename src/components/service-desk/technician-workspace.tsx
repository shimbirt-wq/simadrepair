"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";
import { REPAIR_METHOD_LABELS, SEVERITY_LABELS } from "@/lib/service-desk/constants";
import {
  formatIssueCategory,
  formatStatus,
  getStatusClass,
  TechnicianTicketDetail,
  type TechnicianTicketDetailData,
} from "@/components/service-desk/technician-ticket-detail";

type QueueTicket = {
  id: string;
  ticketId: string;
  trackingCode: string | null;
  status: string;
  severity: string | null;
  repairMethod: string | null;
  issueCategory: string | null;
  createdAt: string;
  assignedAt: string | null;
  requester: {
    fullName: string | null;
    requesterType: string | null;
    universityId: string | null;
    faculty: string | null;
    department: string | null;
  };
  device: {
    deviceType: string;
    brand: string;
    model: string;
  };
};

type QueueResponse = {
  error?: string;
  tickets?: QueueTicket[];
};

type DetailResponse = {
  error?: string;
  ticket?: TechnicianTicketDetailData;
};

type FocusFilter = "all" | "diagnosis" | "repair" | "quality" | "priority";

const TECHNICIAN_STATUS_OPTIONS = [
  "DEVICE_RECEIVED",
  "DIAGNOSIS_IN_PROGRESS",
  "REPAIR_IN_PROGRESS",
  "QUALITY_INSPECTION",
] as const;

const FOCUS_FILTERS: Array<{ label: string; value: FocusFilter }> = [
  { label: "All work", value: "all" },
  { label: "Needs diagnosis", value: "diagnosis" },
  { label: "In repair", value: "repair" },
  { label: "Quality check", value: "quality" },
  { label: "High priority", value: "priority" },
];

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatSeverity(value: string | null) {
  if (!value) {
    return "Unset";
  }

  return SEVERITY_LABELS[value as keyof typeof SEVERITY_LABELS] ?? value.replaceAll("_", " ");
}

function formatRepairMethod(value: string | null) {
  if (!value) {
    return "Unset";
  }

  return REPAIR_METHOD_LABELS[value as keyof typeof REPAIR_METHOD_LABELS] ?? value.replaceAll("_", " ");
}

function getPriorityClass(severity: string | null) {
  if (severity === "CRITICAL" || severity === "HIGH") {
    return "status-overdue";
  }

  if (severity === "MEDIUM") {
    return "status-quality";
  }

  return "status-received";
}

function queueSearchText(ticket: QueueTicket) {
  return [
    ticket.ticketId,
    ticket.trackingCode,
    ticket.status,
    ticket.severity,
    ticket.repairMethod,
    ticket.issueCategory,
    ticket.requester.fullName,
    ticket.requester.universityId,
    ticket.requester.faculty,
    ticket.requester.department,
    ticket.device.deviceType,
    ticket.device.brand,
    ticket.device.model,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesFocus(ticket: QueueTicket, focus: FocusFilter) {
  if (focus === "all") {
    return true;
  }

  if (focus === "diagnosis") {
    return ticket.status === "DEVICE_RECEIVED" || ticket.status === "DIAGNOSIS_IN_PROGRESS";
  }

  if (focus === "repair") {
    return ticket.status === "REPAIR_IN_PROGRESS";
  }

  if (focus === "quality") {
    return ticket.status === "QUALITY_INSPECTION";
  }

  return ticket.severity === "CRITICAL" || ticket.severity === "HIGH";
}

function QueueStat({
  detail,
  label,
  tone = "default",
  value,
}: {
  detail: string;
  label: string;
  tone?: "default" | "accent" | "success" | "warning" | "danger";
  value: number;
}) {
  const toneClass = {
    default: "border-l-[var(--slate-300)]",
    accent: "border-l-[var(--blue-600)]",
    success: "border-l-[var(--green-700)]",
    warning: "border-l-[var(--amber-600)]",
    danger: "border-l-[var(--red-600)]",
  }[tone];

  return (
    <article className={`rounded-lg border border-[var(--border)] border-l-[3px] bg-white p-4 ${toneClass}`}>
      <p className="eyebrow">{label}</p>
      <p className="metric-value mt-2 text-2xl font-bold leading-none text-[var(--foreground)]">{value}</p>
      <p className="mt-2 text-xs font-medium text-[var(--muted)]">{detail}</p>
    </article>
  );
}

export function TechnicianWorkspace() {
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TechnicianTicketDetailData | null>(null);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [focusFilter, setFocusFilter] = useState<FocusFilter>("all");
  const [isQueuePending, startQueueTransition] = useTransition();
  const [isDetailPending, startDetailTransition] = useTransition();

  const selectedQueueTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [selectedTicketId, tickets],
  );

  const queueStats = useMemo(
    () => ({
      total: tickets.length,
      diagnosing: tickets.filter((ticket) => ticket.status === "DEVICE_RECEIVED" || ticket.status === "DIAGNOSIS_IN_PROGRESS").length,
      repairing: tickets.filter((ticket) => ticket.status === "REPAIR_IN_PROGRESS").length,
      quality: tickets.filter((ticket) => ticket.status === "QUALITY_INSPECTION").length,
    }),
    [tickets],
  );

  const filteredTickets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesSearch = query.length === 0 || queueSearchText(ticket).includes(query);
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;

      return matchesSearch && matchesStatus && matchesFocus(ticket, focusFilter);
    });
  }, [focusFilter, searchQuery, statusFilter, tickets]);

  function loadQueue(nextSelectedTicketId?: string | null) {
    setQueueError(null);

    startQueueTransition(async () => {
      const response = await fetch("/api/technician/workspace/tickets", { method: "GET" });
      const body = (await response.json().catch(() => null)) as QueueResponse | null;

      if (!response.ok || !body?.tickets) {
        setQueueError(body?.error ?? "Unable to load assigned repair queue.");
        return;
      }

      setTickets(body.tickets);
      setSelectedTicketId((current) => {
        const preferred = nextSelectedTicketId ?? current;
        const preferredStillExists = preferred ? body.tickets?.some((ticket) => ticket.id === preferred) : false;

        return preferredStillExists ? preferred : body.tickets?.[0]?.id ?? null;
      });
    });
  }

  function loadTicket(ticketId: string) {
    setDetailError(null);
    setSelectedTicketId(ticketId);

    startDetailTransition(async () => {
      const response = await fetch(`/api/technician/workspace/tickets/${encodeURIComponent(ticketId)}`, { method: "GET" });
      const body = (await response.json().catch(() => null)) as DetailResponse | null;

      if (!response.ok || !body?.ticket) {
        setSelectedTicket(null);
        setDetailError(body?.error ?? "Unable to load ticket detail.");
        return;
      }

      setSelectedTicket(body.ticket);
    });
  }

  function handleTicketUpdated(ticket: TechnicianTicketDetailData) {
    setSelectedTicket(ticket);
    loadQueue(ticket.id);
  }

  function resetFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setFocusFilter("all");
  }

  useEffect(() => {
    loadQueue();
  }, []);

  useEffect(() => {
    if (selectedTicketId) {
      loadTicket(selectedTicketId);
    } else {
      setSelectedTicket(null);
    }
  }, [selectedTicketId]);

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <QueueStat label="Assigned" value={queueStats.total} detail="Active work in your queue" tone="accent" />
        <QueueStat label="Diagnosis" value={queueStats.diagnosing} detail="Device received or diagnosis" />
        <QueueStat label="In repair" value={queueStats.repairing} detail="Active bench work" />
        <QueueStat label="Quality check" value={queueStats.quality} detail="Ready for verification" tone="warning" />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(520px,0.95fr)_minmax(0,1.25fr)]">
        <section className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-white px-5 py-4">
            <div>
              <p className="eyebrow">Assigned queue</p>
              <h2 className="mt-1 text-base font-semibold text-[var(--foreground)]">Repair work</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="status-badge status-received">{filteredTickets.length} shown</span>
              <button type="button" onClick={() => loadQueue(selectedTicketId)} className="btn-secondary" disabled={isQueuePending}>
                {isQueuePending ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="grid gap-3 border-b border-[var(--border)] bg-[var(--surface-alt)] p-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_170px_170px_auto]">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search ticket, requester, device..."
                className="w-full rounded-md border border-[var(--border-strong)] bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--blue-500)] focus:ring-2 focus:ring-[var(--blue-100)]"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-md border border-[var(--border-strong)] bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--blue-500)] focus:ring-2 focus:ring-[var(--blue-100)]"
              >
                <option value="all">All statuses</option>
                {TECHNICIAN_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {REPAIR_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <select
                value={focusFilter}
                onChange={(event) => setFocusFilter(event.target.value as FocusFilter)}
                className="w-full rounded-md border border-[var(--border-strong)] bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--blue-500)] focus:ring-2 focus:ring-[var(--blue-100)]"
              >
                {FOCUS_FILTERS.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
              <button type="button" onClick={resetFilters} className="btn-ghost">
                Reset
              </button>
            </div>
          </div>

          {queueError ? (
            <div className="border-b border-[var(--fill-danger-soft-border)] bg-[var(--danger-bg)] px-5 py-3 text-sm font-medium text-[var(--danger)]">
              {queueError}
            </div>
          ) : null}

          <div className="max-h-[620px] overflow-auto">
            {filteredTickets.length > 0 ? (
              <table className="data-table min-w-[760px] text-left text-sm">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Requester</th>
                    <th>Device / issue</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className={ticket.id === selectedTicketId ? "bg-[var(--surface-selected)]" : undefined}>
                      <td>
                        <p className="tracking-code break-all font-bold text-[var(--foreground)]">
                          {ticket.trackingCode ?? ticket.ticketId}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">Assigned {formatDate(ticket.assignedAt)}</p>
                      </td>
                      <td>
                        <p className="font-semibold text-[var(--foreground)]">{ticket.requester.fullName ?? "Requester"}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {ticket.requester.faculty ?? "Faculty not set"} - {ticket.requester.universityId ?? "No ID"}
                        </p>
                      </td>
                      <td>
                        <p className="font-semibold text-[var(--foreground)]">
                          {ticket.device.brand} {ticket.device.model}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">{formatIssueCategory(ticket.issueCategory)}</p>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(ticket.status)}`}>{formatStatus(ticket.status)}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${getPriorityClass(ticket.severity)}`}>{formatSeverity(ticket.severity)}</span>
                        <p className="mt-1 text-xs text-[var(--muted)]">{formatRepairMethod(ticket.repairMethod)}</p>
                      </td>
                      <td className="text-right">
                        <button type="button" onClick={() => setSelectedTicketId(ticket.id)} className="btn-ghost">
                          {ticket.id === selectedTicketId ? "Open" : "Review"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="m-5 rounded-lg border border-dashed border-[var(--border-strong)] bg-white p-5">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {isQueuePending ? "Loading assigned repairs..." : "No tickets match this view."}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Clear filters or search by another tracking code, requester, device, status, or priority.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="min-w-0">
          {detailError ? (
            <div className="panel mb-4 border-[var(--fill-danger-soft-border)] bg-[var(--danger-bg)] p-5 text-sm font-medium text-[var(--danger)]">
              {detailError}
            </div>
          ) : null}

          {selectedTicket ? (
            <TechnicianTicketDetail ticket={selectedTicket} onTicketUpdated={handleTicketUpdated} />
          ) : (
            <div className="panel p-8">
              <p className="eyebrow">Ticket detail</p>
              <h2 className="mt-3 text-2xl font-bold text-[var(--foreground)]">
                {selectedQueueTicket || isDetailPending ? "Loading ticket detail" : "Select a repair"}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                Choose an assigned queue item to inspect requester contact, device details, repair events, and technician actions.
              </p>
              {selectedQueueTicket ? (
                <p className="mt-4 text-sm font-semibold text-[var(--muted-strong)]">
                  {selectedQueueTicket.trackingCode ?? selectedQueueTicket.ticketId} -{" "}
                  {REPAIR_STATUS_LABELS[selectedQueueTicket.status as keyof typeof REPAIR_STATUS_LABELS] ?? selectedQueueTicket.status}
                </p>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
