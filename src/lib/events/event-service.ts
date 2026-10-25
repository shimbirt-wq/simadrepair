import type { Prisma, PrismaClient } from "@prisma/client";
import type { EventInput } from "@/lib/events/event-schema";
import { getRegistrationState, type RegistrationState } from "@/lib/events/event-window";

export const LEGACY_EVENT_ID = "legacy";

type Db = PrismaClient | Prisma.TransactionClient;

const toDate = (day: string) => new Date(`${day}T00:00:00.000Z`);

function toData(input: EventInput) {
  return {
    name: input.name,
    startsOn: toDate(input.startsOn),
    endsOn: toDate(input.endsOn),
    registrationOpensOn: toDate(input.registrationOpensOn),
    registrationClosesOn: toDate(input.registrationClosesOn),
    venue: input.venue,
    hours: input.hours,
    deskWhatsapp: input.deskWhatsapp,
    holdDays: input.holdDays,
  };
}

export function getActiveEvent(db: Db) {
  return db.event.findFirst({ where: { isActive: true } });
}

export type ActiveEvent = NonNullable<Awaited<ReturnType<typeof getActiveEvent>>>;

export async function getRegistration(db: Db, now = new Date()): Promise<{ state: RegistrationState; event: ActiveEvent | null }> {
  const event = await getActiveEvent(db);
  return { state: getRegistrationState(event, now), event };
}

export function listEvents(db: Db) {
  return db.event.findMany({
    where: { id: { not: LEGACY_EVENT_ID } },
    orderBy: [{ startsOn: "desc" }],
    include: { _count: { select: { tickets: true } } },
  });
}

export function getEvent(db: Db, id: string) {
  return db.event.findUnique({ where: { id } });
}

export async function createEvent(prisma: PrismaClient, input: EventInput, options: { activate?: boolean } = {}) {
  return prisma.$transaction(async (tx) => {
    if (options.activate) await tx.event.updateMany({ where: { isActive: true }, data: { isActive: false } });
    return tx.event.create({ data: { ...toData(input), isActive: Boolean(options.activate) } });
  });
}

export function updateEvent(db: Db, id: string, input: EventInput) {
  return db.event.update({ where: { id }, data: toData(input) });
}

/** Makes this the one active event; new requests and tags go to it. */
export async function activateEvent(prisma: PrismaClient, id: string) {
  return prisma.$transaction(async (tx) => {
    await tx.event.updateMany({ where: { isActive: true, id: { not: id } }, data: { isActive: false } });
    return tx.event.update({ where: { id }, data: { isActive: true } });
  });
}

export function deactivateEvent(db: Db, id: string) {
  return db.event.update({ where: { id }, data: { isActive: false } });
}
