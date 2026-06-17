import { RepairStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { repairTicketListQuerySchema } from "./repair-ticket-filters";

describe("repairTicketListQuerySchema", () => {
  it("treats an empty status as undefined", () => {
    const result = repairTicketListQuerySchema.safeParse({
      page: "1",
      pageSize: "10",
      status: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBeUndefined();
    }
  });

  it("accepts an omitted status", () => {
    const result = repairTicketListQuerySchema.safeParse({
      page: "1",
      pageSize: "10",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBeUndefined();
    }
  });

  it("accepts a valid status", () => {
    const result = repairTicketListQuerySchema.safeParse({
      page: "1",
      pageSize: "10",
      status: RepairStatus.DEVICE_RECEIVED,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe(RepairStatus.DEVICE_RECEIVED);
    }
  });

  it("rejects an invalid status", () => {
    const result = repairTicketListQuerySchema.safeParse({
      page: "1",
      pageSize: "10",
      status: "NOT_A_REAL_STATUS",
    });

    expect(result.success).toBe(false);
  });
});
