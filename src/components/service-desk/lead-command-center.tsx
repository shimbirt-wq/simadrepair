"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";
import {
  ISSUE_CATEGORY_LABELS,
  ISSUE_CATEGORY_OPTIONS,
  REPAIR_METHOD_LABELS,
  SEVERITY_LABELS,
} from "@/lib/service-desk/constants";
import { LeadTicketDetail, type LeadTicketDetailData } from "@/components/service-desk/lead-ticket-detail";

type QueueTicket = {
  id: string;
  ticketId: string;
  trackingCode: string | null;
  status: string;
  issueCategory: string | null;
  createdAt: string;
  severity: string | null;
  repairMethod: string | null;
  requester: {
    fullName: string | null;
    faculty: string | null;
  };
  device: {
    deviceType: string;
    brand: string;
    model: string;
  };
  technician: {
    id: string;
    fullName: string;
    role: string;
  } | null;
};

type TechnicianOption = {
  id: string;
  fullName: string;
  role: string;
};

type QueueResponse = {
  error?: string;
  tickets?: QueueTicket[];
};

type TechniciansResponse = {
  error?: string;
  technicians?: TechnicianOption[];
};

type DetailResponse = {
  error?: string;
  ticket?: LeadTicketDetailData;
};

type AssignmentResponse = {
  error?: string;
  ticket?: LeadTicketDetailData;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatus(value: string) {
  return REPAIR_STATUS_LABELS[value as keyof typeof REPAIR_STATUS_LABELS] ?? value.replaceAll("_", " ");
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

function formatIssueCategory(value: string | null) {
  if (!value) {
    return "Unclassified";
  }

  if (!ISSUE_CATEGORY_OPTIONS.includes(value as (typeof ISSUE_CATEGORY_OPTIONS)[number])) {
    return value.replaceAll("_", " ");
  }

  return ISSUE_CATEGORY_LABELS[value as (typeof ISSUE_CATEGORY_OPTIONS)[number]];
}

function getStatusClass(status: string) {
  const statusClasses: Record<string, string> = {
    REGISTRATION_COMPLETED: "status-registration",
    DEVICE_RECEIVED: "status-received",
    DIAGNOSIS_IN_PROGRESS: "status-diagnosis",
    REPAIR_IN_PROGRESS: "status-repair",
    QUALITY_INSPECTION: "status-quality",
    READY_FOR_COLLECTION: "status-ready",
    DEVICE_COLLECTED: "status-collected",
  };

  return statusClasses[status] ?? "status-registration";
}

function getRiskClass(ticket: QueueTicket) {
  if (ticket.severity === "CRITICAL") {
    return "text-[var(--red-700)]";
  }

  if (ticket.severity === "HIGH" || !ticket.technician) {
    return "text-[var(--amber-700)]";
  }

  return "text-[var(--slate-500)]";
}

function needsTriage(ticket: QueueTicket) {
  return ticket.status === "REGISTRATION_COMPLETED" || !ticket.severity || !ticket.repairMethod;
}

function queueSearchText(ticket: QueueTicket) {
  return [
    ticket.ticketId,
    ticket.trackingCode,
    ticket.requester.fullName,
    ticket.requester.faculty,
    ticket.device.brand,
    ticket.device.model,
    ticket.device.deviceType,
    formatIssueCategory(ticket.issueCategory),
    formatStatus(ticket.status),
    ticket.technician?.fullName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function QueueStat({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "default" | "accent" | "warning" | "danger";
  value: number;
}) {
  const toneClass = {
    default: "border-l-[var(--slate-300)]",
    accent: "border-l-[var(--blue-600)]",
    warning: "border-l-[var(--amber-600)]",
    danger: "border-l-[var(--red-600)]",
  }[tone];

  return (
    <div className={`rounded-lg border border-l-[3px] border-[var(--border)] bg-white px-4 py-3 ${toneClass}`}>
      <p className="eyebrow">{label}</p>
      <p className="metric-value mt-1 text-2xl font-bold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

export function LeadCommandCenter() {
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<LeadTicketDetailData | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [assignmentFilter, setAssignmentFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [queueError, setQueueError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(null);
  const [isAssignmentError, setIsAssignmentError] = useState(false);
  const [isQueuePending, startQueueTransition] = useTransition();
  const [isDetailPending, startDetailTransition] = useTransition();
  const [isAssignPending, startAssignTransition] = useTransition();

  const selectedQueueTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [selectedTicketId, tickets],
  );

  const queueStats = useMemo(
    () => ({
      total: tickets.length,
      unassigned: tickets.filter((ticket) => !ticket.technician).length,
      triage: tickets.filter(needsTriage).length,
      highRisk: tickets.filter((ticket) => ticket.severity === "CRITICAL" || ticket.severity === "HIGH").length,
    }),
    [tickets],
  );

  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesQuery = !normalizedQuery || queueSearchText(ticket).includes(normalizedQuery);
      const matchesStatus = statusFilter === "ALL" || ticket.status === statusFilter;
      const matchesAssignment =
        assignmentFilter === "ALL" ||
        (assignmentFilter === "UNASSIGNED" && !ticket.technician) ||
        (assignmentFilter === "ASSIGNED" && Boolean(ticket.technician));
      const matchesPriority =
        priorityFilter === "ALL" ||
        (priorityFilter === "TRIAGE" && needsTriage(ticket)) ||
        (priorityFilter === "ASSIGNMENT" && !ticket.technician) ||
        (priorityFilter === "HIGH_RISK" && (ticket.severity === "CRITICAL" || ticket.severity === "HIGH"));

      return matchesQuery && matchesStatus && matchesAssignment && matchesPriority;
    });
  }, [assignmentFilter, priorityFilter, query, statusFilter, tickets]);

  function loadQueue(nextSelectedTicketId?: string | null) {
    setQueueError(null);

    startQueueTransition(async () => {
      const response = await fetch("/api/lead/tickets", { method: "GET" });
      const body = (await response.json().catch(() => null)) as QueueResponse | null;

      if (!response.ok || !body?.tickets) {
        setQueueError(body?.error ?? "Unable to load the lead triage queue.");
        return;
      }

      setTickets(body.tickets);
      setSelectedTicketId((current) => {
        const preferredId = nextSelectedTicketId ?? current;
        const preferredStillExists = preferredId ? body.tickets?.some((ticket) => ticket.id === preferredId) : false;

        return preferredStillExists ? preferredId : body.tickets?.[0]?.id ?? null;
      });
    });
  }

  function loadTechnicians() {
    startQueueTransition(async () => {
      const response = await fetch("/api/lead/technicians", { method: "GET" });
      const body = (await response.json().catch(() => null)) as TechniciansResponse | null;

      if (!response.ok || !body?.technicians) {
        setQueueError(body?.error ?? "Unable to load technicians.");
        return;
      }

      setTechnicians(body.technicians);
    });
  }

  function loadTicket(ticketId: string) {
    setDetailError(null);
    setSelectedTicketId(ticketId);

    startDetailTransition(async () => {
      const response = await fetch(`/api/lead/tickets/${encodeURIComponent(ticketId)}`, { method: "GET" });
      const body = (await response.json().catch(() => null)) as DetailResponse | null;

      if (!response.ok || !body?.ticket) {
        setSelectedTicket(null);
        setDetailError(body?.error ?? "Unable to load ticket detail.");
        return;
      }

      setSelectedTicket(body.ticket);
    });
  }

  function handleTicketUpdated(ticket: LeadTicketDetailData) {
    setSelectedTicket(ticket);
    loadQueue(ticket.id);
  }

  function handleQuickAssign(event: FormEvent<HTMLFormElement>, ticketId: string) {
    event.preventDefault();
    setAssignmentMessage(null);
    setIsAssignmentError(false);

    const formData = new FormData(event.currentTarget);
    const technicianId = String(formData.get("technicianId") ?? "");

    startAssignTransition(async () => {
      const response = await fetch(`/api/lead/tickets/${encodeURIComponent(ticketId)}/assign`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ technicianId }),
      });
      const body = (await response.json().catch(() => null)) as AssignmentResponse | null;

      if (!response.ok || !body?.ticket) {
        setIsAssignmentError(true);
        setAssignmentMessage(body?.error ?? "Unable to assign technician.");
        return;
      }

      setAssignmentMessage("Assignment updated.");
      setSelectedTicket(body.ticket);
      loadQueue(body.ticket.id);
    });
  }

  function resetFilters() {
    setQuery("");
    setStatusFilter("ALL");
    setAssignmentFilter("ALL");
    setPriorityFilter("ALL");
  }

  useEffect(() => {
    loadQueue();
    loadTechnicians();
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
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QueueStat label="Queue" value={queueStats.total} tone="accent" />
        <QueueStat label="Needs triage" value={queueStats.triage} tone={queueStats.triage > 0 ? "warning" : "default"} />
        <QueueStat label="Unassigned" value={queueStats.unassigned} tone={queueStats.unassigned > 0 ? "warning" : "default"} />
        <QueueStat label="High risk" value={queueStats.highRisk} tone={queueStats.highRisk > 0 ? "danger" : "default"} />
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.95fr)]">
        <div className="panel overflow-hidden xl:sticky xl:top-[88px]">
          <div className="border-b border-[var(--border)] bg-white px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Lead queue</p>
                <h2 className="mt-2 text-lg font-semibold text-[var(--foreground)]">Triage and assignment board</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Search, filter, open detail, or assign a technician from one compact queue.
                </p>
              </div>
              <button type="button" onClick={() => loadQueue(selectedTicketId)} className="btn-secondary">
                {isQueuePending ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(180px,1fr)_170px_160px_170px_auto]">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search ticket, requester, device..."
                className="field-control"
              />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="field-control">
                <option value="ALL">All statuses</option>
                {Object.entries(REPAIR_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select value={assignmentFilter} onChange={(event) => setAssignmentFilter(event.target.value)} className="field-control">
                <option value="ALL">All owners</option>
                <option value="UNASSIGNED">Unassigned</option>
                <option value="ASSIGNED">Assigned</option>
              </select>
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="field-control">
                <option value="ALL">All priorities</option>
                <option value="TRIAGE">Needs triage</option>
                <option value="ASSIGNMENT">Needs assignment</option>
                <option value="HIGH_RISK">High risk</option>
              </select>
              <button type="button" onClick={resetFilters} className="btn-secondary">
                Reset
              </button>
            </div>

            {assignmentMessage ? (
              <p className={`mt-3 text-sm font-medium ${isAssignmentError ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
                {assignmentMessage}
              </p>
            ) : null}
          </div>

          {queueError ? (
            <div className="border-b border-[var(--fill-danger-soft-border)] bg-[var(--danger-bg)] px-5 py-3 text-sm font-medium text-[var(--danger)]">
              {queueError}
            </div>
          ) : null}

          <div className="max-h-[620px] overflow-auto">
            {filteredTickets.length > 0 ? (
              <table className="data-table min-w-[960px] text-sm">
                <thead className="sticky top-0 z-[1] bg-white shadow-[0_1px_0_var(--border)]">
                  <tr>
                    <th>Ticket</th>
                    <th>Requester</th>
                    <th>Device / issue</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => {
                    const isSelected = ticket.id === selectedTicketId;

                    return (
                      <tr key={ticket.id} className={isSelected ? "bg-[var(--surface-selected)]" : undefined}>
                        <td>
                          <button
                            type="button"
                            onClick={() => loadTicket(ticket.id)}
                            className="tracking-code text-left font-bold text-[var(--blue-700)] hover:underline"
                          >
                            {ticket.trackingCode ?? ticket.ticketId}
                          </button>
                          <p className="tnum mt-1 text-xs text-[var(--muted)]">{formatDate(ticket.createdAt)}</p>
                        </td>
                        <td>
                          <p className="font-semibold text-[var(--foreground)]">{ticket.requester.fullName ?? "Requester not set"}</p>
                          <p className="mt-1 text-xs text-[var(--muted)]">{ticket.requester.faculty ?? "Faculty not set"}</p>
                        </td>
                        <td>
                          <p className="font-semibold text-[var(--foreground)]">
                            {ticket.device.brand} {ticket.device.model}
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted)]">{formatIssueCategory(ticket.issueCategory)}</p>
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusClass(ticket.status)}`}>{formatStatus(ticket.status)}</span>
                          <p className={`mt-2 text-xs font-semibold ${getRiskClass(ticket)}`}>
                            {formatSeverity(ticket.severity)} / {formatRepairMethod(ticket.repairMethod)}
                          </p>
                        </td>
                        <td>
                          <form onSubmit={(event) => handleQuickAssign(event, ticket.id)} className="flex min-w-[230px] gap-2">
                            <select
                              key={`${ticket.id}-${ticket.technician?.id ?? "unassigned"}`}
                              name="technicianId"
                              defaultValue={ticket.technician?.id ?? ""}
                              required
                              className="field-control min-h-9 py-1 text-sm"
                            >
                              <option value="">Unassigned</option>
                              {technicians.map((technician) => (
                                <option key={technician.id} value={technician.id}>
                                  {technician.fullName}
                                </option>
                              ))}
                            </select>
                            <button type="submit" disabled={isAssignPending || technicians.length === 0} className="btn-secondary min-h-9 px-3">
                              Assign
                            </button>
                          </form>
                        </td>
                        <td className="text-right">
                          <button type="button" onClick={() => loadTicket(ticket.id)} className={isSelected ? "btn-primary" : "btn-secondary"}>
                            Open
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-5">
                <article className="rounded-lg border border-dashed border-[var(--border-strong)] bg-white p-6">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {isQueuePending ? "Loading lead queue..." : "No tickets match the current filters."}
                  </p>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
                    Adjust the filters or search another tracking code to continue routing repairs.
                  </p>
                </article>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-white px-5 py-3 text-sm text-[var(--muted)]">
            <span>
              Showing {filteredTickets.length} of {tickets.length} queue items
            </span>
            <span>{selectedQueueTicket ? `Selected ${selectedQueueTicket.trackingCode ?? selectedQueueTicket.ticketId}` : "No ticket selected"}</span>
          </div>
        </div>

        <section className="min-w-0">
          {detailError ? (
            <div className="panel mb-4 border-[var(--fill-danger-soft-border)] bg-[var(--danger-bg)] p-5 text-sm font-medium text-[var(--danger)]">
              {detailError}
            </div>
          ) : null}

          {selectedTicket ? (
            <LeadTicketDetail ticket={selectedTicket} onTicketUpdated={handleTicketUpdated} />
          ) : (
            <div className="panel p-8">
              <p className="eyebrow">Ticket detail</p>
              <h2 className="mt-3 text-2xl font-bold text-[var(--foreground)]">
                {isDetailPending || selectedQueueTicket ? "Loading ticket detail" : "Select a ticket"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Choose a queue item to review requester contact, device information, events, triage controls, custody, and assignment.
              </p>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
