import { describe, expect, it } from "vitest";
import { isPublicRepairEvent, PublicTrackingValidationError, getPublicTrackingInfo } from "@/lib/service-desk/public-tracking";

describe("public tracking", () => {
  it("allows only public MVP repair events", () => {
    expect(isPublicRepairEvent({ eventType: "TICKET_CREATED" })).toBe(true);
    expect(isPublicRepairEvent({ eventType: "CUSTODY_CHANGED" })).toBe(true);
    expect(isPublicRepairEvent({ eventType: "READY_FOR_PICKUP" })).toBe(true);
  });

  it("rejects invalid tracking code format", async () => {
    await expect(getPublicTrackingInfo("not-a-code")).rejects.toBeInstanceOf(PublicTrackingValidationError);
  });
});

