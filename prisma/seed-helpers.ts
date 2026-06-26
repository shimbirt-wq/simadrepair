import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";

const PASSWORD_MIN_LENGTH = 8;

export const BOOTSTRAP_ADMIN_ID = "seed_admin_abdulsalam";
export const BOOTSTRAP_ADMIN_EMAIL = "abdulsalam.shiikhow@gmail.com";
export const BOOTSTRAP_ADMIN_DEFAULT_PASSWORD = "password";
export const BOOTSTRAP_ADMIN_PASSWORD_ENV = "SEED_ADMIN_PASSWORD";

export const LEGACY_LOCAL_SEED_USER_IDS = [
  "seed_admin_001",
  "seed_technician_001",
  "seed_lead_technician_001",
] as const;

export const LEGACY_LOCAL_SEED_EMAILS = [
  "admin@simadrepair.test",
  "lead@simadrepair.test",
  "tech@simadrepair.test",
] as const;

export type BootstrapAdminSeed = {
  id: string;
  fullName: string;
  universityId: string | null;
  faculty: string | null;
  department: string | null;
  phone: string | null;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
};

export function getBootstrapAdminPassword(env: Record<string, string | undefined> = process.env): string {
  const configuredPassword = env[BOOTSTRAP_ADMIN_PASSWORD_ENV];
  const password = configuredPassword && configuredPassword.trim().length > 0
    ? configuredPassword
    : BOOTSTRAP_ADMIN_DEFAULT_PASSWORD;

  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new Error(`${BOOTSTRAP_ADMIN_PASSWORD_ENV} must be at least ${PASSWORD_MIN_LENGTH} characters.`);
  }

  return password;
}

export async function hashBootstrapAdminPassword(password = getBootstrapAdminPassword()): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function buildBootstrapAdminSeed(passwordHash: string): BootstrapAdminSeed {
  return {
    id: BOOTSTRAP_ADMIN_ID,
    fullName: "Abdulsalam Shiikhow",
    universityId: null,
    faculty: "SIMAD University",
    department: "IT Services",
    phone: null,
    email: BOOTSTRAP_ADMIN_EMAIL,
    passwordHash,
    role: "ADMIN",
    isActive: true,
  };
}
