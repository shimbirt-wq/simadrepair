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
        <div className="min-w-0">
          <p className="tracking-code break-all text-sm font-black text-[var(--foreground)]">{ticket.trackingCode ?? ticket.ticketId}</p>
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
            {ticket.device.deviceType} - {ticket.device.brand}
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

      <div className="mt-4 grid gap-2 border-t border-[var(--border)] pt-3 text-sm text-[var(--muted)] sm:grid-cols-2">
        <span className="tnum">Assigned: {formatDate(ticket.assignedAt)}</span>
        <span className="tnum">Created: {formatDate(ticket.createdAt)}</span>
      </div>
    </button>
  );
}

export function TechnicianWorkspace() {
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TechnicianTicketDetailData | null>(null);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isQueuePending, startQueueTransition] = useTransition();
  const [isDetailPending, startDetailTransition] = useTransition();

  const selectedQueueTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [selectedTicketId, tickets],
  );
  const queueStats = useMemo(
    () => ({
      total: tickets.length,
      diagnosing: tickets.filter((ticket) => ticket.status === "DIAGNOSIS_IN_PROGRESS").length,
      repairing: tickets.filter((ticket) => ticket.status === "REPAIR_IN_PROGRESS").length,
    }),
    [tickets],
  );

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
      setSelectedTicketId((current) => nextSelectedTicketId ?? current ?? body.tickets?.[0]?.id ?? null);
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
            <p className="eyebrow">Technician workspace</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Assigned repair queue</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-strong)]">
              Work from assigned tickets only. Open a repair to record diagnosis notes, move the repair status, request
              requester action, or submit completed work for verification.
            </p>
          </div>
          <button type="button" onClick={() => loadQueue(selectedTicketId)} className="btn-secondary">
            Refresh
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <QueueStat label="Assigned" value={queueStats.total} />
          <QueueStat label="Diagnosing" value={queueStats.diagnosing} />
          <QueueStat label="Repairing" value={queueStats.repairing} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.38fr]">
        <section className="grid content-start gap-4">
          <div className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Assigned queue</p>
                <h2 className="mt-2 text-xl font-bold text-[var(--foreground)]">Repair work</h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">
              Select a ticket to open device, requester, repair action, custody, and event details.
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
                  {isQueuePending ? "Loading assigned repairs..." : "No assigned repair tickets are currently in your queue."}
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
            <TechnicianTicketDetail ticket={selectedTicket} onTicketUpdated={handleTicketUpdated} />
          ) : (
            <div className="panel p-8">
              <p className="eyebrow">Ticket detail</p>
              <h2 className="mt-3 text-2xl font-bold text-[var(--foreground)]">
                {selectedQueueTicket || isDetailPending ? "Loading ticket detail" : "Select a repair"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
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
