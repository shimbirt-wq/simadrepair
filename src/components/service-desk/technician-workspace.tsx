"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { CustodyStatus, RepairEventType, RepairStatus, UserRole } from "@prisma/client";
import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";
import { CUSTODY_STATUS_LABELS } from "@/lib/service-desk/constants";

type TechnicianQueueTicket = {
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
  custody: {
    status: CustodyStatus;
    receivedAt: string | null;
    storageLocation: string | null;
    readyForCollectionAt: string | null;
  } | null;
};

type TechnicianTicketDetail = TechnicianQueueTicket & {
  technicianId: string | null;
  issueDescription: string;
  requester: TechnicianQueueTicket["requester"] & {
    email: string | null;
  };
  device: TechnicianQueueTicket["device"] & {
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
      email: string;
      role: UserRole;
    } | null;
  }>;
};

type QueueFilter = "ALL" | "READY_TO_START" | "IN_REPAIR" | "READY";

const statusClassName: Record<RepairStatus, string> = {
  REGISTRATION_COMPLETED: "status-registration",
  DEVICE_RECEIVED: "status-received",
  REPAIR_IN_PROGRESS: "status-repair",
  READY_FOR_COLLECTION: "status-ready",
  DEVICE_COLLECTED: "status-collected",
};

type WorkflowStep = "start" | "in-progress" | "done";

function getWorkflowStep(status: RepairStatus): WorkflowStep {
  if (status === "DEVICE_RECEIVED") return "start";
  if (status === "REPAIR_IN_PROGRESS") return "in-progress";
  return "done";
}

const workflowStepConfig: Record<WorkflowStep, { label: string; dot: string; hint: string }> = {
  start: {
    label: "Ready to start",
    dot: "bg-blue-500",
    hint: "Device is in your custody. Click Start repair when you begin working on it.",
  },
  "in-progress": {
    label: "In repair",
    dot: "bg-purple-500",
    hint: "You are currently working on this device. Click Mark ready when the repair is complete.",
  },
  done: {
    label: "Ready for pickup",
    dot: "bg-emerald-500",
    hint: "Repair is complete. The requester has been notified. Message them on WhatsApp if needed.",
  },
};

function getTracking(ticket: Pick<TechnicianQueueTicket, "ticketId" | "trackingCode">) {
  return ticket.trackingCode ?? ticket.ticketId;
}

function getDeviceName(ticket: Pick<TechnicianQueueTicket, "device">) {
  return `${ticket.device.brand} ${ticket.device.model}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function matchesFilter(ticket: TechnicianQueueTicket, filter: QueueFilter) {
  if (filter === "READY_TO_START") return ticket.status === "DEVICE_RECEIVED";
  if (filter === "IN_REPAIR") return ticket.status === "REPAIR_IN_PROGRESS";
  if (filter === "READY") return ticket.status === "READY_FOR_COLLECTION";
  return true;
}

function buildWhatsAppUrl(ticket: TechnicianTicketDetail) {
  const phone = ticket.requester.phone?.replace(/[^\d]/g, "");
  if (!phone) return null;
  const location = ticket.custody?.storageLocation ?? "the IT service desk";
  const message = `Hello ${ticket.requester.fullName ?? "there"}, your device is ready for pickup. Please come to ${location} to collect it. Thank you.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function TechnicianWorkspace() {
  const [tickets, setTickets] = useState<TechnicianQueueTicket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TechnicianTicketDetail | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<QueueFilter>("ALL");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function loadTickets() {
    const response = await fetch("/api/technician/workspace/tickets", { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load assigned tickets.");
    const payload = (await response.json()) as { tickets: TechnicianQueueTicket[] };
    setTickets(payload.tickets);
    setSelectedId((current) => current ?? payload.tickets[0]?.id ?? null);
  }

  async function loadTicketDetail(ticketId: string) {
    const response = await fetch(`/api/technician/workspace/tickets/${encodeURIComponent(ticketId)}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load ticket detail.");
    const payload = (await response.json()) as { ticket: TechnicianTicketDetail };
    setSelectedTicket(payload.ticket);
  }

  useEffect(() => {
    loadTickets().catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load workspace.");
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
      readyToStart: tickets.filter((t) => t.status === "DEVICE_RECEIVED").length,
      inRepair: tickets.filter((t) => t.status === "REPAIR_IN_PROGRESS").length,
      ready: tickets.filter((t) => t.status === "READY_FOR_COLLECTION").length,
    }),
    [tickets],
  );

  function mutateStatus(status: "REPAIR_IN_PROGRESS" | "READY_FOR_COLLECTION") {
    if (!selectedTicket) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/technician/workspace/tickets/${encodeURIComponent(selectedTicket.id)}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "Unable to update status.");
        setMessage(status === "REPAIR_IN_PROGRESS" ? "Repair started." : "Marked as ready for pickup.");
        await loadTickets();
        await loadTicketDetail(selectedTicket.id);
      } catch (mutationError) {
        setError(mutationError instanceof Error ? mutationError.message : "Action failed.");
      }
    });
  }

  const whatsAppUrl = selectedTicket ? buildWhatsAppUrl(selectedTicket) : null;
  const workflowStep = selectedTicket ? getWorkflowStep(selectedTicket.status) : null;
  const stepConf = workflowStep ? workflowStepConfig[workflowStep] : null;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.82fr)_minmax(480px,1.18fr)]">
      {/* ── My queue ── */}
      <section className="panel overflow-hidden">
        <div className="border-b border-[var(--border)] p-5">
          <p className="eyebrow">My assigned work</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Repair queue</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              className="field-control"
              placeholder="Search code, name, device…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select className="field-control" value={filter} onChange={(event) => setFilter(event.target.value as QueueFilter)}>
              <option value="ALL">All assigned</option>
              <option value="READY_TO_START">Ready to start</option>
              <option value="IN_REPAIR">In repair</option>
              <option value="READY">Ready for pickup</option>
            </select>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Total", value: stats.total },
              { label: "Start", value: stats.readyToStart },
              { label: "Repair", value: stats.inRepair },
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
            <div className="rounded-lg border border-dashed border-[var(--border)] p-5 text-center">
              <p className="text-sm font-semibold text-[var(--foreground)]">No tickets here</p>
              <p className="mt-1 text-sm text-[var(--muted)]">No assigned tickets match this filter.</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const step = getWorkflowStep(ticket.status);
              const stepC = workflowStepConfig[step];
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
                      <span className={`h-2 w-2 rounded-full ${stepC.dot}`} />
                      {stepC.label}
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
            {selectedTicket ? getTracking(selectedTicket) : "Select a ticket"}
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
            {/* Workflow hint */}
            {stepConf ? (
              <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-4">
                <span className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${stepConf.dot}`} />
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{stepConf.label}</p>
                  <p className="mt-0.5 text-sm text-[var(--muted)]">{stepConf.hint}</p>
                </div>
              </div>
            ) : null}

            {/* Info */}
            <div className="grid gap-4 lg:grid-cols-3">
              <InfoBlock
                label="Requester"
                value={selectedTicket.requester.fullName ?? "Requester"}
                detail={selectedTicket.requester.phone ?? "No phone"}
              />
              <InfoBlock
                label="Device"
                value={getDeviceName(selectedTicket)}
                detail={selectedTicket.device.serialNumber ?? selectedTicket.device.deviceType}
              />
              <InfoBlock
                label="Status"
                value={REPAIR_STATUS_LABELS[selectedTicket.status]}
                detail={selectedTicket.custody ? CUSTODY_STATUS_LABELS[selectedTicket.custody.status] : "No custody"}
              />
            </div>

            {/* Issue */}
            <div className="rounded-lg border border-[var(--border)] bg-white p-4">
              <p className="eyebrow">Issue reported</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">{selectedTicket.issueDescription}</p>
            </div>

            {/* Location */}
            {selectedTicket.custody?.storageLocation ? (
              <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white px-4 py-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-[var(--muted)]" aria-hidden="true">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <p className="text-sm font-medium text-[var(--muted-strong)]">Storage: {selectedTicket.custody.storageLocation}</p>
              </div>
            ) : null}

            {/* Actions */}
            <div className="rounded-lg border border-[var(--border)] bg-white p-5">
              <p className="eyebrow mb-4">Actions</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={isPending || selectedTicket.status !== "DEVICE_RECEIVED"}
                  onClick={() => mutateStatus("REPAIR_IN_PROGRESS")}
                >
                  Start repair
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={isPending || selectedTicket.status !== "REPAIR_IN_PROGRESS"}
                  onClick={() => mutateStatus("READY_FOR_COLLECTION")}
                >
                  Mark ready for pickup
                </button>
                {whatsAppUrl ? (
                  <a
                    className={`btn-secondary ${selectedTicket.status === "READY_FOR_COLLECTION" ? "" : "pointer-events-none opacity-40"}`}
                    href={selectedTicket.status === "READY_FOR_COLLECTION" ? whatsAppUrl : undefined}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp requester
                  </a>
                ) : null}
              </div>
              <p className="mt-4 text-xs text-[var(--muted)]">
                {selectedTicket.status === "DEVICE_RECEIVED"
                  ? "Start repair when you have the device in front of you and are ready to begin."
                  : selectedTicket.status === "REPAIR_IN_PROGRESS"
                    ? "Mark ready when the device is fully repaired and ready for the requester to collect."
                    : "Repair complete. The lead technician will confirm collection with the requester."}
              </p>
            </div>

            {/* Activity */}
            <div className="rounded-lg border border-[var(--border)] bg-white p-4">
              <p className="eyebrow">Recent activity</p>
              <div className="mt-3 grid gap-3">
                {selectedTicket.events.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">No activity yet.</p>
                ) : (
                  selectedTicket.events.slice(0, 6).map((event) => (
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
              <path d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
            </svg>
            <p className="text-sm font-semibold text-[var(--foreground)]">No ticket selected</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Select a ticket from your queue to see details and update its status.</p>
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
