"use client";

import { useState, useTransition } from "react";
import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";
import {
  CUSTODY_STATUS_LABELS,
  ISSUE_CATEGORY_LABELS,
  ISSUE_CATEGORY_OPTIONS,
  REPAIR_METHOD_LABELS,
  SEVERITY_LABELS,
} from "@/lib/service-desk/constants";
import { TechnicianRepairNoteForm } from "@/components/service-desk/technician-repair-note-form";
import { TechnicianStatusForm } from "@/components/service-desk/technician-status-form";
import { TechnicianStudentActionForm } from "@/components/service-desk/technician-student-action-form";

export type TechnicianTicketDetailData = {
  id: string;
  ticketId: string;
  trackingCode: string | null;
  status: string;
  severity: string | null;
  repairMethod: string | null;
  issueCategory: string | null;
  createdAt: string;
  assignedAt: string | null;
  issueDescription: string;
  studentActionRequired: string | null;
  partRequirement: string | null;
  requester: {
    fullName: string | null;
    requesterType: string | null;
    universityId: string | null;
    faculty: string | null;
    department: string | null;
    phone: string | null;
    email: string | null;
  };
  device: {
    id: string;
    deviceType: string;
    brand: string;
    model: string;
    serialNumber: string | null;
    assetTag: string | null;
    description: string | null;
  };
  custody: {
    id: string;
    status: string;
    receivedAt: string | null;
    condition: string | null;
    accessories: unknown;
    storageLocation: string | null;
    readyForCollectionAt: string | null;
    collectedAt: string | null;
  } | null;
  events: Array<{
    id: string;
    eventType: string;
    actorRole: string | null;
    statusFrom: string | null;
    statusTo: string | null;
    note: string | null;
    metadata: unknown;
    createdAt: string;
    actor: {
      id: string;
      fullName: string;
      email: string;
      role: string;
    } | null;
  }>;
};

type TechnicianTicketDetailProps = {
  onTicketUpdated: (ticket: TechnicianTicketDetailData) => void;
  ticket: TechnicianTicketDetailData;
};

type QualityCheckResponse = {
  error?: string;
  ticket?: TechnicianTicketDetailData;
};

const eventTypeLabels: Record<string, string> = {
  TICKET_CREATED: "Ticket created",
  TRIAGE_UPDATED: "Triage updated",
  STATUS_CHANGED: "Status changed",
  CUSTODY_CHANGED: "Custody changed",
  TECHNICIAN_ASSIGNED: "Technician assigned",
  REPAIR_NOTE_ADDED: "Repair note added",
  STUDENT_ACTION_REQUESTED: "Student action requested",
  PART_REQUIREMENT_ADDED: "Part requirement added",
  READY_FOR_PICKUP: "Ready for pickup",
  PICKUP_CONFIRMED: "Pickup confirmed",
  TICKET_CLOSED: "Ticket closed",
  TICKET_CANCELLED: "Ticket cancelled",
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

export function formatStatus(value: string | null) {
  if (!value) {
    return "Not set";
  }

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

function formatCustody(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return CUSTODY_STATUS_LABELS[value as keyof typeof CUSTODY_STATUS_LABELS] ?? value.replaceAll("_", " ");
}

export function formatIssueCategory(value: string | null) {
  if (!value) {
    return "Unclassified";
  }

  if (!ISSUE_CATEGORY_OPTIONS.includes(value as (typeof ISSUE_CATEGORY_OPTIONS)[number])) {
    return value.replaceAll("_", " ");
  }

  return ISSUE_CATEGORY_LABELS[value as (typeof ISSUE_CATEGORY_OPTIONS)[number]];
}

export function getStatusClass(status: string) {
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

function formatAccessories(value: unknown) {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value.length > 0 ? value.join(", ") : "None recorded";
  }

  return "Not recorded";
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
      <div className="mt-2 break-words text-sm font-semibold text-[var(--foreground)]">{value}</div>
    </div>
  );
}

function EventTimeline({ events }: { events: TechnicianTicketDetailData["events"] }) {
  if (events.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No repair events recorded yet.</p>;
  }

  return (
    <ol className="grid gap-3">
      {events.map((event) => (
        <li key={event.id} className="rounded-lg border border-[var(--border)] bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--foreground)]">
                {eventTypeLabels[event.eventType] ?? event.eventType.replaceAll("_", " ")}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">{formatDate(event.createdAt)}</p>
            </div>
            {event.actor ? (
              <span className="status-badge status-received">
                {event.actor.fullName} - {event.actor.role}
              </span>
            ) : null}
          </div>
          <div className="mt-3 grid gap-2 text-sm text-[var(--muted-strong)] sm:grid-cols-2">
            {event.statusTo ? <p>Status: {formatStatus(event.statusTo)}</p> : null}
            {event.statusFrom && event.statusTo && event.statusFrom !== event.statusTo ? (
              <p>Previous: {formatStatus(event.statusFrom)}</p>
            ) : null}
          </div>
          {event.note ? <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--muted-strong)]">{event.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}

function CustodySummary({ custody }: { custody: TechnicianTicketDetailData["custody"] }) {
  if (!custody) {
    return (
      <section className="panel p-5">
        <p className="eyebrow">Custody</p>
        <p className="mt-3 text-sm text-[var(--muted)]">No custody record exists yet.</p>
      </section>
    );
  }

  return (
    <section className="panel p-5">
      <p className="eyebrow">Custody</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <DetailItem label="Status" value={formatCustody(custody.status)} />
        <DetailItem label="Storage location" value={custody.storageLocation ?? "Not set"} />
        <DetailItem label="Received at" value={formatDate(custody.receivedAt)} />
        <DetailItem label="Condition" value={custody.condition ?? "Not set"} />
        <DetailItem label="Accessories" value={formatAccessories(custody.accessories)} />
        <DetailItem label="Ready for collection" value={formatDate(custody.readyForCollectionAt)} />
      </div>
    </section>
  );
}

function QualityCheckButton({
  onTicketUpdated,
  ticket,
}: {
  onTicketUpdated: (ticket: TechnicianTicketDetailData) => void;
  ticket: TechnicianTicketDetailData;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setMessage(null);
    setIsError(false);

    const confirmed = window.confirm("Submit this repair work for lead technician quality verification?");

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(
        `/api/technician/workspace/tickets/${encodeURIComponent(ticket.id)}/submit-quality-check`,
        {
          method: "PATCH",
        },
      );
      const body = (await response.json().catch(() => null)) as QualityCheckResponse | null;

      if (!response.ok || !body?.ticket) {
        setIsError(true);
        setMessage(body?.error ?? "Unable to submit for quality check.");
        return;
      }

      setMessage("Submitted for quality check.");
      onTicketUpdated(body.ticket);
    });
  }

  return (
    <section className="panel p-5">
      <p className="eyebrow">Verification</p>
      <h3 className="mt-2 text-xl font-bold text-[var(--foreground)]">Submit completed work</h3>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
        Move repair work to quality inspection when diagnosis and repair tasks are complete.
      </p>

      {message ? (
        <p className={`mt-4 text-sm font-medium ${isError ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
          {message}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || ticket.status === "QUALITY_INSPECTION"}
        className="btn-primary mt-5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Submitting..." : "Submit for quality check"}
      </button>
    </section>
  );
}

export function TechnicianTicketDetail({ onTicketUpdated, ticket }: TechnicianTicketDetailProps) {
  return (
    <div className="grid gap-6">
      <section className="panel overflow-hidden">
        <div className="border-b border-[var(--border)] bg-[var(--surface-alt)] px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Repair ticket</p>
              <h2 className="tracking-code mt-2 break-all text-2xl font-black text-[var(--foreground)]">
                {ticket.trackingCode ?? ticket.ticketId}
              </h2>
            </div>
            <span className={`status-badge ${getStatusClass(ticket.status)}`}>{formatStatus(ticket.status)}</span>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
          <DetailItem label="Requester" value={ticket.requester.fullName ?? "Not set"} />
          <DetailItem label="Phone" value={ticket.requester.phone ?? "Not set"} />
          <DetailItem label="Email" value={ticket.requester.email ?? "Not set"} />
          <DetailItem label="Faculty" value={ticket.requester.faculty ?? "Not set"} />
          <DetailItem label="Department" value={ticket.requester.department ?? "Not set"} />
          <DetailItem label="University ID" value={ticket.requester.universityId ?? "Not set"} />
          <DetailItem label="Device" value={`${ticket.device.brand} ${ticket.device.model}`} />
          <DetailItem label="Device type" value={ticket.device.deviceType} />
          <DetailItem label="Serial number" value={ticket.device.serialNumber ?? "Not set"} />
          <DetailItem label="Asset tag" value={ticket.device.assetTag ?? "Not set"} />
          <DetailItem label="Issue category" value={formatIssueCategory(ticket.issueCategory)} />
          <DetailItem label="Severity" value={formatSeverity(ticket.severity)} />
          <DetailItem label="Repair method" value={formatRepairMethod(ticket.repairMethod)} />
          <DetailItem label="Assigned" value={formatDate(ticket.assignedAt)} />
          <DetailItem label="Created" value={formatDate(ticket.createdAt)} />
        </div>

        <div className="border-t border-[var(--border)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Issue description</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--muted-strong)]">{ticket.issueDescription}</p>
          {ticket.device.description ? (
            <>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Device notes</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">{ticket.device.description}</p>
            </>
          ) : null}
          {ticket.studentActionRequired ? (
            <div className="mt-5 rounded-lg border border-[var(--warning)] bg-[var(--warning-bg)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--warning)]">Waiting on requester</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">{ticket.studentActionRequired}</p>
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <TechnicianRepairNoteForm key={`${ticket.id}-notes`} ticket={ticket} onTicketUpdated={onTicketUpdated} />
        <TechnicianStatusForm key={`${ticket.id}-status`} ticket={ticket} onTicketUpdated={onTicketUpdated} />
        <TechnicianStudentActionForm key={`${ticket.id}-student-action`} ticket={ticket} onTicketUpdated={onTicketUpdated} />
        <QualityCheckButton ticket={ticket} onTicketUpdated={onTicketUpdated} />
      </div>

      <CustodySummary custody={ticket.custody} />

      <section className="panel p-5">
        <p className="eyebrow">Repair events</p>
        <h3 className="mt-2 text-xl font-bold text-[var(--foreground)]">Work timeline</h3>
        <div className="mt-4">
          <EventTimeline events={ticket.events} />
        </div>
      </section>
    </div>
  );
}
