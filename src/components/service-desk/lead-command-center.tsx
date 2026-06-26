"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { CustodyStatus, RepairEventType, RepairStatus, UserRole } from "@prisma/client";
import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";
import { CUSTODY_STATUS_LABELS } from "@/lib/service-desk/constants";

type LeadQueueTicket = {
  id: string;
  ticketId: string;
  trackingCode: string | null;
  status: RepairStatus;
  createdAt: string;
  assignedAt: string | null;
  requester: {
    fullName: string | null;
    requesterType: string | null;
    universityId: string | null;
    faculty: string | null;
    department: string | null;
    phone: string | null;
  };
  device: {
    deviceType: string;
    brand: string;
    model: string;
    serialNumber: string | null;
  };
  technician: {
    id: string;
    fullName: string;
    phone: string | null;
  } | null;
  custody: {
    status: CustodyStatus;
    receivedAt: string | null;
    storageLocation: string | null;
    readyForCollectionAt: string | null;
    collectedAt: string | null;
  } | null;
};

type LeadTicketDetail = LeadQueueTicket & {
  issueDescription: string;
  requester: LeadQueueTicket["requester"] & {
    email: string | null;
  };
  device: LeadQueueTicket["device"] & {
    id: string;
    assetTag: string | null;
    description: string | null;
  };
  events: Array<{
    id: string;
    eventType: RepairEventType;
    actorRole: UserRole | null;
    statusFrom: string | null;
    statusTo: string | null;
    custodyFrom: CustodyStatus | null;
    custodyTo: CustodyStatus | null;
    note: string | null;
    createdAt: string;
    actor: {
      id: string;
      fullName: string;
      role: UserRole;
    } | null;
  }>;
};

type TechnicianOption = {
  id: string;
  fullName: string;
  role: UserRole;
};

type QueueFilter = "ALL" | "NOT_RECEIVED" | "UNASSIGNED" | "IN_REPAIR" | "READY";

type NextAction = "receive" | "assign" | "in-repair" | "pickup" | "done";

const statusClassName: Record<RepairStatus, string> = {
  REGISTRATION_COMPLETED: "status-registration",
  DEVICE_RECEIVED: "status-received",
  REPAIR_IN_PROGRESS: "status-repair",
  READY_FOR_COLLECTION: "status-ready",
  DEVICE_COLLECTED: "status-collected",
};

function getNextAction(ticket: LeadQueueTicket): NextAction {
  if (ticket.status === "DEVICE_COLLECTED") return "done";
  if (ticket.status === "READY_FOR_COLLECTION") return "pickup";
  if (ticket.status === "REPAIR_IN_PROGRESS") return "in-repair";
  if (!ticket.custody || ticket.custody.status === "NOT_RECEIVED") return "receive";
  if (!ticket.technician) return "assign";
  return "in-repair";
}

const nextActionConfig: Record<NextAction, { label: string; dot: string; text: string }> = {
  receive: {
    label: "Receive device",
    dot: "bg-amber-500",
    text: "The device has not been checked in yet. Mark it as received to start the workflow.",
  },
  assign: {
    label: "Assign technician",
    dot: "bg-blue-500",
    text: "Device is received. Assign a technician to start the repair.",
  },
  "in-repair": {
    label: "In repair",
    dot: "bg-purple-500",
    text: "A technician is working on this device. Wait for them to mark it ready.",
  },
  pickup: {
    label: "Ready for pickup",
    dot: "bg-emerald-500",
    text: "Repair is done. Send a WhatsApp to the requester and confirm collection when they arrive.",
  },
  done: {
    label: "Collected",
    dot: "bg-slate-400",
    text: "This ticket has been completed and the device was collected.",
  },
};

function formatDateTime(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function getTracking(ticket: Pick<LeadQueueTicket, "ticketId" | "trackingCode">) {
  return ticket.trackingCode ?? ticket.ticketId;
}

function getDeviceName(ticket: Pick<LeadQueueTicket, "device">) {
  return `${ticket.device.brand} ${ticket.device.model}`;
}

function matchesFilter(ticket: LeadQueueTicket, filter: QueueFilter) {
  if (filter === "NOT_RECEIVED") return ticket.custody?.status === "NOT_RECEIVED";
  if (filter === "UNASSIGNED") return !ticket.technician && ticket.status !== "DEVICE_COLLECTED";
  if (filter === "IN_REPAIR") return ticket.status === "REPAIR_IN_PROGRESS";
  if (filter === "READY") return ticket.status === "READY_FOR_COLLECTION";
  return true;
}

function buildWhatsAppUrl(ticket: LeadTicketDetail) {
  const phone = ticket.requester.phone?.replace(/[^\d]/g, "");
  if (!phone) return null;
  const location = ticket.custody?.storageLocation ?? "the IT service desk";
  const message = `Hello ${ticket.requester.fullName ?? "there"}, your device is ready for pickup. Please come to ${location} to collect it. Thank you.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function LeadCommandCenter() {
  const [tickets, setTickets] = useState<LeadQueueTicket[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<LeadTicketDetail | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<QueueFilter>("ALL");
  const [storageLocation, setStorageLocation] = useState("IT service desk");
  const [technicianId, setTechnicianId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function loadTickets() {
    const response = await fetch("/api/lead/tickets", { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load lead queue.");
    const payload = (await response.json()) as { tickets: LeadQueueTicket[] };
    setTickets(payload.tickets);
    setSelectedId((current) => current ?? payload.tickets[0]?.id ?? null);
  }

  async function loadTechnicians() {
    const response = await fetch("/api/lead/technicians", { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load technicians.");
    const payload = (await response.json()) as { technicians: TechnicianOption[] };
    setTechnicians(payload.technicians);
  }

  async function loadTicketDetail(ticketId: string) {
    const response = await fetch(`/api/lead/tickets/${encodeURIComponent(ticketId)}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load ticket detail.");
    const payload = (await response.json()) as { ticket: LeadTicketDetail };
    setSelectedTicket(payload.ticket);
    setTechnicianId(payload.ticket.technician?.id ?? "");
    setStorageLocation(payload.ticket.custody?.storageLocation ?? "IT service desk");
  }

  useEffect(() => {
    Promise.all([loadTickets(), loadTechnicians()]).catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load command center.");
    });
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedTicket(null);
      return;
    }
    loadTicketDetail(selectedId).catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load ticket detail.");
    });
  }, [selectedId]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const haystack = [
        getTracking(ticket),
        ticket.requester.fullName,
        ticket.requester.phone,
        ticket.requester.universityId,
        ticket.device.brand,
        ticket.device.model,
        ticket.device.serialNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesFilter(ticket, filter) && (!query || haystack.includes(query));
    });
  }, [filter, search, tickets]);

  const stats = useMemo(
    () => ({
      total: tickets.length,
      notReceived: tickets.filter((t) => !t.custody || t.custody.status === "NOT_RECEIVED").length,
      unassigned: tickets.filter((t) => !t.technician && t.status !== "DEVICE_COLLECTED").length,
      ready: tickets.filter((t) => t.status === "READY_FOR_COLLECTION").length,
    }),
    [tickets],
  );

  function mutateSelected(action: () => Promise<void>, successMsg: string) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await action();
        setMessage(successMsg);
        await loadTickets();
        if (selectedId) await loadTicketDetail(selectedId);
      } catch (mutationError) {
        setError(mutationError instanceof Error ? mutationError.message : "Action failed.");
      }
    });
  }

  async function receiveDevice() {
    if (!selectedTicket) return;
    const response = await fetch(`/api/lead/tickets/${encodeURIComponent(selectedTicket.id)}/custody`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storageLocation }),
    });
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "Unable to receive device.");
  }

  async function assignTechnician() {
    if (!selectedTicket || !technicianId) return;
    const response = await fetch(`/api/lead/tickets/${encodeURIComponent(selectedTicket.id)}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ technicianId }),
    });
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "Unable to assign technician.");
  }

  async function confirmPickup() {
    if (!selectedTicket) return;
    const response = await fetch(`/api/lead/tickets/${encodeURIComponent(selectedTicket.id)}/custody/pickup`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collectedByName: selectedTicket.requester.fullName ?? "Requester",
        collectedByPhone: selectedTicket.requester.phone ?? undefined,
      }),
    });
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "Unable to confirm pickup.");
  }

  const whatsAppUrl = selectedTicket ? buildWhatsAppUrl(selectedTicket) : null;
  const selectedNextAction = selectedTicket ? getNextAction(selectedTicket) : null;
  const nextActionInfo = selectedNextAction ? nextActionConfig[selectedNextAction] : null;

  const canReceive = selectedTicket?.custody?.status === "NOT_RECEIVED" || !selectedTicket?.custody;
  const canConfirmPickup = selectedTicket?.status === "READY_FOR_COLLECTION";

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.85fr)_minmax(480px,1.15fr)]">
      {/* ── Queue ── */}
      <section className="panel overflow-hidden">
        <div className="border-b border-[var(--border)] p-5">
          <p className="eyebrow">Queue</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Active requests</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              className="field-control"
              placeholder="Search code, name, phone…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select className="field-control" value={filter} onChange={(event) => setFilter(event.target.value as QueueFilter)}>
              <option value="ALL">All requests</option>
              <option value="NOT_RECEIVED">Not received</option>
              <option value="UNASSIGNED">Needs technician</option>
              <option value="IN_REPAIR">In repair</option>
              <option value="READY">Ready for pickup</option>
            </select>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Total", value: stats.total },
              { label: "Not in", value: stats.notReceived },
              { label: "No tech", value: stats.unassigned },
              { label: "Ready", value: stats.ready },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-2">
                <p className="text-lg font-bold text-[var(--foreground)]">{value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-h-[560px] overflow-auto p-3">
          {filteredTickets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--border)] p-5 text-sm text-[var(--muted)]">
              No requests match this filter.
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const nextAction = getNextAction(ticket);
              const actionConf = nextActionConfig[nextAction];
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedId(ticket.id)}
                  className={`mb-3 w-full rounded-lg border p-4 text-left transition ${
                    selectedId === ticket.id
                      ? "border-[var(--blue-600)] bg-blue-50"
                      : "border-[var(--border)] bg-white hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="tracking-code text-sm font-bold text-[var(--foreground)]">{getTracking(ticket)}</p>
                      <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
                        {ticket.requester.fullName ?? "Requester"} &middot; {ticket.requester.phone ?? "No phone"}
                      </p>
                    </div>
                    <span className={`status-badge flex-shrink-0 ${statusClassName[ticket.status]}`}>
                      {REPAIR_STATUS_LABELS[ticket.status]}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                    <p className="text-[var(--muted)]">{getDeviceName(ticket)}</p>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted-strong)]">
                      <span className={`h-2 w-2 rounded-full ${actionConf.dot}`} />
                      {actionConf.label}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* ── Detail ── */}
      <section className="panel overflow-hidden">
        <div className="border-b border-[var(--border)] p-5">
          <p className="eyebrow">Ticket detail</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            {selectedTicket ? getTracking(selectedTicket) : "Select a request"}
          </h2>
          {message ? (
            <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
          ) : null}
          {error ? (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
        </div>

        {selectedTicket ? (
          <div className="grid gap-5 overflow-auto p-5">
            {/* Next action banner */}
            {nextActionInfo && selectedNextAction !== "done" ? (
              <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-4">
                <span className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${nextActionInfo.dot}`} />
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">Next: {nextActionInfo.label}</p>
                  <p className="mt-0.5 text-sm text-[var(--muted)]">{nextActionInfo.text}</p>
                </div>
              </div>
            ) : null}

            {/* Info row */}
            <div className="grid gap-4 lg:grid-cols-3">
              <InfoBlock label="Requester" value={selectedTicket.requester.fullName ?? "Requester"} detail={selectedTicket.requester.phone ?? "No phone"} />
              <InfoBlock label="Device" value={getDeviceName(selectedTicket)} detail={selectedTicket.device.serialNumber ?? selectedTicket.device.deviceType} />
              <InfoBlock
                label="Status"
                value={REPAIR_STATUS_LABELS[selectedTicket.status]}
                detail={selectedTicket.custody ? CUSTODY_STATUS_LABELS[selectedTicket.custody.status] : "Not received"}
              />
            </div>

            {/* Issue */}
            <div className="rounded-lg border border-[var(--border)] bg-white p-4">
              <p className="eyebrow">Issue reported</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">{selectedTicket.issueDescription}</p>
            </div>

            {/* Step 1: Receive */}
            <div className={`rounded-lg border p-4 ${canReceive ? "border-amber-200 bg-amber-50" : "border-[var(--border)] bg-white opacity-70"}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Step 1 — Receive device</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {canReceive ? "Enter where the device will be stored and mark it received." : "Device already received."}
                  </p>
                </div>
                {!canReceive ? (
                  <span className="flex-shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Done</span>
                ) : null}
              </div>
              {canReceive ? (
                <div className="mt-3 flex gap-3">
                  <input
                    className="field-control flex-1"
                    placeholder="Storage location (e.g. IT service desk)"
                    value={storageLocation}
                    onChange={(event) => setStorageLocation(event.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-primary flex-shrink-0"
                    disabled={isPending || !storageLocation.trim()}
                    onClick={() => mutateSelected(receiveDevice, "Device marked as received.")}
                  >
                    Mark received
                  </button>
                </div>
              ) : null}
            </div>

            {/* Step 2: Assign */}
            <div className={`rounded-lg border p-4 ${!canReceive && !selectedTicket.technician ? "border-blue-200 bg-blue-50" : "border-[var(--border)] bg-white"} ${canReceive ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Step 2 — Assign technician</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {selectedTicket.technician
                      ? `Currently assigned to ${selectedTicket.technician.fullName}. You can reassign if needed.`
                      : "Choose a technician to handle this repair."}
                  </p>
                </div>
                {selectedTicket.technician ? (
                  <span className="flex-shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {selectedTicket.technician.fullName}
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex gap-3">
                <select
                  className="field-control flex-1"
                  value={technicianId}
                  onChange={(event) => setTechnicianId(event.target.value)}
                  disabled={canReceive}
                >
                  <option value="">Choose technician</option>
                  {technicians.map((technician) => (
                    <option key={technician.id} value={technician.id}>
                      {technician.fullName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-primary flex-shrink-0"
                  disabled={isPending || !technicianId || canReceive}
                  onClick={() => mutateSelected(assignTechnician, "Technician assigned.")}
                >
                  {selectedTicket.technician ? "Reassign" : "Assign"}
                </button>
              </div>
            </div>

            {/* Step 3: Pickup */}
            <div className={`rounded-lg border p-4 ${canConfirmPickup ? "border-emerald-200 bg-emerald-50" : "border-[var(--border)] bg-white"}`}>
              <p className="eyebrow">Step 3 — Pickup</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {canConfirmPickup
                  ? "Device is ready. Send a WhatsApp to the requester, then confirm collection when they arrive."
                  : "Pickup becomes available once the technician marks the device ready."}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {whatsAppUrl ? (
                  <a
                    className={`btn-secondary ${canConfirmPickup ? "" : "pointer-events-none opacity-40"}`}
                    href={canConfirmPickup ? whatsAppUrl : undefined}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp requester
                  </a>
                ) : null}
                <button
                  type="button"
                  className="btn-primary"
                  disabled={isPending || !canConfirmPickup}
                  onClick={() => mutateSelected(confirmPickup, "Pickup confirmed. Ticket closed.")}
                >
                  Confirm collection
                </button>
              </div>
            </div>

            {/* Activity */}
            <div className="rounded-lg border border-[var(--border)] bg-white p-4">
              <p className="eyebrow">Recent activity</p>
              <div className="mt-3 grid gap-3">
                {selectedTicket.events.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">No activity yet.</p>
                ) : (
                  selectedTicket.events.slice(0, 8).map((event) => (
                    <div key={event.id} className="border-t border-[var(--border)] pt-3 first:border-t-0 first:pt-0">
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {event.note ?? event.eventType.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {formatDateTime(event.createdAt)} &middot; {event.actor?.fullName ?? event.actorRole ?? "System"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <svg className="mb-3 h-10 w-10 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <p className="text-sm font-semibold text-[var(--foreground)]">No ticket selected</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Choose a request from the queue to review details and take action.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function InfoBlock({ detail, label, value }: { detail?: string; label: string; value: string }) {
  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 text-base font-semibold text-[var(--foreground)]">{value}</p>
      {detail ? <p className="mt-1 text-xs text-[var(--muted)]">{detail}</p> : null}
    </article>
  );
}
