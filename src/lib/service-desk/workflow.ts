import type { CustodyStatus, UserRole } from "@prisma/client";

const ALLOWED_CUSTODY_TRANSITIONS: ReadonlyMap<CustodyStatus, readonly CustodyStatus[]> = new Map([
  ["NOT_RECEIVED", ["RECEIVED"]],
  ["RECEIVED", ["IN_REPAIR_ROOM", "READY_FOR_COLLECTION"]],
  ["IN_REPAIR_ROOM", ["READY_FOR_COLLECTION"]],
  ["READY_FOR_COLLECTION", ["COLLECTED"]],
  ["COLLECTED", []],
]);

export type ServiceDeskUser = {
  id: string;
  role: UserRole;
};

export type AssignedServiceDeskTicket = {
  technicianId: string | null;
};

export function canTransitionCustody(from: CustodyStatus, to: CustodyStatus): boolean {
  return ALLOWED_CUSTODY_TRANSITIONS.get(from)?.includes(to) ?? false;
}

export function isFinalCustodyStatus(status: CustodyStatus): boolean {
  return status === "COLLECTED";
}

export function canTechnicianWorkOnTicket(user: ServiceDeskUser, ticket: AssignedServiceDeskTicket): boolean {
  if (user.role === "ADMIN" || user.role === "LEAD_TECHNICIAN") {
    return true;
  }

  return user.role === "TECHNICIAN" && ticket.technicianId === user.id;
}
