import type { PrismaClient } from "@prisma/client";
import { PROBLEM_CATEGORIES } from "@/lib/intake/diagnosis";
import { REQUESTER_TYPES } from "@/lib/intake/options";
import { FAULTS, REPAIR_ACTIONS } from "@/lib/tickets/repair-record";
import { STATUS_DISPLAY, type TicketStatusName } from "@/lib/tickets/status-display";

/** Every ticket of one event as CSV (AD3). Phone numbers stay out. */

const HEADER = [
  "Tracking code",
  "Tag",
  "Status",
  "Submitted",
  "Received",
  "Ready",
  "Collected",
  "Requester type",
  "Requester",
  "University ID",
  "Faculty",
  "Device type",
  "Brand",
  "Model",
  "Problem",
  "Technician",
  "Faults found",
  "Work done",
  "Rating",
];

/** Quotes a cell and defuses spreadsheet formulas (=, +, -, @). */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const labels = (values: string[], options: { value: string; label: string }[]) => values.map((v) => options.find((o) => o.value === v)?.label ?? v).join("; ");

export async function ticketsCsv(prisma: PrismaClient, eventId: string): Promise<string> {
  const tickets = await prisma.repairTicket.findMany({
    where: { eventId },
    orderBy: [{ createdAt: "asc" }],
    select: {
      trackingCode: true,
      ticketId: true,
      tagNumber: true,
      status: true,
      createdAt: true,
      readyForPickupAt: true,
      closedAt: true,
      problemCategories: true,
      repairFaults: true,
      repairActions: true,
      rating: true,
      custody: { select: { receivedAt: true } },
      requester: { select: { requesterType: true, fullName: true, universityId: true, faculty: true } },
      device: { select: { deviceType: true, brand: true, model: true } },
      technician: { select: { fullName: true } },
    },
  });

  const rows = tickets.map((t) => [
    t.trackingCode ?? t.ticketId,
    t.tagNumber,
    STATUS_DISPLAY[t.status as TicketStatusName]?.label ?? t.status,
    t.createdAt,
    t.custody?.receivedAt,
    t.readyForPickupAt,
    t.status === "COLLECTED" ? t.closedAt : null,
    REQUESTER_TYPES.find((o) => o.value === t.requester?.requesterType)?.label ?? t.requester?.requesterType,
    t.requester?.fullName,
    t.requester?.universityId,
    t.requester?.faculty,
    t.device.deviceType,
    t.device.brand,
    t.device.model,
    labels(t.problemCategories, PROBLEM_CATEGORIES),
    t.technician?.fullName,
    labels(t.repairFaults, FAULTS),
    labels(t.repairActions, REPAIR_ACTIONS),
    t.rating,
  ]);

  // BOM so Excel opens UTF-8 names correctly.
  return "﻿" + [HEADER, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
