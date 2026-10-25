import { describe, expect, it } from "vitest";
import { STATUS_DISPLAY, TICKET_STATUSES, getStatusDisplay } from "@/lib/tickets/status-display";

describe("status display", () => {
  it("defines a label, public label, tone and icon for every lifecycle status", () => {
    for (const status of TICKET_STATUSES) {
      expect(STATUS_DISPLAY[status].label).toBeTruthy();
      expect(STATUS_DISPLAY[status].publicLabel).toBeTruthy();
    }
  });

  it("shows an unconfirmed cannot-repair proposal to requesters as still in repair", () => {
    expect(getStatusDisplay("CANNOT_REPAIR_PROPOSED").publicLabel).toBe("In repair");
  });

  it("never uses the error tone for a repair outcome", () => {
    expect(Object.values(STATUS_DISPLAY).map((display) => display.tone)).not.toContain("error");
  });
});
