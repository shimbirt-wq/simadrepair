import bcrypt from "bcryptjs";
import type { RepairStatus, UserRole } from "@prisma/client";

export const LOCAL_SEED_PASSWORD = "TestPass123!";
export const LOCAL_SEED_EMAIL_DOMAIN = "simadrepair.test";

export const LOCAL_SEED_EMAILS = {
  admin: `admin@${LOCAL_SEED_EMAIL_DOMAIN}`,
  leadTechnician: `lead@${LOCAL_SEED_EMAIL_DOMAIN}`,
  technician: `tech@${LOCAL_SEED_EMAIL_DOMAIN}`,
} as const;

export const LOCAL_SEED_LOGIN_ACCOUNTS = [
  { label: "Admin", role: "ADMIN", email: LOCAL_SEED_EMAILS.admin },
  { label: "Lead technician", role: "LEAD_TECHNICIAN", email: LOCAL_SEED_EMAILS.leadTechnician },
  { label: "Technician", role: "TECHNICIAN", email: LOCAL_SEED_EMAILS.technician },
] as const satisfies ReadonlyArray<{ label: string; role: UserRole; email: string }>;

export type LocalSeedUser = {
  id: string;
  fullName: string;
  universityId: string;
  faculty: string;
  department: string;
  phone: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
};

export type LocalSeedDevice = {
  id: string;
  ownerId: string;
  deviceType: string;
  brand: string;
  model: string;
  serialNumber: string;
};

export type LocalSeedRepairTicket = {
  id: string;
  ticketId: string;
  deviceId: string;
  technicianId: string | null;
  issueDescription: string;
  status: RepairStatus;
};

export type LocalSeedData = {
  users: LocalSeedUser[];
  devices: LocalSeedDevice[];
  repairTickets: LocalSeedRepairTicket[];
};

export async function hashLocalSeedPassword(password = LOCAL_SEED_PASSWORD): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function buildLocalSeedData(passwordHash: string): LocalSeedData {
  const users: LocalSeedUser[] = [
    {
      id: "seed_admin_001",
      fullName: "Local Admin",
      universityId: "SIMAD-TEST-ADMIN",
      faculty: "Operations",
      department: "IT Services",
      phone: "+252610000001",
      email: LOCAL_SEED_EMAILS.admin,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
    {
      id: "seed_technician_001",
      fullName: "Local Technician",
      universityId: "SIMAD-TEST-TECH",
      faculty: "Operations",
      department: "Computer Maintenance",
      phone: "+252610000002",
      email: LOCAL_SEED_EMAILS.technician,
      passwordHash,
      role: "TECHNICIAN",
      isActive: true,
    },
    {
      id: "seed_lead_technician_001",
      fullName: "Local Lead Technician",
      universityId: "SIMAD-TEST-LEAD-TECH",
      faculty: "Operations",
      department: "Computer Maintenance",
      phone: "+252610000005",
      email: LOCAL_SEED_EMAILS.leadTechnician,
      passwordHash,
      role: "LEAD_TECHNICIAN",
      isActive: true,
    },
  ];

  const devices: LocalSeedDevice[] = [];

  const repairTickets: LocalSeedRepairTicket[] = [];

  return {
    users,
    devices,
    repairTickets,
  };
}
