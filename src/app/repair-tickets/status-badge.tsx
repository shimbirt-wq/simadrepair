import type { RepairStatus } from "@prisma/client";
import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";

const statusClassName: Record<RepairStatus, string> = {
  REGISTRATION_COMPLETED: "status-registration",
  DEVICE_RECEIVED: "status-received",
  REPAIR_IN_PROGRESS: "status-repair",
  READY_FOR_COLLECTION: "status-ready",
  DEVICE_COLLECTED: "status-collected",
};

export function StatusBadge({ status }: { status: RepairStatus }) {
  return <span className={`status-badge ${statusClassName[status]}`}>{REPAIR_STATUS_LABELS[status]}</span>;
}
