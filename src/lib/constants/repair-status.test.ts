import type { RepairStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { canTransitionRepairStatus, getNextRepairStatus, REPAIR_STATUS_FLOW, REPAIR_STATUS_LABELS } from "./repair-status";

describe("repair status constants", () => {
  it("defines the simplified MVP repair flow", () => {
    expect(REPAIR_STATUS_FLOW).toEqual([
      "REGISTRATION_COMPLETED",
      "DEVICE_RECEIVED",
      "REPAIR_IN_PROGRESS",
      "READY_FOR_COLLECTION",
      "DEVICE_COLLECTED",
    ]);
  });

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

  it("rejects skipped, backward, same, and unknown transitions", () => {
    expect(canTransitionRepairStatus("REGISTRATION_COMPLETED", "REPAIR_IN_PROGRESS")).toBe(false);
    expect(canTransitionRepairStatus("DEVICE_RECEIVED", "REGISTRATION_COMPLETED")).toBe(false);
    expect(canTransitionRepairStatus("REPAIR_IN_PROGRESS", "REPAIR_IN_PROGRESS")).toBe(false);
    expect(canTransitionRepairStatus("UNKNOWN_STATUS" as RepairStatus, "DEVICE_RECEIVED")).toBe(false);
  });
});

describe("getNextRepairStatus", () => {
  it("returns the next status in the controlled flow", () => {
    expect(getNextRepairStatus("REGISTRATION_COMPLETED")).toBe("DEVICE_RECEIVED");
    expect(getNextRepairStatus("DEVICE_RECEIVED")).toBe("REPAIR_IN_PROGRESS");
    expect(getNextRepairStatus("REPAIR_IN_PROGRESS")).toBe("READY_FOR_COLLECTION");
  });

  it("returns null for final or unknown statuses", () => {
    expect(getNextRepairStatus("DEVICE_COLLECTED")).toBeNull();
    expect(getNextRepairStatus("UNKNOWN_STATUS" as RepairStatus)).toBeNull();
  });
});

