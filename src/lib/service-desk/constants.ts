import type { RequesterType, UserRole } from "@prisma/client";

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
