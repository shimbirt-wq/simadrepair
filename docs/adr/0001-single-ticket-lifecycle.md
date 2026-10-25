# 1. One ticket lifecycle, decided in one pure module

Date: 2026-10-25 · Status: accepted

## Context
Tickets had two state machines — repair status and custody status — kept in sync by hand in three services. They drifted, and adding outcomes (waiting for parts, action needed, cannot be repaired, cancelled) would have multiplied the combinations.

## Decision
- One `TicketStatus` enum: SUBMITTED, RECEIVED, IN_REPAIR, WAITING_FOR_PARTS, ACTION_NEEDED, CANNOT_REPAIR_PROPOSED, CANNOT_BE_REPAIRED, READY_FOR_PICKUP, COLLECTED, CANCELLED.
- Custody (who received/released the device, where it is, who collected it) is data on the ticket, not a status.
- Assignment is a field, not a status. "To assign" = RECEIVED with no technician.
- `src/lib/tickets/workflow.ts` is the only code that decides whether an action is allowed and what it changes. It is pure: `(ticket, actor, action) → decision`.
- `src/lib/tickets/ticket-service.ts` is the only code that writes `status`: load → decide → write ticket, custody and event in one transaction, guarded by an optimistic status check.
- Staff change tickets through one endpoint: `POST /api/staff/tickets/[ticketId]/actions`.

## Consequences
- Every rule (roles, claim cap, required reasons) is tested without a database.
- Old enum values were renamed in place by migration, so existing data is kept.
- New actions are added in the workflow first, then exposed through the action schema.
