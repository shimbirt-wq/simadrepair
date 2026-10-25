import { Prisma, type PrismaClient, type TicketStatus, type UserRole } from "@prisma/client";
import { getRegistration } from "@/lib/events/event-service";
import type { RegistrationState } from "@/lib/events/event-window";
import type { IntakeInput } from "@/lib/intake/intake-schema";
import { BRANDS, DEVICE_TYPES, labelOf } from "@/lib/intake/options";
import { generateTrackingCode } from "@/lib/tickets/tracking-code";

/**
 * Creates a repair request from the public form or the desk. Rules:
 * - only while the active event's registration window is open (desk can
 *   register any time during the active event),
 * - one open request per university ID + device type + brand,
 * - at most DAILY_LIMIT requests per university ID per 24 hours,
 * - returning requesters are matched by university ID and their contact
 *   details updated.
 */

export const DAILY_LIMIT = 3;

/** Requests that still occupy the desk; a new one for the same device is a duplicate. */
const OPEN_STATUSES: TicketStatus[] = ["SUBMITTED", "RECEIVED", "IN_REPAIR", "WAITING_FOR_PARTS", "ACTION_NEEDED", "CANNOT_REPAIR_PROPOSED", "READY_FOR_PICKUP"];

export type IntakeSource = { kind: "public" } | { kind: "desk"; actorId: string; actorRole: UserRole };

export type IntakeResult =
  | { ok: true; ticketId: string; trackingCode: string; firstName: string; eventName: string }
  | { ok: false; reason: "REGISTRATION_CLOSED"; state: RegistrationState }
  | { ok: false; reason: "DUPLICATE"; trackingCode: string }
  | { ok: false; reason: "DAILY_LIMIT" }
  | { ok: false; reason: "SPAM" };

const MAX_CODE_ATTEMPTS = 8;

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createRepairRequest(prisma: PrismaClient, input: IntakeInput, source: IntakeSource = { kind: "public" }, now = new Date()): Promise<IntakeResult> {
  if (input.website) return { ok: false, reason: "SPAM" };

  const { state, event } = await getRegistration(prisma, now);
  const deskCanRegister = source.kind === "desk" && event !== null;
  if (!event || (state !== "OPEN" && !deskCanRegister)) return { ok: false, reason: "REGISTRATION_CLOSED", state };

  const { requester, device, problem } = input;
  const brandLabel = device.brand === "OTHER" ? device.brandOther ?? "Other" : labelOf(BRANDS, device.brand);
  const deviceTypeLabel = labelOf(DEVICE_TYPES, device.deviceType);

  const existing = await prisma.repairTicket.findFirst({
    where: {
      status: { in: OPEN_STATUSES },
      requester: { universityId: requester.universityId },
      device: { deviceType: deviceTypeLabel, brand: brandLabel },
    },
    select: { trackingCode: true, ticketId: true },
  });
  if (existing) return { ok: false, reason: "DUPLICATE", trackingCode: existing.trackingCode ?? existing.ticketId };

  if (source.kind === "public") {
    const recent = await prisma.repairTicket.count({
      where: { requester: { universityId: requester.universityId }, createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
    });
    if (recent >= DAILY_LIMIT) return { ok: false, reason: "DAILY_LIMIT" };
  }

  for (let attempt = 1; ; attempt += 1) {
    const trackingCode = generateTrackingCode(now);
    try {
      return await prisma.$transaction(async (tx) => {
        const contact = {
          requesterType: requester.requesterType,
          fullName: requester.fullName,
          phone: requester.phone,
          faculty: requester.faculty ?? null,
          department: requester.department ?? null,
          email: requester.email ?? null,
        };
        const savedRequester = await tx.requester.upsert({
          where: { universityId: requester.universityId },
          update: contact,
          create: { universityId: requester.universityId, ...contact },
          select: { id: true },
        });

        const savedDevice = await tx.device.create({
          data: {
            requesterId: savedRequester.id,
            deviceType: deviceTypeLabel,
            brand: brandLabel,
            model: device.model,
            operatingSystem: device.operatingSystem,
            ram: device.ram,
            storageType: device.storageType,
            ageBand: device.ageBand,
            serialNumber: device.serialNumber ?? null,
          },
          select: { id: true },
        });

        const ticket = await tx.repairTicket.create({
          data: {
            eventId: event.id,
            ticketId: trackingCode,
            trackingCode,
            requesterId: savedRequester.id,
            deviceId: savedDevice.id,
            issueDescription: problem.description,
            accessoriesLeft: device.accessories,
            wipeAllowed: input.wipeAllowed,
            needsPassword: input.needsPassword,
            consentAt: now,
            status: "SUBMITTED",
          },
          select: { id: true },
        });

        await tx.deviceCustody.create({ data: { ticketId: ticket.id, deviceId: savedDevice.id } });
        await tx.repairEvent.create({
          data: {
            ticketId: ticket.id,
            actorId: source.kind === "desk" ? source.actorId : null,
            actorRole: source.kind === "desk" ? source.actorRole : null,
            eventType: "TICKET_CREATED",
            statusTo: "SUBMITTED",
            note: source.kind === "desk" ? "Registered at the desk." : "Request submitted online.",
            metadata: { source: source.kind },
          },
        });

        return { ok: true as const, ticketId: ticket.id, trackingCode, firstName: requester.fullName.split(/\s+/)[0], eventName: event.name };
      });
    } catch (error) {
      if (isUniqueViolation(error) && attempt < MAX_CODE_ATTEMPTS) continue;
      throw error;
    }
  }
}
