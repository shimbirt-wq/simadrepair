import type { RepairStatus } from "@prisma/client";

export const REPAIR_STATUS_FLOW: readonly RepairStatus[] = [
  "REGISTRATION_COMPLETED",
  "DEVICE_RECEIVED",
  "REPAIR_IN_PROGRESS",
  "READY_FOR_COLLECTION",
  "DEVICE_COLLECTED",
] as const;

export const REPAIR_STATUS_LABELS: Record<RepairStatus, string> = {
  REGISTRATION_COMPLETED: "Submitted",
  DEVICE_RECEIVED: "Received",
  REPAIR_IN_PROGRESS: "In repair",
  READY_FOR_COLLECTION: "Ready for pickup",
  DEVICE_COLLECTED: "Collected",
};

export function canTransitionRepairStatus(current: RepairStatus, next: RepairStatus): boolean {
  const currentIndex = REPAIR_STATUS_FLOW.indexOf(current);
  const nextIndex = REPAIR_STATUS_FLOW.indexOf(next);

  return currentIndex >= 0 && nextIndex === currentIndex + 1;
}

export function getNextRepairStatus(current: RepairStatus): RepairStatus | null {
  const currentIndex = REPAIR_STATUS_FLOW.indexOf(current);

  if (currentIndex < 0 || currentIndex >= REPAIR_STATUS_FLOW.length - 1) {
    return null;
  }

  return REPAIR_STATUS_FLOW[currentIndex + 1];
}
