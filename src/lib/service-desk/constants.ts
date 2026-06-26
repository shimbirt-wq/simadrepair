import type { CustodyStatus, RequesterType, UserRole } from "@prisma/client";

export const CUSTODY_STATUS_LABELS: Record<CustodyStatus, string> = {
  NOT_RECEIVED: "Not received",
  RECEIVED: "Received",
  IN_REPAIR_ROOM: "In repair room",
  READY_FOR_COLLECTION: "Ready for collection",
  COLLECTED: "Collected",
};

export const REQUESTER_TYPE_LABELS: Record<RequesterType, string> = {
  STUDENT: "Student",
  LECTURER: "Lecturer",
  STAFF: "Staff",
  OTHER: "Other",
};

export const SERVICE_DESK_ROLE_LABELS: Partial<Record<UserRole, string>> = {
  ADMIN: "Administrator",
  LEAD_TECHNICIAN: "Lead Technician",
  TECHNICIAN: "Technician",
};
