import { describe, expect, it } from "vitest";
import { isPublicRepairEvent, PublicTrackingValidationError, getPublicTrackingInfo } from "@/lib/service-desk/public-tracking";

describe("public tracking", () => {
  it("shows requesters progress events and hides internal ones", () => {
    expect(isPublicRepairEvent({ eventType: "TICKET_CREATED" })).toBe(true);
    expect(isPublicRepairEvent({ eventType: "CHECKED_IN" })).toBe(true);
    expect(isPublicRepairEvent({ eventType: "READY_FOR_PICKUP" })).toBe(true);
    expect(isPublicRepairEvent({ eventType: "CANNOT_REPAIR_PROPOSED" })).toBe(false);
    expect(isPublicRepairEvent({ eventType: "NOTE_ADDED" })).toBe(false);
    expect(isPublicRepairEvent({ eventType: "TECHNICIAN_REASSIGNED" })).toBe(false);
  });

  it("rejects invalid tracking code format", async () => {
    await expect(getPublicTrackingInfo("not-a-code")).rejects.toBeInstanceOf(PublicTrackingValidationError);
  });
});

