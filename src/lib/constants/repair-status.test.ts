import type { RepairStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { canTransitionRepairStatus, getNextRepairStatus, REPAIR_STATUS_FLOW, REPAIR_STATUS_LABELS } from "./repair-status";

describe("repair status constants", () => {
  it("defines a label for every repair status in the flow", () => {
    for (const status of REPAIR_STATUS_FLOW) {
      expect(REPAIR_STATUS_LABELS[status]).toEqual(expect.any(String));
      expect(REPAIR_STATUS_LABELS[status].length).toBeGreaterThan(0);
    }
  });
});

describe("canTransitionRepairStatus", () => {
  it("accepts every next-step transition in the repair journey", () => {
    for (let index = 0; index < REPAIR_STATUS_FLOW.length - 1; index += 1) {
      expect(canTransitionRepairStatus(REPAIR_STATUS_FLOW[index], REPAIR_STATUS_FLOW[index + 1])).toBe(true);
    }
  });

  it("rejects skipped transitions", () => {
    expect(canTransitionRepairStatus("REGISTRATION_COMPLETED", "DIAGNOSIS_IN_PROGRESS")).toBe(false);
    expect(canTransitionRepairStatus("DEVICE_RECEIVED", "REPAIR_IN_PROGRESS")).toBe(false);
  });

  it("rejects backward transitions", () => {
    expect(canTransitionRepairStatus("DEVICE_RECEIVED", "REGISTRATION_COMPLETED")).toBe(false);
    expect(canTransitionRepairStatus("READY_FOR_COLLECTION", "QUALITY_INSPECTION")).toBe(false);
  });

  it("rejects staying on the same status", () => {
    expect(canTransitionRepairStatus("REPAIR_IN_PROGRESS", "REPAIR_IN_PROGRESS")).toBe(false);
  });

  it("rejects unknown status values defensively", () => {
    const unknownStatus = "UNKNOWN_STATUS" as RepairStatus;

    expect(canTransitionRepairStatus(unknownStatus, "DEVICE_RECEIVED")).toBe(false);
    expect(canTransitionRepairStatus("REGISTRATION_COMPLETED", unknownStatus)).toBe(false);
  });
});

describe("getNextRepairStatus", () => {
  it("returns the next status in the controlled flow", () => {
    expect(getNextRepairStatus("REGISTRATION_COMPLETED")).toBe("DEVICE_RECEIVED");
    expect(getNextRepairStatus("DEVICE_RECEIVED")).toBe("DIAGNOSIS_IN_PROGRESS");
  });

  it("returns null for the final status", () => {
    expect(getNextRepairStatus("DEVICE_COLLECTED")).toBeNull();
  });

  it("returns null for unknown status values defensively", () => {
    expect(getNextRepairStatus("UNKNOWN_STATUS" as RepairStatus)).toBeNull();
  });
});
