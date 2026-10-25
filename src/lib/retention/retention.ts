import type { Prisma, PrismaClient } from "@prisma/client";
import { LEGACY_EVENT_ID } from "@/lib/events/event-service";
import { pruneUnclaimedPhotos } from "@/lib/photos/photo-service";
import { getPhotoStorage } from "@/lib/photos/storage";
import { pruneRateLimits } from "@/lib/rate-limit";

/**
 * Data retention (AD4). Personal details of tickets whose event ended more
 * than 12 months ago are erased; anonymous facts (status, dates, device
 * type/brand/model, faults, actions, rating, faculty) stay for reports.
 * Safe to run any number of times: erased tickets are marked and skipped.
 */

export const RETENTION_MONTHS = 12;
const BATCH = 200;

export type RetentionResult = { ticketsAnonymized: number; requestersDeleted: number; photosDeleted: number; unclaimedPhotosDeleted: number; rateLimitsDeleted: number };

export function retentionCutoff(now: Date) {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - RETENTION_MONTHS);
  return cutoff;
}

/** Tickets due for erasure: event ended before the cutoff (old pre-event tickets: created before it). */
export function dueWhere(now: Date): Prisma.RepairTicketWhereInput {
  const cutoff = retentionCutoff(now);
  return {
    anonymizedAt: null,
    OR: [
      { eventId: { not: LEGACY_EVENT_ID }, event: { endsOn: { lt: cutoff } } },
      { eventId: LEGACY_EVENT_ID, createdAt: { lt: cutoff } },
    ],
  };
}

async function anonymizeBatch(prisma: PrismaClient, now: Date) {
  const tickets = await prisma.repairTicket.findMany({
    where: dueWhere(now),
    take: BATCH,
    select: { id: true, deviceId: true, requesterId: true, requester: { select: { faculty: true } }, photos: { select: { id: true, storagePath: true } } },
  });
  if (tickets.length === 0) return null;

  const ids = tickets.map((t) => t.id);
  const photos = tickets.flatMap((t) => t.photos);
  // Files first: if removal fails the rows stay and the next run retries.
  for (const photo of photos) await getPhotoStorage().remove(photo.storagePath);

  const requesterIds = [...new Set(tickets.map((t) => t.requesterId).filter((id): id is string => Boolean(id)))];
  const requestersDeleted = await prisma.$transaction(async (tx) => {
    for (const ticket of tickets) {
      await tx.repairTicket.update({
        where: { id: ticket.id },
        data: {
          anonymizedAt: now,
          requesterFaculty: ticket.requester?.faculty ?? null,
          requesterId: null,
          issueDescription: "",
          errorMessage: null,
          repairNote: null,
          ratingComment: null,
          devicePasswordEnc: null,
        },
      });
    }
    await tx.ticketPhoto.deleteMany({ where: { ticketId: { in: ids } } });
    await tx.device.updateMany({ where: { id: { in: tickets.map((t) => t.deviceId) } }, data: { requesterId: null, serialNumber: null, assetTag: null, description: null } });
    await tx.deviceCustody.updateMany({ where: { ticketId: { in: ids } }, data: { collectedByName: null, collectedByPhone: null, condition: null } });
    // Free text and pickup names in the history may identify people.
    await tx.repairEvent.updateMany({ where: { ticketId: { in: ids } }, data: { note: null, metadata: {} } });
    // A requester goes once none of their tickets remain attached (a newer ticket keeps them).
    const { count } = await tx.requester.deleteMany({ where: { id: { in: requesterIds }, tickets: { none: {} } } });
    return count;
  });

  return { tickets: tickets.length, requestersDeleted, photosDeleted: photos.length };
}

export async function runRetention(prisma: PrismaClient, now = new Date()): Promise<RetentionResult> {
  const result: RetentionResult = { ticketsAnonymized: 0, requestersDeleted: 0, photosDeleted: 0, unclaimedPhotosDeleted: 0, rateLimitsDeleted: 0 };
  for (;;) {
    const batch = await anonymizeBatch(prisma, now);
    if (!batch) break;
    result.ticketsAnonymized += batch.tickets;
    result.requestersDeleted += batch.requestersDeleted;
    result.photosDeleted += batch.photosDeleted;
  }
  result.unclaimedPhotosDeleted = await pruneUnclaimedPhotos(prisma, now);
  result.rateLimitsDeleted = (await pruneRateLimits(prisma, now)).count;
  console.info("[retention]", JSON.stringify(result));
  return result;
}
