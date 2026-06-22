import type { UserRole } from "@prisma/client";

export const INTERNAL_USER_ROLES = ["ADMIN", "LEAD_TECHNICIAN", "TECHNICIAN"] as const satisfies readonly UserRole[];

export const ROLE_LABELS: Record<UserRole, string> = {
  TECHNICIAN: "Technician",
  LEAD_TECHNICIAN: "Lead Technician",
  ADMIN: "Admin",
};

export function isAdmin(role: UserRole): boolean {
  return role === "ADMIN";
}

export function isTechnician(role: UserRole): boolean {
  return role === "TECHNICIAN";
}

export function isInternalUserRole(role: UserRole): role is (typeof INTERNAL_USER_ROLES)[number] {
  return INTERNAL_USER_ROLES.includes(role as (typeof INTERNAL_USER_ROLES)[number]);
}

export function canManageTickets(role: UserRole): boolean {
  return role === "ADMIN" || role === "LEAD_TECHNICIAN" || role === "TECHNICIAN";
}
