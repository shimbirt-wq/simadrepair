-- Repair record and test checklist (ticket #14 / GitHub #20).
ALTER TABLE "repair_tickets"
  ADD COLUMN "repair_faults" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "repair_actions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "repair_note" TEXT,
  ADD COLUMN "tests_passed" TEXT[] DEFAULT ARRAY[]::TEXT[];
