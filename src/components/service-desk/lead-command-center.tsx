"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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

type QueueResponse = {
  error?: string;
  tickets?: QueueTicket[];
};

type DetailResponse = {
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

function getSeverityBorderClass(severity: string | null) {
  const severityClasses: Record<string, string> = {
    CRITICAL: "border-l-[var(--red-700)]",
    HIGH: "border-l-[var(--amber-700)]",
    MEDIUM: "border-l-[var(--blue-700)]",
    LOW: "border-l-[var(--slate-400)]",
  };

  return severity ? severityClasses[severity] ?? "border-l-[var(--slate-300)]" : "border-l-[var(--slate-300)]";
}

function QueueStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4">
      <p className="eyebrow">{label}</p>
      <p className="metric-value mt-2 text-2xl font-bold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function QueueCard({
  isSelected,
  onSelect,
  ticket,
}: {
  isSelected: boolean;
  onSelect: () => void;
  ticket: QueueTicket;
}) {
  const severityBorderClass = getSeverityBorderClass(ticket.severity);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`panel w-full border-l-4 p-4 text-left transition ${severityBorderClass} ${
        isSelected ? "border-[var(--accent)] bg-[var(--surface-selected)] shadow-[var(--shadow-sm)]" : "hover:border-[var(--border-strong)]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tracking-code text-sm font-black text-[var(--foreground)]">{ticket.trackingCode ?? ticket.ticketId}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {ticket.requester.fullName ?? "Requester"} - {ticket.requester.faculty ?? "Faculty not set"}
          </p>
        </div>
        <span className={`status-badge ${getStatusClass(ticket.status)}`}>{formatStatus(ticket.status)}</span>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Device</p>
          <p className="mt-1 font-semibold text-[var(--foreground)]">
            {ticket.device.brand} {ticket.device.deviceType}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Issue</p>
          <p className="mt-1 font-semibold text-[var(--foreground)]">{formatIssueCategory(ticket.issueCategory)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Severity</p>
          <p className="mt-1 font-semibold text-[var(--foreground)]">{formatSeverity(ticket.severity)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Method</p>
          <p className="mt-1 font-semibold text-[var(--foreground)]">{formatRepairMethod(ticket.repairMethod)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3 text-sm">
        <span className="text-[var(--muted)]">Assigned: {ticket.technician?.fullName ?? "Unassigned"}</span>
        <span className="tnum font-medium text-[var(--muted-strong)]">{formatDate(ticket.createdAt)}</span>
      </div>
    </button>
  );
}

export function LeadCommandCenter() {
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<LeadTicketDetailData | null>(null);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedQueueTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [selectedTicketId, tickets],
  );
  const queueStats = useMemo(
    () => ({
      total: tickets.length,
      unassigned: tickets.filter((ticket) => !ticket.technician).length,
      triage: tickets.filter((ticket) => ticket.status === "REGISTRATION_COMPLETED").length,
    }),
    [tickets],
  );

  function loadQueue(nextSelectedTicketId?: string | null) {
    setQueueError(null);

    startTransition(async () => {
      const response = await fetch("/api/lead/tickets", { method: "GET" });
      const body = (await response.json().catch(() => null)) as QueueResponse | null;

      if (!response.ok || !body?.tickets) {
        setQueueError(body?.error ?? "Unable to load the lead triage queue.");
        return;
      }

      setTickets(body.tickets);
      setSelectedTicketId((current) => nextSelectedTicketId ?? current ?? body.tickets?.[0]?.id ?? null);
    });
  }

  function loadTicket(ticketId: string) {
    setDetailError(null);
    setSelectedTicketId(ticketId);

    startTransition(async () => {
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
    <div className="grid gap-6">
      <section className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Lead command center</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Triage, route, and verify repair work</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-strong)]">
              Review submitted requests, classify the repair path, assign technicians, and keep custody checks attached
              to the same operational record.
            </p>
          </div>
          <button type="button" onClick={() => loadQueue(selectedTicketId)} className="btn-secondary">
            Refresh
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <QueueStat label="Queue" value={queueStats.total} />
          <QueueStat label="Unassigned" value={queueStats.unassigned} />
          <QueueStat label="New triage" value={queueStats.triage} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.86fr_1.34fr]">
        <section className="grid content-start gap-4">
          <div className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Queue</p>
                <h2 className="mt-2 text-xl font-bold text-[var(--foreground)]">Needs triage or assignment</h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">
              Select a ticket to open triage, assignment, custody, and audit details.
            </p>
          </div>

          {queueError ? (
            <div className="panel border-[var(--fill-danger-soft-border)] bg-[var(--danger-bg)] p-4 text-sm font-medium text-[var(--danger)]">
              {queueError}
            </div>
          ) : null}

          <div className="grid gap-3">
            {tickets.length > 0 ? (
              tickets.map((ticket) => (
                <QueueCard
                  key={ticket.id}
                  ticket={ticket}
                  isSelected={ticket.id === selectedTicketId}
                  onSelect={() => setSelectedTicketId(ticket.id)}
                />
              ))
            ) : (
              <div className="panel p-5">
                <p className="text-sm text-[var(--muted)]">
                  {isPending ? "Loading queue..." : "No tickets currently need triage or assignment."}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="min-w-0">
          {detailError ? (
            <div className="panel border-[var(--fill-danger-soft-border)] bg-[var(--danger-bg)] p-5 text-sm font-medium text-[var(--danger)]">
              {detailError}
            </div>
          ) : null}

          {selectedTicket ? (
            <LeadTicketDetail ticket={selectedTicket} onTicketUpdated={handleTicketUpdated} />
          ) : (
            <div className="panel p-8">
              <p className="eyebrow">Ticket detail</p>
              <h2 className="mt-3 text-2xl font-bold text-[var(--foreground)]">
                {selectedQueueTicket ? "Loading ticket detail" : "Select a ticket"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Choose a queue item to review requester contact, device information, events, triage controls, and assignment.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
