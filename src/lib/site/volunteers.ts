import type { PrismaClient } from "@prisma/client";
import { LEGACY_EVENT_ID } from "@/lib/events/event-service";

/** The active event, else the most recent one that has started. */
export async function latestEvent(prisma: PrismaClient, now = new Date()) {
  return (
    (await prisma.event.findFirst({ where: { isActive: true } })) ??
    (await prisma.event.findFirst({ where: { id: { not: LEGACY_EVENT_ID }, startsOn: { lte: now } }, orderBy: { startsOn: "desc" } }))
  );
}

/** "Delivered by N student volunteers": technicians who worked on at least one ticket of the event (WD4). */
export async function countVolunteers(prisma: PrismaClient, eventId: string) {
  const rows = await prisma.repairTicket.findMany({
    where: { eventId, technicianId: { not: null }, technician: { role: "TECHNICIAN" } },
    distinct: ["technicianId"],
    select: { technicianId: true },
  });
  return rows.length;
}
