import type { TicketStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { CLAIM_CAP, decide, type WorkflowAction, type WorkflowActor, type WorkflowTicket } from "@/lib/tickets/workflow";
import { TICKET_STATUSES } from "@/lib/tickets/status-display";

const admin: WorkflowActor = { kind: "staff", id: "admin", role: "ADMIN" };
const lead: WorkflowActor = { kind: "staff", id: "lead", role: "LEAD_TECHNICIAN" };
const tech: WorkflowActor = { kind: "staff", id: "tech", role: "TECHNICIAN" };
const otherTech: WorkflowActor = { kind: "staff", id: "other", role: "TECHNICIAN" };
const requester: WorkflowActor = { kind: "requester" };
const system: WorkflowActor = { kind: "system" };

const ticket = (status: TicketStatus, technicianId: string | null = null): WorkflowTicket => ({ status, technicianId });

function expectMove(result: ReturnType<typeof decide>, status: TicketStatus) {
  if (!result.ok) throw new Error(`expected ${status}, got ${result.code}: ${result.message}`);
  expect(result.status).toBe(status);
  return result;
}

describe("ticket workflow — the happy path", () => {
  it("moves a request from submitted to collected", () => {
    let t = ticket("SUBMITTED");
    const steps: Array<[WorkflowActor, WorkflowAction, TicketStatus]> = [
      [lead, { type: "CHECK_IN" }, "RECEIVED"],
      [lead, { type: "ASSIGN", technicianId: "tech" }, "RECEIVED"],
      [tech, { type: "START" }, "IN_REPAIR"],
      [tech, { type: "MARK_READY" }, "READY_FOR_PICKUP"],
      [lead, { type: "PICKUP" }, "COLLECTED"],
    ];
    for (const [actor, action, next] of steps) {
      const result = expectMove(decide(t, actor, action), next);
      t = { status: result.status, technicianId: result.technicianId };
    }
    expect(t.technicianId).toBe("tech");
  });

  it("records the transition on the event", () => {
    const result = expectMove(decide(ticket("SUBMITTED"), lead, { type: "CHECK_IN" }), "RECEIVED");
    expect(result.event).toMatchObject({ type: "CHECKED_IN", statusFrom: "SUBMITTED", statusTo: "RECEIVED" });
  });
});

describe("ticket workflow — roles", () => {
  it.each([
    ["technician checks in", tech, ticket("SUBMITTED"), { type: "CHECK_IN" }],
    ["technician assigns", tech, ticket("RECEIVED"), { type: "ASSIGN", technicianId: "tech" }],
    ["requester assigns", requester, ticket("RECEIVED"), { type: "ASSIGN", technicianId: "tech" }],
    ["another technician starts", otherTech, ticket("RECEIVED", "tech"), { type: "START" }],
    ["another technician marks ready", otherTech, ticket("IN_REPAIR", "tech"), { type: "MARK_READY" }],
    ["technician hands back", tech, ticket("READY_FOR_PICKUP", "tech"), { type: "PICKUP" }],
    ["technician confirms cannot repair", tech, ticket("CANNOT_REPAIR_PROPOSED", "tech"), { type: "CONFIRM_CANNOT_REPAIR" }],
    ["technician cancels", tech, ticket("SUBMITTED"), { type: "CANCEL" }],
    ["admin claims from the pool", admin, ticket("RECEIVED"), { type: "CLAIM", openRepairCount: 0 }],
    ["requester closes the event", requester, ticket("IN_REPAIR", "tech"), { type: "CLOSE_EVENT_ENDED" }],
  ] as Array<[string, WorkflowActor, WorkflowTicket, WorkflowAction]>)("forbids: %s", (_name, actor, t, action) => {
    const result = decide(t, actor, action);
    expect(result).toMatchObject({ ok: false, code: "FORBIDDEN" });
  });

  it("lets the desk work on any ticket on a technician's behalf", () => {
    expectMove(decide(ticket("RECEIVED", "tech"), lead, { type: "START" }), "IN_REPAIR");
    expectMove(decide(ticket("IN_REPAIR", "tech"), admin, { type: "MARK_READY" }), "READY_FOR_PICKUP");
  });
});

describe("ticket workflow — allowed transitions", () => {
  // Every action, tried from every status by an actor allowed to perform it.
  const allowedFrom: Array<[string, WorkflowActor, WorkflowAction, TicketStatus[], (s: TicketStatus) => WorkflowTicket]> = [
    ["CHECK_IN", lead, { type: "CHECK_IN" }, ["SUBMITTED"], (s) => ticket(s)],
    ["ASSIGN", lead, { type: "ASSIGN", technicianId: "tech" }, ["RECEIVED", "IN_REPAIR", "WAITING_FOR_PARTS", "ACTION_NEEDED", "CANNOT_REPAIR_PROPOSED"], (s) => ticket(s)],
    ["CLAIM", tech, { type: "CLAIM", openRepairCount: 0 }, ["RECEIVED"], (s) => ticket(s)],
    ["RELEASE", tech, { type: "RELEASE", reason: "Needs a specialist" }, ["RECEIVED", "IN_REPAIR"], (s) => ticket(s, "tech")],
    ["START", tech, { type: "START" }, ["RECEIVED"], (s) => ticket(s, "tech")],
    ["BLOCK", tech, { type: "BLOCK", kind: "WAITING_FOR_PARTS", detail: "HP 45W charger" }, ["IN_REPAIR"], (s) => ticket(s, "tech")],
    ["RESUME", tech, { type: "RESUME" }, ["WAITING_FOR_PARTS", "ACTION_NEEDED"], (s) => ticket(s, "tech")],
    ["PROPOSE_CANNOT_REPAIR", tech, { type: "PROPOSE_CANNOT_REPAIR", reason: "Motherboard failure" }, ["IN_REPAIR", "WAITING_FOR_PARTS", "ACTION_NEEDED"], (s) => ticket(s, "tech")],
    ["CONFIRM_CANNOT_REPAIR", lead, { type: "CONFIRM_CANNOT_REPAIR" }, ["CANNOT_REPAIR_PROPOSED"], (s) => ticket(s, "tech")],
    ["REJECT_CANNOT_REPAIR", lead, { type: "REJECT_CANNOT_REPAIR" }, ["CANNOT_REPAIR_PROPOSED"], (s) => ticket(s, "tech")],
    ["MARK_READY", tech, { type: "MARK_READY" }, ["IN_REPAIR"], (s) => ticket(s, "tech")],
    ["PICKUP", lead, { type: "PICKUP" }, ["READY_FOR_PICKUP", "CANNOT_BE_REPAIRED"], (s) => ticket(s, "tech")],
    ["CANCEL", requester, { type: "CANCEL" }, ["SUBMITTED"], (s) => ticket(s)],
    ["CLOSE_EVENT_ENDED", system, { type: "CLOSE_EVENT_ENDED" }, ["SUBMITTED", "RECEIVED", "IN_REPAIR", "WAITING_FOR_PARTS", "ACTION_NEEDED", "CANNOT_REPAIR_PROPOSED"], (s) => ticket(s, "tech")],
  ];

  for (const [name, actor, action, allowed, build] of allowedFrom) {
    it.each(TICKET_STATUSES)(`${name} from %s`, (status) => {
      const result = decide(build(status), actor, action);
      expect(result.ok).toBe(allowed.includes(status));
      if (!result.ok) expect(result.code).toBe("INVALID_TRANSITION");
    });
  }
});

describe("ticket workflow — rules", () => {
  it(`caps self-claimed repairs at ${CLAIM_CAP}`, () => {
    expect(decide(ticket("RECEIVED"), tech, { type: "CLAIM", openRepairCount: CLAIM_CAP - 1 }).ok).toBe(true);
    expect(decide(ticket("RECEIVED"), tech, { type: "CLAIM", openRepairCount: CLAIM_CAP })).toMatchObject({ ok: false, code: "INVALID_TRANSITION" });
  });

  it("lets the desk assign beyond the claim cap", () => {
    expectMove(decide(ticket("RECEIVED"), lead, { type: "ASSIGN", technicianId: "tech" }), "RECEIVED");
  });

  it("assigns the claimer and clears the technician on release", () => {
    expect(expectMove(decide(ticket("RECEIVED"), tech, { type: "CLAIM", openRepairCount: 0 }), "RECEIVED").technicianId).toBe("tech");
    expect(expectMove(decide(ticket("IN_REPAIR", "tech"), tech, { type: "RELEASE", reason: "Needs hardware skills" }), "RECEIVED").technicianId).toBeNull();
  });

  it("requires a reason to reassign, release or propose cannot repair", () => {
    expect(decide(ticket("RECEIVED", "tech"), lead, { type: "ASSIGN", technicianId: "other" })).toMatchObject({ ok: false, code: "INVALID_INPUT" });
    expect(decide(ticket("IN_REPAIR", "tech"), tech, { type: "RELEASE", reason: " " })).toMatchObject({ ok: false, code: "INVALID_INPUT" });
    expect(decide(ticket("IN_REPAIR", "tech"), tech, { type: "PROPOSE_CANNOT_REPAIR", reason: "" })).toMatchObject({ ok: false, code: "INVALID_INPUT" });
    expect(decide(ticket("IN_REPAIR", "tech"), tech, { type: "BLOCK", kind: "ACTION_NEEDED", detail: "" })).toMatchObject({ ok: false, code: "INVALID_INPUT" });
  });

  it("records the reason when reassigning", () => {
    const result = expectMove(decide(ticket("IN_REPAIR", "tech"), lead, { type: "ASSIGN", technicianId: "other", reason: "Needs a hardware specialist" }), "IN_REPAIR");
    expect(result.technicianId).toBe("other");
    expect(result.event).toMatchObject({ type: "TECHNICIAN_REASSIGNED", note: "Needs a hardware specialist" });
  });

  it("blocks into the requested state with the detail as the note", () => {
    const result = expectMove(decide(ticket("IN_REPAIR", "tech"), tech, { type: "BLOCK", kind: "ACTION_NEEDED", detail: "Bring the Windows password" }), "ACTION_NEEDED");
    expect(result.event.note).toBe("Bring the Windows password");
  });

  it("cannot start without a technician", () => {
    expect(decide(ticket("RECEIVED"), lead, { type: "START" })).toMatchObject({ ok: false, code: "INVALID_TRANSITION" });
  });

  it("cancels requests not yet dropped off when the event ends", () => {
    expectMove(decide(ticket("SUBMITTED"), system, { type: "CLOSE_EVENT_ENDED" }), "CANCELLED");
    expectMove(decide(ticket("IN_REPAIR", "tech"), lead, { type: "CLOSE_EVENT_ENDED" }), "CANNOT_BE_REPAIRED");
  });
});
