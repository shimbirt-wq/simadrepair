import { randomBytes, randomUUID } from "node:crypto";
import type { PhotoKind, Prisma, PrismaClient } from "@prisma/client";
import { EXTENSION, MAX_PHOTO_BYTES, sniffImageType } from "@/lib/photos/image";
import { getPhotoStorage } from "@/lib/photos/storage";

export type SavePhotoResult = { ok: true; id: string; token: string } | { ok: false; message: string };

/** How long an uploaded requester photo waits to be claimed by a submitted form. */
const CLAIM_WINDOW_MS = 2 * 60 * 60 * 1000;

export async function savePhoto(
  prisma: PrismaClient,
  bytes: Uint8Array,
  options: { kind: PhotoKind; ticketId?: string; uploadedById?: string },
): Promise<SavePhotoResult> {
  if (bytes.length === 0) return { ok: false, message: "The photo is empty." };
  if (bytes.length > MAX_PHOTO_BYTES) return { ok: false, message: "Photos must be 5 MB or smaller." };
  const mimeType = sniffImageType(bytes);
  if (!mimeType) return { ok: false, message: "Use a JPG, PNG or WebP photo." };

  const day = new Date().toISOString().slice(0, 10);
  const storagePath = `${options.kind.toLowerCase()}/${day}/${randomUUID()}.${EXTENSION[mimeType]}`;
  await getPhotoStorage().put(storagePath, bytes, mimeType);

  const token = randomBytes(24).toString("base64url");
  const photo = await prisma.ticketPhoto.create({
    data: {
      kind: options.kind,
      ticketId: options.ticketId ?? null,
      storagePath,
      mimeType,
      sizeBytes: bytes.length,
      uploadToken: options.ticketId ? null : token,
      uploadedById: options.uploadedById ?? null,
    },
    select: { id: true },
  });
  return { ok: true, id: photo.id, token };
}

/** Attaches unclaimed requester uploads to a new ticket; unknown or old tokens are ignored. */
export async function claimRequesterPhotos(tx: Prisma.TransactionClient, ticketId: string, tokens: string[], now = new Date()) {
  if (tokens.length === 0) return 0;
  const result = await tx.ticketPhoto.updateMany({
    where: { uploadToken: { in: tokens }, ticketId: null, kind: "REQUESTER", createdAt: { gte: new Date(now.getTime() - CLAIM_WINDOW_MS) } },
    data: { ticketId, uploadToken: null },
  });
  return result.count;
}

export async function readPhoto(prisma: PrismaClient, photoId: string) {
  const photo = await prisma.ticketPhoto.findUnique({ where: { id: photoId }, select: { storagePath: true, mimeType: true, ticketId: true } });
  if (!photo?.ticketId) return null;
  const bytes = await getPhotoStorage().get(photo.storagePath);
  return bytes ? { bytes, mimeType: photo.mimeType } : null;
}

/** Deletes uploads never claimed by a form. */
export async function pruneUnclaimedPhotos(prisma: PrismaClient, now = new Date()) {
  const stale = await prisma.ticketPhoto.findMany({ where: { ticketId: null, createdAt: { lt: new Date(now.getTime() - CLAIM_WINDOW_MS) } }, select: { id: true, storagePath: true } });
  for (const photo of stale) await getPhotoStorage().remove(photo.storagePath);
  await prisma.ticketPhoto.deleteMany({ where: { id: { in: stale.map((photo) => photo.id) } } });
  return stale.length;
}
