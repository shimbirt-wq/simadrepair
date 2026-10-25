import type { TicketStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { boardColumn, isStuck, type BoardTicketFacts } from "@/lib/board/board-rules";

const now = new Date("2026-11-03T09:00:00Z"); // 12:00 in Mogadishu
const hours = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
const facts = (status: TicketStatus, extra: Partial<BoardTicketFacts> = {}): BoardTicketFacts => ({ status, technicianId: null, receivedAt: null, startedAt: null, closedAt: null, ...extra });

describe("board columns", () => {
  it.each([
    [facts("SUBMITTED"), "DROP_OFF"],
    [facts("RECEIVED"), "TO_ASSIGN"],
    [facts("RECEIVED", { technicianId: "t" }), "IN_REPAIR"],
    [facts("IN_REPAIR", { technicianId: "t" }), "IN_REPAIR"],
    [facts("WAITING_FOR_PARTS"), "BLOCKED"],
    [facts("ACTION_NEEDED"), "BLOCKED"],
    [facts("CANNOT_REPAIR_PROPOSED"), "BLOCKED"],
    [facts("READY_FOR_PICKUP"), "READY"],
    [facts("CANNOT_BE_REPAIRED"), "READY"],
    [facts("COLLECTED", { closedAt: hours(2) }), "COLLECTED_TODAY"],
    [facts("COLLECTED", { closedAt: hours(30) }), null],
    [facts("CANCELLED"), null],
  ] as const)("%o → %s", (ticket, column) => {
    expect(boardColumn(ticket, now)).toBe(column);
  });

  it("uses the Mogadishu day for 'collected today'", () => {
    // 22:30 UTC the day before = 01:30 today in Mogadishu
    expect(boardColumn(facts("COLLECTED", { closedAt: new Date("2026-11-02T22:30:00Z") }), now)).toBe("COLLECTED_TODAY");
  });
});

describe("stuck tickets", () => {
  it("flags received + unassigned after one hour", () => {
    expect(isStuck(facts("RECEIVED", { receivedAt: hours(0.9) }), now)).toBe(false);
    expect(isStuck(facts("RECEIVED", { receivedAt: hours(1.1) }), now)).toBe(true);
    expect(isStuck(facts("RECEIVED", { receivedAt: hours(5), technicianId: "t" }), now)).toBe(false);
  });

  it("flags repairs running over a day", () => {
    expect(isStuck(facts("IN_REPAIR", { startedAt: hours(23) }), now)).toBe(false);
    expect(isStuck(facts("IN_REPAIR", { startedAt: hours(25) }), now)).toBe(true);
    expect(isStuck(facts("WAITING_FOR_PARTS", { startedAt: hours(25) }), now)).toBe(true);
    expect(isStuck(facts("READY_FOR_PICKUP", { startedAt: hours(50) }), now)).toBe(false);
  });
});
