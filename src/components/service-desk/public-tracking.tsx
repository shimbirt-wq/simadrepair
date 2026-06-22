"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";
import {
  CUSTODY_STATUS_LABELS,
  ISSUE_CATEGORY_LABELS,
  ISSUE_CATEGORY_OPTIONS,
  REPAIR_METHOD_LABELS,
  SEVERITY_LABELS,
} from "@/lib/service-desk/constants";

type TrackingState = "idle" | "loading" | "success" | "invalid" | "not-found" | "error";

type PublicTimelineEvent = {
  eventType: string;
  occurredAt: string;
  statusFrom: string | null;
  statusTo: string | null;
  custodyFrom: string | null;
  custodyTo: string | null;
};

type PublicTrackingInfo = {
  trackingCode: string;
  status: string;
  severity: string | null;
  repairMethod: string | null;
  submittedAt: string;
  assignedAt: string | null;
  readyForPickupAt: string | null;
  requesterName: string;
  device: {
    deviceType: string;
    brand: string;
  };
  issueCategory: string | null;
  timeline: PublicTimelineEvent[];
};

type PublicTrackingApiError = {
  error?: string;
};

const trackingCodePattern = /^SIM-\d{4}-\d{6}$/;

const eventTypeLabels: Record<string, string> = {
  TICKET_CREATED: "Request submitted",
  TRIAGE_UPDATED: "Triage updated",
  STATUS_CHANGED: "Status updated",
  CUSTODY_CHANGED: "Device custody updated",
  TECHNICIAN_ASSIGNED: "Technician assigned",
  STUDENT_ACTION_REQUESTED: "Action requested",
  PART_REQUIREMENT_ADDED: "Part requirement added",
  READY_FOR_PICKUP: "Ready for pickup",
  PICKUP_CONFIRMED: "Pickup confirmed",
  TICKET_CLOSED: "Ticket closed",
  TICKET_CANCELLED: "Ticket cancelled",
};

function normalizeTrackingCode(value: string) {
  return value.trim().toUpperCase();
}

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatus(value: string | null) {
  if (!value) {
    return null;
  }

  return REPAIR_STATUS_LABELS[value as keyof typeof REPAIR_STATUS_LABELS] ?? value.replaceAll("_", " ");
}

function formatSeverity(value: string | null) {
  if (!value) {
    return null;
  }

  return SEVERITY_LABELS[value as keyof typeof SEVERITY_LABELS] ?? value.replaceAll("_", " ");
}

function formatRepairMethod(value: string | null) {
  if (!value) {
    return null;
  }

  return REPAIR_METHOD_LABELS[value as keyof typeof REPAIR_METHOD_LABELS] ?? value.replaceAll("_", " ");
}

function formatCustodyStatus(value: string | null) {
  if (!value) {
    return null;
  }

  return CUSTODY_STATUS_LABELS[value as keyof typeof CUSTODY_STATUS_LABELS] ?? value.replaceAll("_", " ");
}

function formatIssueCategory(value: string | null) {
  if (!value || !ISSUE_CATEGORY_OPTIONS.includes(value as (typeof ISSUE_CATEGORY_OPTIONS)[number])) {
    return value ? value.replaceAll("_", " ") : "Not classified";
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
      <div className="mt-2 text-sm font-bold text-[var(--foreground)]">{value}</div>
    </div>
  );
}

function StateMessage({
  body,
  title,
  tone = "neutral",
}: {
  body: string;
  title: string;
  tone?: "neutral" | "danger";
}) {
  return (
    <div
      className={`panel p-5 ${
        tone === "danger" ? "border-[var(--fill-danger-soft-border)] bg-[var(--danger-bg)]" : "bg-white"
      }`}
    >
      <h2 className="text-lg font-bold text-[var(--foreground)]">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">{body}</p>
    </div>
  );
}

function PublicTimeline({ events }: { events: PublicTimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-[var(--border)] bg-white p-4 text-sm text-[var(--muted)]">
        No public timeline updates are available yet.
      </p>
    );
  }

  return (
    <ol className="grid gap-3">
      {events.map((event) => {
        const statusTo = formatStatus(event.statusTo);
        const custodyTo = formatCustodyStatus(event.custodyTo);

        return (
          <li key={`${event.eventType}-${event.occurredAt}`} className="rounded-lg border border-[var(--border)] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">
                  {eventTypeLabels[event.eventType] ?? event.eventType.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">{formatDate(event.occurredAt)}</p>
              </div>
              {statusTo ? <span className="status-badge status-registration">{statusTo}</span> : null}
            </div>
            {custodyTo ? (
              <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">Device custody: {custodyTo}</p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function TrackingResult({ trackingInfo }: { trackingInfo: PublicTrackingInfo }) {
  const submittedAt = formatDate(trackingInfo.submittedAt);
  const assignedAt = formatDate(trackingInfo.assignedAt);
  const readyForPickupAt = formatDate(trackingInfo.readyForPickupAt);

  return (
    <section className="grid gap-6">
      <div className="panel overflow-hidden">
        <div className="border-b border-[var(--border)] bg-[var(--surface-alt)] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Tracking code</p>
              <h2 className="tracking-code mt-1 break-all text-2xl font-black text-[var(--foreground)]">
                {trackingInfo.trackingCode}
              </h2>
            </div>
            <span className={`status-badge ${getStatusClass(trackingInfo.status)}`}>
              {formatStatus(trackingInfo.status)}
            </span>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Requester" value={trackingInfo.requesterName} />
          <DetailItem label="Device" value={`${trackingInfo.device.brand} ${trackingInfo.device.deviceType}`} />
          <DetailItem label="Issue category" value={formatIssueCategory(trackingInfo.issueCategory)} />
          <DetailItem label="Submitted" value={submittedAt ?? "Not available"} />
          <DetailItem label="Assigned" value={assignedAt ?? "Not assigned yet"} />
          <DetailItem label="Ready for pickup" value={readyForPickupAt ?? "Not ready yet"} />
          {trackingInfo.severity ? <DetailItem label="Severity" value={formatSeverity(trackingInfo.severity)} /> : null}
          {trackingInfo.repairMethod ? (
            <DetailItem label="Repair method" value={formatRepairMethod(trackingInfo.repairMethod)} />
          ) : null}
        </div>
      </div>

      <section className="panel p-5">
        <div className="mb-4">
          <p className="eyebrow">Public timeline</p>
          <h2 className="mt-2 text-xl font-bold text-[var(--foreground)]">Repair progress</h2>
        </div>
        <PublicTimeline events={trackingInfo.timeline} />
      </section>
    </section>
  );
}

export function PublicTracking({ initialCode = "" }: { initialCode?: string }) {
  const normalizedInitialCode = useMemo(() => normalizeTrackingCode(initialCode), [initialCode]);
  const [trackingCode, setTrackingCode] = useState(normalizedInitialCode);
  const [trackingInfo, setTrackingInfo] = useState<PublicTrackingInfo | null>(null);
  const [state, setState] = useState<TrackingState>(normalizedInitialCode ? "loading" : "idle");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function fetchTrackingInfo(code: string) {
    const normalizedCode = normalizeTrackingCode(code);
    setTrackingCode(normalizedCode);
    setTrackingInfo(null);
    setMessage(null);

    if (!trackingCodePattern.test(normalizedCode)) {
      setState("invalid");
      setMessage("Use a tracking code in this format: SIM-2026-000001.");
      return;
    }

    setState("loading");

    startTransition(async () => {
      const response = await fetch(`/api/public/tracking/${encodeURIComponent(normalizedCode)}`, {
        method: "GET",
      });
      const body = (await response.json().catch(() => null)) as (PublicTrackingInfo & PublicTrackingApiError) | null;

      if (response.status === 400) {
        setState("invalid");
        setMessage(body?.error ?? "Invalid tracking code format.");
        return;
      }

      if (response.status === 404) {
        setState("not-found");
        setMessage(body?.error ?? "Tracking code not found.");
        return;
      }

      if (!response.ok || !body?.trackingCode) {
        setState("error");
        setMessage(body?.error ?? "Unable to load tracking information right now.");
        return;
      }

      setTrackingInfo(body);
      setState("success");
      setMessage(null);
    });
  }

  useEffect(() => {
    if (normalizedInitialCode) {
      fetchTrackingInfo(normalizedInitialCode);
    }
  }, [normalizedInitialCode]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    fetchTrackingInfo(String(formData.get("trackingCode") ?? ""));
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit} className="panel p-5">
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Tracking code
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              name="trackingCode"
              value={trackingCode}
              onChange={(event) => setTrackingCode(event.target.value.toUpperCase())}
              className="field-control min-w-0 flex-1"
              placeholder="SIM-2026-000001"
              autoComplete="off"
            />
            <button type="submit" disabled={isPending || state === "loading"} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
              {isPending || state === "loading" ? "Checking..." : "Check status"}
            </button>
          </div>
        </label>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          Enter the tracking code you received after submitting your SIMAD computer maintenance request.
        </p>
      </form>

      {state === "idle" ? (
        <StateMessage title="Enter your tracking code" body="Your repair progress will appear here after lookup." />
      ) : null}
      {state === "loading" ? (
        <StateMessage title="Checking repair status" body="Loading the latest public repair progress for this code." />
      ) : null}
      {state === "invalid" ? (
        <StateMessage title="Invalid tracking code" body={message ?? "Check the code format and try again."} tone="danger" />
      ) : null}
      {state === "not-found" ? (
        <StateMessage title="Tracking code not found" body={message ?? "No repair request was found for that code."} />
      ) : null}
      {state === "error" ? (
        <StateMessage title="Unable to load tracking" body={message ?? "Try again in a moment."} tone="danger" />
      ) : null}
      {state === "success" && trackingInfo ? <TrackingResult trackingInfo={trackingInfo} /> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/request-repair" className="btn-secondary">
          Submit a repair request
        </Link>
        <Link href="/" className="btn-ghost">
          Back to home
        </Link>
      </div>
    </div>
  );
}
