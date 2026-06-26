"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { CustodyStatus, RepairEventType, RepairStatus } from "@prisma/client";
import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";
import { CUSTODY_STATUS_LABELS } from "@/lib/service-desk/constants";

type TrackingState = "idle" | "loading" | "success" | "invalid" | "not-found" | "error";

type PublicTimelineEvent = {
  eventType: RepairEventType;
  occurredAt: string;
  statusFrom: string | null;
  statusTo: string | null;
  custodyFrom: CustodyStatus | null;
  custodyTo: CustodyStatus | null;
};

type PublicTrackingInfo = {
  trackingCode: string;
  status: RepairStatus;
  submittedAt: string;
  assignedAt: string | null;
  readyForPickupAt: string | null;
  requesterName: string;
  device: {
    deviceType: string;
    brand: string;
    model: string;
  };
  technician: {
    fullName: string;
    phone: string | null;
  } | null;
  custody: {
    status: CustodyStatus;
    storageLocation: string | null;
    receivedAt: string | null;
    readyForCollectionAt: string | null;
    collectedAt: string | null;
  } | null;
  timeline: PublicTimelineEvent[];
};

type PublicTrackingApiError = {
  error?: string;
};

type DisplayStatus =
  | "SUBMITTED"
  | "NOT_RECEIVED"
  | "RECEIVED"
  | "ASSIGNED"
  | "IN_REPAIR"
  | "READY_FOR_PICKUP"
  | "COLLECTED";

const trackingCodePattern = /^SIM-\d{4}-\d+$/;

const eventTypeLabels: Record<RepairEventType, string> = {
  TICKET_CREATED: "Request submitted",
  STATUS_CHANGED: "Status updated",
  CUSTODY_CHANGED: "Device custody updated",
  TECHNICIAN_ASSIGNED: "Technician assigned",
  READY_FOR_PICKUP: "Ready for pickup",
  PICKUP_CONFIRMED: "Pickup confirmed",
  TICKET_CLOSED: "Ticket closed",
  TICKET_CANCELLED: "Ticket cancelled",
};

const repairStatusClassName: Record<RepairStatus, string> = {
  REGISTRATION_COMPLETED: "status-registration",
  DEVICE_RECEIVED: "status-received",
  REPAIR_IN_PROGRESS: "status-repair",
  READY_FOR_COLLECTION: "status-ready",
  DEVICE_COLLECTED: "status-collected",
};

function getDisplayStatus(info: PublicTrackingInfo): DisplayStatus {
  if (info.status === "DEVICE_COLLECTED") return "COLLECTED";
  if (info.status === "READY_FOR_COLLECTION") return "READY_FOR_PICKUP";
  if (info.status === "REPAIR_IN_PROGRESS") return "IN_REPAIR";
  if (info.status === "DEVICE_RECEIVED" && info.technician) return "ASSIGNED";
  if (info.status === "DEVICE_RECEIVED") return "RECEIVED";
  if (info.custody && info.custody.status === "NOT_RECEIVED") return "NOT_RECEIVED";
  return "SUBMITTED";
}

type StatusConfig = {
  label: string;
  message: (info: PublicTrackingInfo) => string;
  iconPath: string;
  bg: string;
  iconColor: string;
  badgeClass: string;
};

const statusConfigs: Record<DisplayStatus, StatusConfig> = {
  SUBMITTED: {
    label: "Submitted",
    message: () =>
      "Your repair request has been registered. Please bring your device to the IT service desk so it can be checked in.",
    iconPath:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414A1 1 0 0 1 19 9.414V19a2 2 0 0 1-2 2Z",
    bg: "bg-slate-50 border-slate-200",
    iconColor: "text-slate-500",
    badgeClass: "status-registration",
  },
  NOT_RECEIVED: {
    label: "Not received",
    message: () =>
      "Your device has not been checked in yet. Please bring it to the IT service desk so we can register its arrival.",
    iconPath:
      "M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z",
    bg: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-600",
    badgeClass: "status-registration",
  },
  RECEIVED: {
    label: "Received",
    message: () =>
      "Your device has been received by the IT service desk. It is waiting to be assigned to a technician.",
    iconPath:
      "M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z",
    bg: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
    badgeClass: "status-received",
  },
  ASSIGNED: {
    label: "Assigned",
    message: (info) =>
      `Your device has been assigned to ${info.technician?.fullName ?? "a technician"}. Repair work will begin soon.`,
    iconPath:
      "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z",
    bg: "bg-indigo-50 border-indigo-200",
    iconColor: "text-indigo-600",
    badgeClass: "status-received",
  },
  IN_REPAIR: {
    label: "In repair",
    message: (info) =>
      `${info.technician?.fullName ?? "A technician"} is currently working on your device. You will be notified when it is ready.`,
    iconPath:
      "M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z",
    bg: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-600",
    badgeClass: "status-repair",
  },
  READY_FOR_PICKUP: {
    label: "Ready for pickup",
    message: (info) => {
      const location = info.custody?.storageLocation ?? "the IT service desk";
      return `Your device is ready! Please come to ${location} to collect it. You can contact your technician on WhatsApp to arrange pickup.`;
    },
    iconPath:
      "M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z",
    bg: "bg-emerald-50 border-emerald-200",
    iconColor: "text-emerald-600",
    badgeClass: "status-ready",
  },
  COLLECTED: {
    label: "Collected",
    message: () =>
      "Your device has been collected. Thank you for using SIMADRepair IT Service Desk. We hope your device is working well!",
    iconPath:
      "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
    bg: "bg-slate-50 border-slate-200",
    iconColor: "text-slate-500",
    badgeClass: "status-collected",
  },
};

function normalizeTrackingCode(value: string) {
  return value.trim().toUpperCase();
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildWhatsAppUrl(info: PublicTrackingInfo) {
  const phone = info.technician?.phone?.replace(/[^\d]/g, "");
  if (!phone) return null;
  const message = `Hello, I am following up on my repair request ${info.trackingCode}.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function buildPickupWhatsAppUrl(info: PublicTrackingInfo) {
  const phone = info.technician?.phone?.replace(/[^\d]/g, "");
  if (!phone) return null;
  const location = info.custody?.storageLocation ?? "the IT service desk";
  const message = `Hello ${info.technician?.fullName ?? ""}, I am coming to pick up my device (${info.trackingCode}) from ${location}.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function StatusHero({ trackingInfo }: { trackingInfo: PublicTrackingInfo }) {
  const displayStatus = getDisplayStatus(trackingInfo);
  const config = statusConfigs[displayStatus];
  const message = config.message(trackingInfo);
  const pickupUrl = displayStatus === "READY_FOR_PICKUP" ? buildPickupWhatsAppUrl(trackingInfo) : null;
  const contactUrl = displayStatus === "ASSIGNED" || displayStatus === "IN_REPAIR" ? buildWhatsAppUrl(trackingInfo) : null;

  return (
    <div className={`rounded-xl border p-6 ${config.bg}`}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 rounded-lg p-2.5 ${config.iconColor} bg-white/70 shadow-sm`}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={config.iconPath} />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`status-badge ${config.badgeClass}`}>{config.label}</span>
            <span className="text-xs font-mono text-[var(--muted)] font-semibold">{trackingInfo.trackingCode}</span>
          </div>
          <p className="text-sm leading-relaxed text-[var(--muted-strong)]">{message}</p>

          {pickupUrl ? (
            <a
              href={pickupUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.564 4.14 1.546 5.872L0 24l6.293-1.519A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.806 9.806 0 0 1-4.983-1.361l-.357-.213-3.738.901.938-3.641-.234-.373A9.772 9.772 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
              </svg>
              Message technician for pickup
            </a>
          ) : null}

          {contactUrl ? (
            <a
              href={contactUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:bg-[var(--surface-alt)]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-600" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.564 4.14 1.546 5.872L0 24l6.293-1.519A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.806 9.806 0 0 1-4.983-1.361l-.357-.213-3.738.901.938-3.641-.234-.373A9.772 9.772 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
              </svg>
              Contact technician on WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DetailGrid({ trackingInfo }: { trackingInfo: PublicTrackingInfo }) {
  const submittedAt = formatDate(trackingInfo.submittedAt);
  const readyAt = formatDate(trackingInfo.readyForPickupAt);
  const location = trackingInfo.custody?.storageLocation ?? "IT service desk";

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-lg border border-[var(--border)] bg-white p-4">
        <p className="eyebrow">Device</p>
        <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{trackingInfo.device.brand} {trackingInfo.device.model}</p>
        <p className="mt-0.5 text-xs text-[var(--muted)] capitalize">{trackingInfo.device.deviceType.toLowerCase()}</p>
      </div>
      <div className="rounded-lg border border-[var(--border)] bg-white p-4">
        <p className="eyebrow">Requested by</p>
        <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{trackingInfo.requesterName}</p>
        <p className="mt-0.5 text-xs text-[var(--muted)]">Submitted {submittedAt ?? "recently"}</p>
      </div>
      <div className="rounded-lg border border-[var(--border)] bg-white p-4">
        <p className="eyebrow">Pickup location</p>
        <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{location}</p>
        {readyAt ? <p className="mt-0.5 text-xs text-[var(--muted)]">Ready since {readyAt}</p> : <p className="mt-0.5 text-xs text-[var(--muted)]">Not ready yet</p>}
      </div>
    </div>
  );
}

function TechnicianCard({ trackingInfo }: { trackingInfo: PublicTrackingInfo }) {
  if (!trackingInfo.technician) return null;
  const displayStatus = getDisplayStatus(trackingInfo);
  if (displayStatus === "SUBMITTED" || displayStatus === "NOT_RECEIVED" || displayStatus === "RECEIVED") return null;

  const { technician } = trackingInfo;
  const whatsAppUrl = buildWhatsAppUrl(trackingInfo);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-5">
      <p className="eyebrow">Your assigned technician</p>
      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-[var(--blue-700)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-[var(--foreground)]">{technician.fullName}</p>
          {technician.phone ? (
            <p className="mt-0.5 text-sm text-[var(--muted)]">{technician.phone}</p>
          ) : (
            <p className="mt-0.5 text-sm text-[var(--muted)]">Phone not available</p>
          )}
        </div>
        {whatsAppUrl ? (
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-600" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.564 4.14 1.546 5.872L0 24l6.293-1.519A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.806 9.806 0 0 1-4.983-1.361l-.357-.213-3.738.901.938-3.641-.234-.373A9.772 9.772 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
            </svg>
            WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  );
}

function PublicTimeline({ events }: { events: PublicTimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No timeline updates yet.</p>;
  }

  return (
    <ol className="grid gap-0">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const statusTo = event.statusTo ? (REPAIR_STATUS_LABELS[event.statusTo as RepairStatus] ?? event.statusTo.replaceAll("_", " ")) : null;
        const custodyTo = event.custodyTo ? (CUSTODY_STATUS_LABELS[event.custodyTo] ?? event.custodyTo.replaceAll("_", " ")) : null;

        return (
          <li key={`${event.eventType}-${event.occurredAt}`} className="grid grid-cols-[20px_1fr] gap-4">
            <div className="flex flex-col items-center">
              <span className="mt-4 h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--blue-600)] shadow-[0_0_0_2px_#bfdbfe]" />
              {!isLast ? <span className="min-h-6 w-px flex-1 bg-[var(--border)]" /> : null}
            </div>
            <div className={isLast ? "pt-3" : "pb-6 pt-3"}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--foreground)]">{eventTypeLabels[event.eventType] ?? event.eventType.replaceAll("_", " ")}</p>
                {event.statusTo ? (
                  <span className={`status-badge ${repairStatusClassName[event.statusTo as RepairStatus] ?? "status-registration"}`}>{statusTo}</span>
                ) : null}
              </div>
              <p className="mt-1 text-xs font-medium text-[var(--muted)]">
                {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.occurredAt))}
              </p>
              {custodyTo ? <p className="mt-2 text-sm text-[var(--muted-strong)]">Device custody: {custodyTo}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function TrackingResult({ trackingInfo }: { trackingInfo: PublicTrackingInfo }) {
  return (
    <section className="grid gap-4">
      <StatusHero trackingInfo={trackingInfo} />
      <DetailGrid trackingInfo={trackingInfo} />
      <TechnicianCard trackingInfo={trackingInfo} />
      <div className="rounded-xl border border-[var(--border)] bg-white p-5">
        <p className="eyebrow">Repair timeline</p>
        <div className="mt-4">
          <PublicTimeline events={trackingInfo.timeline} />
        </div>
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
      const response = await fetch(`/api/public/tracking/${encodeURIComponent(normalizedCode)}`, { method: "GET" });
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
      if (!response.ok || !body) {
        setState("error");
        setMessage(body?.error ?? "Unable to load repair status.");
        return;
      }

      setTrackingInfo(body);
      setState("success");
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetchTrackingInfo(trackingCode);
  }

  useEffect(() => {
    if (normalizedInitialCode) {
      fetchTrackingInfo(normalizedInitialCode);
    }
  }, [normalizedInitialCode]);

  return (
    <div className="grid gap-6">
      {/* ── Search box ── */}
      <div
        style={{
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(12px)",
          padding: "28px 28px 24px",
        }}
      >
        <p
          style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: "6px" }}
        >
          Enter your tracking code
        </p>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", marginBottom: "20px", lineHeight: 1.5 }}>
          You received this after submitting your request. Format: SIM-2026-1000001
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            style={{
              flex: "1 1 200px",
              height: "50px",
              padding: "0 16px",
              fontSize: "16px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              fontFamily: "var(--font-mono, monospace)",
              color: "#fff",
              background: "rgba(255,255,255,0.08)",
              border: "1.5px solid rgba(255,255,255,0.15)",
              borderRadius: "12px",
              outline: "none",
              transition: "border-color 150ms",
            }}
            value={trackingCode}
            onChange={(event) => setTrackingCode(event.target.value.toUpperCase())}
            placeholder="SIM-2026-100001"
            aria-label="Tracking code"
          />
          <button
            disabled={isPending}
            style={{
              flexShrink: 0,
              height: "50px",
              padding: "0 24px",
              fontSize: "14px",
              fontWeight: 700,
              color: "#fff",
              background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
              border: "none",
              borderRadius: "12px",
              cursor: isPending ? "not-allowed" : "pointer",
              boxShadow: "0 0 0 1px rgba(37,99,235,0.5), 0 8px 20px rgba(29,78,216,0.35)",
              transition: "opacity 150ms",
              opacity: isPending ? 0.7 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {isPending ? "Checking…" : "Check status"}
          </button>
        </form>
      </div>

      {/* ── State messages ── */}
      {state === "invalid" ? (
        <div style={{ borderRadius: "12px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", padding: "14px 18px" }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "#f87171", marginBottom: "4px" }}>Invalid tracking code</p>
          <p style={{ fontSize: "13px", color: "rgba(248,113,113,0.7)", lineHeight: 1.5 }}>{message ?? "Check the tracking code and try again."}</p>
        </div>
      ) : null}
      {state === "not-found" ? (
        <div style={{ borderRadius: "12px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", padding: "14px 18px" }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "#f87171", marginBottom: "4px" }}>Not found</p>
          <p style={{ fontSize: "13px", color: "rgba(248,113,113,0.7)", lineHeight: 1.5 }}>No repair request matches this tracking code. Double-check the code and try again.</p>
        </div>
      ) : null}
      {state === "error" ? (
        <div style={{ borderRadius: "12px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", padding: "14px 18px" }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "#f87171", marginBottom: "4px" }}>Unable to load status</p>
          <p style={{ fontSize: "13px", color: "rgba(248,113,113,0.7)", lineHeight: 1.5 }}>{message ?? "Try again in a moment."}</p>
        </div>
      ) : null}
      {(state === "loading" || isPending) && state !== "success" ? (
        <div style={{ borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", padding: "14px 18px" }}>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>Checking your repair status…</p>
        </div>
      ) : null}

      {state === "success" && trackingInfo ? <TrackingResult trackingInfo={trackingInfo} /> : null}

      <p style={{ textAlign: "center", fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>
        Need a repair?{" "}
        <Link href="/request-repair" style={{ fontWeight: 600, color: "#60A5FA" }}>
          Submit a new request
        </Link>
      </p>
    </div>
  );
}
