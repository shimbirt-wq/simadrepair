"use client";

import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";
import {
  ISSUE_CATEGORY_LABELS,
  ISSUE_CATEGORY_OPTIONS,
  REPAIR_METHOD_LABELS,
  SEVERITY_LABELS,
} from "@/lib/service-desk/constants";
import { DeviceCustodyPanel } from "@/components/service-desk/device-custody-panel";
import { LeadAssignmentForm } from "@/components/service-desk/lead-assignment-form";
import { LeadTriageForm } from "@/components/service-desk/lead-triage-form";

export type LeadTicketDetailData = {
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
  technician: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
  issueDescription: string;
  photoUrl: string | null;
  triageNotes: string | null;
  studentActionRequired: string | null;
  partRequirement: string | null;
  triagedAt: string | null;
  assignedAt: string | null;
  readyForPickupAt: string | null;
  triagedBy: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
  custody: {
    id: string;
    status: string;
    receivedAt: string | null;
    condition: string | null;
    screenCondition: string | null;
    keyboardCondition: string | null;
    batteryCondition: string | null;
    bodyCondition: string | null;
    accessories: unknown;
    storageLocation: string | null;
    releasedById: string | null;
    readyForCollectionAt: string | null;
    collectedByName: string | null;
    collectedByPhone: string | null;
    collectedAt: string | null;
    pickupCodeVerifiedAt: string | null;
    receivedBy: {
      id: string;
      fullName: string;
      email: string;
      role: string;
    } | null;
    releasedBy: {
      id: string;
      fullName: string;
      email: string;
      role: string;
    } | null;
  } | null;
  events: Array<{
    id: string;
    eventType: string;
    actorRole: string | null;
    statusFrom: string | null;
    statusTo: string | null;
    custodyFrom: string | null;
    custodyTo: string | null;
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

function formatStatus(value: string | null) {
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

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
      <div className="mt-2 break-words text-sm font-semibold text-[var(--foreground)]">{value}</div>
    </div>
  );
}

function EventTimeline({ events }: { events: LeadTicketDetailData["events"] }) {
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
            {event.custodyTo ? <p>Custody: {event.custodyTo.replaceAll("_", " ")}</p> : null}
          </div>
          {event.note ? <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">{event.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}

export function LeadTicketDetail({
  onTicketUpdated,
  ticket,
}: {
  onTicketUpdated: (ticket: LeadTicketDetailData) => void;
  ticket: LeadTicketDetailData;
}) {
  async function refreshTicketDetail() {
    const response = await fetch(`/api/lead/tickets/${encodeURIComponent(ticket.id)}`, { method: "GET" });
    const body = (await response.json().catch(() => null)) as { ticket?: LeadTicketDetailData } | null;

    if (response.ok && body?.ticket) {
      onTicketUpdated(body.ticket);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="panel overflow-hidden">
        <div className="border-b border-[var(--border)] bg-[var(--surface-alt)] px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Ticket detail</p>
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
          <DetailItem label="Issue category" value={formatIssueCategory(ticket.issueCategory)} />
          <DetailItem label="Severity" value={formatSeverity(ticket.severity)} />
          <DetailItem label="Repair method" value={formatRepairMethod(ticket.repairMethod)} />
          <DetailItem label="Assigned technician" value={ticket.technician?.fullName ?? "Unassigned"} />
          <DetailItem label="Triaged by" value={ticket.triagedBy?.fullName ?? "Not triaged"} />
          <DetailItem label="Created" value={formatDate(ticket.createdAt)} />
        </div>

        <div className="border-t border-[var(--border)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Issue description</p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">{ticket.issueDescription}</p>
          {ticket.triageNotes ? (
            <>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Triage notes</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">{ticket.triageNotes}</p>
            </>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <LeadTriageForm ticket={ticket} onTicketUpdated={onTicketUpdated} />
        <LeadAssignmentForm ticket={ticket} onTicketUpdated={onTicketUpdated} />
      </div>

      <DeviceCustodyPanel ticketId={ticket.id} onCustodyChanged={refreshTicketDetail} />

      <section className="panel p-5">
        <p className="eyebrow">Audit events</p>
        <h3 className="mt-2 text-xl font-bold text-[var(--foreground)]">Repair timeline</h3>
        <div className="mt-4">
          <EventTimeline events={ticket.events} />
        </div>
      </section>
    </div>
  );
}
