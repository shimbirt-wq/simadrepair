import { describe, expect, it } from "vitest";
import { canTechnicianWorkOnTicket, canTransitionCustody, isFinalCustodyStatus } from "@/lib/service-desk/workflow";

describe("canTransitionCustody", () => {
  it("accepts MVP custody transitions", () => {
    expect(canTransitionCustody("NOT_RECEIVED", "RECEIVED")).toBe(true);
    expect(canTransitionCustody("RECEIVED", "IN_REPAIR_ROOM")).toBe(true);
    expect(canTransitionCustody("RECEIVED", "READY_FOR_COLLECTION")).toBe(true);
    expect(canTransitionCustody("IN_REPAIR_ROOM", "READY_FOR_COLLECTION")).toBe(true);
    expect(canTransitionCustody("READY_FOR_COLLECTION", "COLLECTED")).toBe(true);
  });

  it("rejects skipped, backward, and same-status custody transitions", () => {
    expect(canTransitionCustody("NOT_RECEIVED", "IN_REPAIR_ROOM")).toBe(false);
    expect(canTransitionCustody("READY_FOR_COLLECTION", "RECEIVED")).toBe(false);
    expect(canTransitionCustody("RECEIVED", "RECEIVED")).toBe(false);
  });
});

describe("isFinalCustodyStatus", () => {
  it("treats collected as the final custody status", () => {
    expect(isFinalCustodyStatus("COLLECTED")).toBe(true);
    expect(isFinalCustodyStatus("READY_FOR_COLLECTION")).toBe(false);
  });
});

describe("canTechnicianWorkOnTicket", () => {
  it("allows assigned technicians to work on their ticket", () => {
    expect(canTechnicianWorkOnTicket({ id: "tech_1", role: "TECHNICIAN" }, { technicianId: "tech_1" })).toBe(true);
  });

  it("blocks unassigned technicians and allows leads/admins", () => {
    expect(canTechnicianWorkOnTicket({ id: "tech_2", role: "TECHNICIAN" }, { technicianId: "tech_1" })).toBe(false);
    expect(canTechnicianWorkOnTicket({ id: "lead_1", role: "LEAD_TECHNICIAN" }, { technicianId: null })).toBe(true);
    expect(canTechnicianWorkOnTicket({ id: "admin_1", role: "ADMIN" }, { technicianId: null })).toBe(true);
  });
});

