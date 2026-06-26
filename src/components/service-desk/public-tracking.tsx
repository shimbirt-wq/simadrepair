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

const trackingCodePattern = /^SIM-\d{4}-\d+$/;

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

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#ffffff",
        border: "1px solid var(--border)",
        borderRadius: "10px",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          color: "var(--slate-400)",
          marginBottom: "6px",
        }}
      >
        {label}
      </p>
      <div
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "#0f172a",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function InlineMessage({
  title,
  body,
  tone = "neutral",
}: {
  title: string;
  body: string;
  tone?: "neutral" | "danger";
}) {
  const isDanger = tone === "danger";

  return (
    <div
      style={{
        padding: "16px 20px",
        borderRadius: "10px",
        border: `1px solid ${isDanger ? "#fecaca" : "#e2e2dc"}`,
        backgroundColor: isDanger ? "#fef2f2" : "#ffffff",
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          marginTop: "5px",
          flexShrink: 0,
          backgroundColor: isDanger ? "#dc2626" : "#94a3b8",
        }}
      />
      <div>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: isDanger ? "#991b1b" : "#0f172a",
            marginBottom: "4px",
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: "13px",
            color: isDanger ? "#b91c1c" : "var(--slate-500)",
            lineHeight: 1.6,
          }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}

function PublicTimeline({ events }: { events: PublicTimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <p
        style={{
          padding: "16px",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          fontSize: "13px",
          color: "var(--slate-400)",
          backgroundColor: "#ffffff",
        }}
      >
        No public timeline updates are available yet.
      </p>
    );
  }

  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0" }}>
      {events.map((event, index) => {
        const statusTo = formatStatus(event.statusTo);
        const custodyTo = formatCustodyStatus(event.custodyTo);
        const isLast = index === events.length - 1;

        const dateStr = formatDate(event.occurredAt);
        const dateObj = event.occurredAt ? new Date(event.occurredAt) : null;
        const timeStr = dateObj
          ? dateObj.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })
          : null;
        const dayStr = dateObj
          ? dateObj.toLocaleDateString("en", { month: "short", day: "numeric" })
          : null;

        return (
          <li
            key={`${event.eventType}-${event.occurredAt}`}
            style={{
              display: "flex",
              gap: "16px",
              position: "relative",
            }}
          >
            {/* Timeline line + dot */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flexShrink: 0,
                width: "20px",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: "#2563eb",
                  border: "2px solid #ffffff",
                  boxShadow: "0 0 0 2px #bfdbfe",
                  flexShrink: 0,
                  marginTop: "16px",
                  zIndex: 1,
                  position: "relative",
                }}
              />
              {!isLast && (
                <div
                  style={{
                    width: "1px",
                    flex: 1,
                    backgroundColor: "#e2e2dc",
                    minHeight: "24px",
                  }}
                />
              )}
            </div>

            {/* Event content */}
            <div
              style={{
                flex: 1,
                paddingBottom: isLast ? "0" : "24px",
                paddingTop: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "8px",
                  marginBottom: "4px",
                }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  {eventTypeLabels[event.eventType] ?? event.eventType.replaceAll("_", " ")}
                </p>
                {statusTo ? <span className={`status-badge ${getStatusClass(event.statusTo ?? "")}`}>{statusTo}</span> : null}
              </div>
              {dateStr && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--slate-400)",
                    fontWeight: 500,
                  }}
                >
                  {dayStr} &middot; {timeStr}
                </p>
              )}
              {custodyTo ? (
                <p
                  style={{
                    marginTop: "6px",
                    fontSize: "13px",
                    color: "var(--slate-500)",
                  }}
                >
                  Device custody: {custodyTo}
                </p>
              ) : null}
            </div>
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
    <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Status hero */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {/* Header bar */}
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid #e2e2dc",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "var(--slate-400)",
                marginBottom: "6px",
              }}
            >
              Tracking code
            </p>
            <h2
              className="tracking-code"
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#0f172a",
                wordBreak: "break-all",
              }}
            >
              {trackingInfo.trackingCode}
            </h2>
          </div>
          <span className={`status-badge ${getStatusClass(trackingInfo.status)}`} style={{ fontSize: "13px" }}>
            {formatStatus(trackingInfo.status)}
          </span>
        </div>

        {/* Info grid */}
        <div
          style={{
            padding: "20px",
            display: "grid",
            gap: "12px",
          }}
          className="sm:grid-cols-3"
        >
          <InfoCard label="Requester" value={trackingInfo.requesterName} />
          <InfoCard label="Device" value={`${trackingInfo.device.brand} ${trackingInfo.device.deviceType}`} />
          <InfoCard label="Issue category" value={formatIssueCategory(trackingInfo.issueCategory)} />
        </div>

        {/* Secondary info */}
        <div
          style={{
            padding: "0 20px 20px",
            display: "grid",
            gap: "12px",
          }}
          className="sm:grid-cols-3"
        >
          <InfoCard label="Submitted" value={submittedAt ?? "Not available"} />
          <InfoCard label="Assigned" value={assignedAt ?? "Not assigned yet"} />
          <InfoCard label="Ready for pickup" value={readyForPickupAt ?? "Not ready yet"} />
          {trackingInfo.severity ? <InfoCard label="Severity" value={formatSeverity(trackingInfo.severity)} /> : null}
          {trackingInfo.repairMethod ? (
            <InfoCard label="Repair method" value={formatRepairMethod(trackingInfo.repairMethod)} />
          ) : null}
        </div>
      </div>

      {/* Timeline */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "24px",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <p className="eyebrow">PUBLIC TIMELINE</p>
          <h2
            style={{
              marginTop: "6px",
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#0f172a",
            }}
          >
            Repair progress
          </h2>
        </div>
        <PublicTimeline events={trackingInfo.timeline} />
      </div>
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
      setMessage("Use a tracking code in this format: SIM-2026-1000001.");
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Search form */}
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
        }}
      >
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            fontSize: "14px",
            fontWeight: 600,
            color: "#0f172a",
          }}
        >
          Tracking code
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <input
              name="trackingCode"
              value={trackingCode}
              onChange={(event) => setTrackingCode(event.target.value.toUpperCase())}
              className="field-control"
              style={{ flex: "1 1 200px", minWidth: 0 }}
              placeholder="SIM-2026-1000001"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={isPending || state === "loading"}
              className="btn-primary"
              style={{ whiteSpace: "nowrap", fontSize: "14px" }}
            >
              {isPending || state === "loading" ? "Checking..." : "Check status"}
            </button>
          </div>
        </label>
        <p
          style={{
            marginTop: "10px",
            fontSize: "13px",
            color: "var(--slate-400)",
            lineHeight: 1.6,
          }}
        >
          Enter the tracking code you received after submitting your SIMAD computer maintenance request.
        </p>
      </form>

      {/* State messages */}
      {state === "idle" ? (
        <InlineMessage title="Enter your tracking code" body="Your repair progress will appear here after lookup." />
      ) : null}
      {state === "loading" ? (
        <InlineMessage title="Checking repair status" body="Loading the latest public repair progress for this code." />
      ) : null}
      {state === "invalid" ? (
        <InlineMessage title="Invalid tracking code" body={message ?? "Check the code format and try again."} tone="danger" />
      ) : null}
      {state === "not-found" ? (
        <InlineMessage title="Tracking code not found" body={message ?? "No repair request was found for that code."} />
      ) : null}
      {state === "error" ? (
        <InlineMessage title="Unable to load tracking" body={message ?? "Try again in a moment."} tone="danger" />
      ) : null}
      {state === "success" && trackingInfo ? <TrackingResult trackingInfo={trackingInfo} /> : null}

      {/* Footer links */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "12px",
          paddingTop: "4px",
        }}
      >
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
