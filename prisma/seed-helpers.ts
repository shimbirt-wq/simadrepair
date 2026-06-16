import bcrypt from "bcryptjs";
import type { NotificationChannel, NotificationStatus, RepairStatus, UserRole } from "@prisma/client";

export const LOCAL_SEED_PASSWORD = "LocalSeedPassword123!";
export const LOCAL_SEED_EMAIL_DOMAIN = "example.invalid";

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

export type LocalSeedRepairLog = {
  id: string;
  ticketId: string;
  technicianId: string | null;
  status: RepairStatus;
  diagnosis: string | null;
  repairNotes: string | null;
};

export type LocalSeedTechnicianActivity = {
  id: string;
  technicianId: string;
  checkIn: Date;
  checkOut: Date | null;
  repairsCompleted: number;
};

export type LocalSeedNotification = {
  id: string;
  userId: string;
  ticketId: string | null;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: string;
  message: string;
};

export type LocalSeedData = {
  users: LocalSeedUser[];
  devices: LocalSeedDevice[];
  repairTickets: LocalSeedRepairTicket[];
  repairLogs: LocalSeedRepairLog[];
  technicianActivity: LocalSeedTechnicianActivity[];
  notifications: LocalSeedNotification[];
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
      email: `admin@${LOCAL_SEED_EMAIL_DOMAIN}`,
      passwordHash,
      role: "ADMIN",
    },
    {
      id: "seed_technician_001",
      fullName: "Local Technician",
      universityId: "SIMAD-TEST-TECH",
      faculty: "Operations",
      department: "Computer Maintenance",
      phone: "+252610000002",
      email: `technician@${LOCAL_SEED_EMAIL_DOMAIN}`,
      passwordHash,
      role: "TECHNICIAN",
    },
    {
      id: "seed_student_001",
      fullName: "Local Student",
      universityId: "SIMAD-TEST-STUDENT",
      faculty: "Computing",
      department: "Computer Science",
      phone: "+252610000003",
      email: `student@${LOCAL_SEED_EMAIL_DOMAIN}`,
      passwordHash,
      role: "STUDENT",
    },
    {
      id: "seed_lecturer_001",
      fullName: "Local Lecturer",
      universityId: "SIMAD-TEST-LECTURER",
      faculty: "Computing",
      department: "Information Technology",
      phone: "+252610000004",
      email: `lecturer@${LOCAL_SEED_EMAIL_DOMAIN}`,
      passwordHash,
      role: "LECTURER",
    },
  ];

  const devices: LocalSeedDevice[] = [
    {
      id: "seed_device_student_laptop",
      ownerId: "seed_student_001",
      deviceType: "Laptop",
      brand: "Lenovo",
      model: "ThinkPad Test Unit",
      serialNumber: "LOCAL-STUDENT-LAPTOP-001",
    },
    {
      id: "seed_device_lecturer_desktop",
      ownerId: "seed_lecturer_001",
      deviceType: "Desktop",
      brand: "Dell",
      model: "OptiPlex Test Unit",
      serialNumber: "LOCAL-LECTURER-DESKTOP-001",
    },
  ];

  const repairTickets: LocalSeedRepairTicket[] = [
    {
      id: "seed_ticket_student_battery",
      ticketId: "TCK-LOCAL-0001",
      deviceId: "seed_device_student_laptop",
      technicianId: "seed_technician_001",
      issueDescription: "Battery drains quickly during normal class work.",
      status: "DIAGNOSIS_IN_PROGRESS",
    },
    {
      id: "seed_ticket_lecturer_display",
      ticketId: "TCK-LOCAL-0002",
      deviceId: "seed_device_lecturer_desktop",
      technicianId: null,
      issueDescription: "Monitor display does not turn on after startup.",
      status: "REGISTRATION_COMPLETED",
    },
  ];

  const repairLogs: LocalSeedRepairLog[] = [
    {
      id: "seed_log_student_registration",
      ticketId: "seed_ticket_student_battery",
      technicianId: null,
      status: "REGISTRATION_COMPLETED",
      diagnosis: null,
      repairNotes: "Local seed ticket registered for testing.",
    },
    {
      id: "seed_log_student_diagnosis",
      ticketId: "seed_ticket_student_battery",
      technicianId: "seed_technician_001",
      status: "DIAGNOSIS_IN_PROGRESS",
      diagnosis: "Initial battery health check is pending.",
      repairNotes: "Technician assignment created from local seed data.",
    },
    {
      id: "seed_log_lecturer_registration",
      ticketId: "seed_ticket_lecturer_display",
      technicianId: null,
      status: "REGISTRATION_COMPLETED",
      diagnosis: null,
      repairNotes: "Local seed ticket awaiting technician assignment.",
    },
  ];

  const technicianActivity: LocalSeedTechnicianActivity[] = [
    {
      id: "seed_activity_technician_today",
      technicianId: "seed_technician_001",
      checkIn: new Date("2026-01-01T08:00:00.000Z"),
      checkOut: new Date("2026-01-01T16:00:00.000Z"),
      repairsCompleted: 1,
    },
  ];

  const notifications: LocalSeedNotification[] = [
    {
      id: "seed_notification_student_status",
      userId: "seed_student_001",
      ticketId: "seed_ticket_student_battery",
      channel: "DASHBOARD",
      status: "PENDING",
      title: "Diagnosis started",
      message: "Your local seed repair ticket is now in diagnosis.",
    },
    {
      id: "seed_notification_technician_assignment",
      userId: "seed_technician_001",
      ticketId: "seed_ticket_student_battery",
      channel: "DASHBOARD",
      status: "PENDING",
      title: "Ticket assigned",
      message: "A local seed repair ticket has been assigned to you.",
    },
  ];

  return {
    users,
    devices,
    repairTickets,
    repairLogs,
    technicianActivity,
    notifications,
  };
}
