import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { sniffImageType } from "@/lib/photos/image";
import { claimRequesterPhotos, pruneUnclaimedPhotos, readPhoto, savePhoto } from "@/lib/photos/photo-service";
import { setPhotoStorage, type PhotoStorage } from "@/lib/photos/storage";
import { createSubmittedTicket, createTestPrisma, hasTestDatabase, resetDatabase } from "@/test/db";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
const WEBP = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");

describe("image sniffing", () => {
  it("recognises JPEG, PNG and WebP by their bytes", () => {
    expect(sniffImageType(JPEG)).toBe("image/jpeg");
    expect(sniffImageType(PNG)).toBe("image/png");
    expect(sniffImageType(WEBP)).toBe("image/webp");
  });

  it("rejects anything else, whatever its name", () => {
    expect(sniffImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(sniffImageType(new TextEncoder().encode("%PDF-1.7"))).toBeNull();
  });
});

describe.skipIf(!hasTestDatabase)("photo service (database)", () => {
  const prisma = createTestPrisma();
  const files = new Map<string, Uint8Array>();
  const memory: PhotoStorage = {
    put: async (path, bytes) => void files.set(path, bytes),
    get: async (path) => files.get(path) ?? null,
    remove: async (path) => void files.delete(path),
  };

  beforeEach(async () => {
    files.clear();
    setPhotoStorage(memory);
    await resetDatabase(prisma);
  });
  afterEach(() => setPhotoStorage(null));
  afterAll(() => prisma.$disconnect());

  it("stores a photo privately and only serves it once claimed by a ticket", async () => {
    const saved = await savePhoto(prisma, JPEG, { kind: "REQUESTER" });
    if (!saved.ok) throw new Error(saved.message);
    expect(await readPhoto(prisma, saved.id)).toBeNull();

    const ticket = await createSubmittedTicket(prisma);
    expect(await prisma.$transaction((tx) => claimRequesterPhotos(tx, ticket.id, [saved.token, "unknown-token-xxxx"]))).toBe(1);
    expect(await readPhoto(prisma, saved.id)).toEqual({ bytes: JPEG, mimeType: "image/jpeg" });
  });

  it("refuses non-images and oversize files", async () => {
    expect(await savePhoto(prisma, new TextEncoder().encode("not an image"), { kind: "REQUESTER" })).toMatchObject({ ok: false });
    expect(await savePhoto(prisma, new Uint8Array(6 * 1024 * 1024).fill(0xff), { kind: "REQUESTER" })).toMatchObject({ ok: false });
  });

  it("does not claim a token twice", async () => {
    const saved = await savePhoto(prisma, PNG, { kind: "REQUESTER" });
    if (!saved.ok) throw new Error(saved.message);
    const a = await createSubmittedTicket(prisma);
    const b = await createSubmittedTicket(prisma);
    await prisma.$transaction((tx) => claimRequesterPhotos(tx, a.id, [saved.token]));
    expect(await prisma.$transaction((tx) => claimRequesterPhotos(tx, b.id, [saved.token]))).toBe(0);
  });

  it("prunes uploads never claimed", async () => {
    await savePhoto(prisma, JPEG, { kind: "REQUESTER" });
    expect(await pruneUnclaimedPhotos(prisma, new Date(Date.now() + 3 * 60 * 60 * 1000))).toBe(1);
    expect(files.size).toBe(0);
  });
});
