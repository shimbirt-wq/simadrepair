import { randomInt } from "node:crypto";
import { Prisma, type PrismaClient, type UserRole } from "@prisma/client";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { publicUserSelect, toPublicUser, type PublicUser } from "@/lib/auth/public-user";
import { getActiveEvent } from "@/lib/events/event-service";
import { normalizeSomaliPhone } from "@/lib/phone";

export const SKILLS = [
  { value: "HARDWARE", label: "Hardware" },
  { value: "SOFTWARE", label: "Software/OS" },
  { value: "NETWORK", label: "Network" },
] as const;
export const SKILL_VALUES = SKILLS.map((skill) => skill.value) as [string, ...string[]];

export function skillLabels(values: string[]) {
  return values.map((value) => SKILLS.find((skill) => skill.value === value)?.label ?? value);
}

const PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function generatePassword(length = 10) {
  return Array.from({ length }, () => PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]).join("");
}

export type BulkRowResult = { line: number; fullName: string; email: string; ok: true; password: string } | { line: number; raw: string; ok: false; error: string };

const rowSchema = z.object({
  fullName: z.string().trim().min(3, "Name is missing."),
  email: z.string().trim().toLowerCase().email("Email is not valid."),
  phone: z.string().optional(),
});

/**
 * Creates technician accounts from pasted lines "Name, email, phone".
 * Each account expires after the active event's last day (AD2).
 * Passwords are generated and returned once; only their hashes are stored.
 */
export async function bulkAddTechnicians(prisma: PrismaClient, text: string, skills: string[] = []): Promise<BulkRowResult[]> {
  const event = await getActiveEvent(prisma);
  const results: BulkRowResult[] = [];
  const lines = text.split(/\r?\n/).map((line) => line.trim());

  for (const [index, raw] of lines.entries()) {
    if (!raw) continue;
    const [fullName = "", email = "", phone = ""] = raw.split(/\s*[,;\t]\s*/);
    const parsed = rowSchema.safeParse({ fullName, email, phone });
    if (!parsed.success) {
      results.push({ line: index + 1, raw, ok: false, error: parsed.error.issues[0].message });
      continue;
    }
    const normalizedPhone = parsed.data.phone ? normalizeSomaliPhone(parsed.data.phone) : null;
    if (parsed.data.phone && !normalizedPhone) {
      results.push({ line: index + 1, raw, ok: false, error: "Phone is not a Somali mobile number." });
      continue;
    }

    const password = generatePassword();
    try {
      await prisma.user.create({
        data: {
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: normalizedPhone,
          role: "TECHNICIAN",
          skills: skills.filter((skill) => SKILL_VALUES.includes(skill)),
          passwordHash: await hashPassword(password),
          accessExpiresOn: event?.endsOn ?? null,
        },
      });
      results.push({ line: index + 1, fullName: parsed.data.fullName, email: parsed.data.email, ok: true, password });
    } catch (error) {
      const duplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      results.push({ line: index + 1, raw, ok: false, error: duplicate ? "This email already has an account." : "Could not create the account." });
    }
  }
  return results;
}

export async function listStaff(prisma: PrismaClient): Promise<PublicUser[]> {
  const users = await prisma.user.findMany({ select: publicUserSelect, orderBy: [{ role: "asc" }, { fullName: "asc" }] });
  return users.map(toPublicUser);
}

export async function getStaffById(prisma: PrismaClient, userId: string): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  return user ? toPublicUser(user) : null;
}

export const staffUpdateSchema = z.object({
  role: z.enum(["ADMIN", "LEAD_TECHNICIAN", "TECHNICIAN"]).optional(),
  isActive: z.boolean().optional(),
  skills: z.array(z.enum(SKILL_VALUES)).optional(),
  /** Renew volunteer access until the active event's last day. */
  renew: z.boolean().optional(),
});

export type StaffUpdate = z.infer<typeof staffUpdateSchema>;

export async function updateStaff(prisma: PrismaClient, actorId: string, userId: string, input: StaffUpdate): Promise<{ ok: true; user: PublicUser } | { ok: false; status: 404 | 409; message: string }> {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, isActive: true } });
  if (!existing) return { ok: false, status: 404, message: "Staff member not found." };

  const losesAdmin = existing.role === "ADMIN" && existing.isActive && ((input.role && input.role !== "ADMIN") || input.isActive === false);
  if (losesAdmin) {
    if (userId === actorId) return { ok: false, status: 409, message: "You can't remove your own admin access." };
    if ((await prisma.user.count({ where: { role: "ADMIN", isActive: true } })) <= 1) return { ok: false, status: 409, message: "At least one admin must stay active." };
  }

  const data: Prisma.UserUpdateInput = {};
  if (input.role) data.role = input.role as UserRole;
  if (typeof input.isActive === "boolean") data.isActive = input.isActive;
  if (input.skills) data.skills = input.skills;
  if (input.role && input.role !== "TECHNICIAN") data.accessExpiresOn = null;
  if (input.renew) {
    const event = await getActiveEvent(prisma);
    if (!event) return { ok: false, status: 409, message: "Activate an event first." };
    data.accessExpiresOn = event.endsOn;
    data.isActive = true;
  }

  const user = await prisma.user.update({ where: { id: userId }, data, select: publicUserSelect });
  return { ok: true, user: toPublicUser(user) };
}
