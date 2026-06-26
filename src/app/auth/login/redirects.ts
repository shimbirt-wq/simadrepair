import type { UserRole } from "@prisma/client";

export function getSafeNextPath(nextPath?: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return null;
  }

  return nextPath;
}

export function getDefaultPathForRole(role?: UserRole | string | null) {
  if (role === "LEAD_TECHNICIAN") {
    return "/lead";
  }

  if (role === "TECHNICIAN") {
    return "/technician/workspace";
  }

  return "/dashboard";
}

export function getPostLoginRedirectPath(nextPath: string | null, role?: UserRole | string | null) {
  return nextPath ?? getDefaultPathForRole(role);
}
