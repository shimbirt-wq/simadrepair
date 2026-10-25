import { describe, expect, it } from "vitest";
import { staffTicketActionSchema } from "@/lib/tickets/action-schema";

describe("staffTicketActionSchema", () => {
  it("accepts a check-in with optional details", () => {
    expect(staffTicketActionSchema.parse({ type: "CHECK_IN", storageLocation: " Shelf B " })).toEqual({ type: "CHECK_IN", condition: null, storageLocation: "Shelf B" });
  });

  it("requires the collector's name at pickup", () => {
    expect(staffTicketActionSchema.safeParse({ type: "PICKUP" }).success).toBe(false);
    expect(staffTicketActionSchema.parse({ type: "PICKUP", collectedByName: "Amina Hassan" })).toMatchObject({ collectedByName: "Amina Hassan", collectedByPhone: null });
  });

  it("requires detail when blocking a repair", () => {
    expect(staffTicketActionSchema.safeParse({ type: "BLOCK", kind: "WAITING_FOR_PARTS", detail: "" }).success).toBe(false);
  });

  it("rejects unknown actions", () => {
    expect(staffTicketActionSchema.safeParse({ type: "DELETE" }).success).toBe(false);
  });
});
