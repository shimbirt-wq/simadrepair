import type { RepairStatus } from "@prisma/client";

export const REPAIR_STATUS_FLOW: readonly RepairStatus[] = [
  "REGISTRATION_COMPLETED",
  "DEVICE_RECEIVED",
  "DIAGNOSIS_IN_PROGRESS",
  "REPAIR_IN_PROGRESS",
  "QUALITY_INSPECTION",
  "READY_FOR_COLLECTION",
  "DEVICE_COLLECTED",
] as const;

export const REPAIR_STATUS_LABELS: Record<RepairStatus, string> = {
  REGISTRATION_COMPLETED: "Registration Completed",
  DEVICE_RECEIVED: "Device Received",
  DIAGNOSIS_IN_PROGRESS: "Diagnosis in Progress",
  REPAIR_IN_PROGRESS: "Repair in Progress",
  QUALITY_INSPECTION: "Quality Inspection",
  READY_FOR_COLLECTION: "Ready for Collection",
  DEVICE_COLLECTED: "Device Collected",
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
