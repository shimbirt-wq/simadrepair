-- One ticket lifecycle replaces RepairStatus + CustodyStatus (ticket #2 / GitHub #8).

-- 1. RepairStatus becomes TicketStatus; existing values are renamed in place so data is kept.
ALTER TYPE "RepairStatus" RENAME TO "TicketStatus";
ALTER TYPE "TicketStatus" RENAME VALUE 'REGISTRATION_COMPLETED' TO 'SUBMITTED';
ALTER TYPE "TicketStatus" RENAME VALUE 'DEVICE_RECEIVED' TO 'RECEIVED';
ALTER TYPE "TicketStatus" RENAME VALUE 'REPAIR_IN_PROGRESS' TO 'IN_REPAIR';
ALTER TYPE "TicketStatus" RENAME VALUE 'READY_FOR_COLLECTION' TO 'READY_FOR_PICKUP';
ALTER TYPE "TicketStatus" RENAME VALUE 'DEVICE_COLLECTED' TO 'COLLECTED';
ALTER TYPE "TicketStatus" ADD VALUE 'WAITING_FOR_PARTS';
ALTER TYPE "TicketStatus" ADD VALUE 'ACTION_NEEDED';
ALTER TYPE "TicketStatus" ADD VALUE 'CANNOT_REPAIR_PROPOSED';
ALTER TYPE "TicketStatus" ADD VALUE 'CANNOT_BE_REPAIRED';
ALTER TYPE "TicketStatus" ADD VALUE 'CANCELLED';
ALTER TABLE "repair_tickets" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';

-- Status strings stored on events follow the rename.
UPDATE "repair_events" SET "status_from" = CASE "status_from"
  WHEN 'REGISTRATION_COMPLETED' THEN 'SUBMITTED' WHEN 'DEVICE_RECEIVED' THEN 'RECEIVED'
  WHEN 'REPAIR_IN_PROGRESS' THEN 'IN_REPAIR' WHEN 'READY_FOR_COLLECTION' THEN 'READY_FOR_PICKUP'
  WHEN 'DEVICE_COLLECTED' THEN 'COLLECTED' ELSE "status_from" END,
  "status_to" = CASE "status_to"
  WHEN 'REGISTRATION_COMPLETED' THEN 'SUBMITTED' WHEN 'DEVICE_RECEIVED' THEN 'RECEIVED'
  WHEN 'REPAIR_IN_PROGRESS' THEN 'IN_REPAIR' WHEN 'READY_FOR_COLLECTION' THEN 'READY_FOR_PICKUP'
  WHEN 'DEVICE_COLLECTED' THEN 'COLLECTED' ELSE "status_to" END;

-- 2. Custody is data on the ticket, not a second state machine.
DROP INDEX IF EXISTS "device_custody_status_idx";
ALTER TABLE "device_custody" DROP COLUMN "status";
ALTER TABLE "device_custody" DROP COLUMN IF EXISTS "pickup_code_verified_at";
ALTER TABLE "repair_events" DROP COLUMN "custody_from";
ALTER TABLE "repair_events" DROP COLUMN "custody_to";
DROP TYPE "CustodyStatus";

-- Pickup is verified with the university ID card, not a code.
ALTER TABLE "repair_tickets" DROP COLUMN IF EXISTS "pickup_code_hash";

-- 3. Devices belong to requesters only; the staff-owner link is gone.
ALTER TABLE "devices" DROP CONSTRAINT IF EXISTS "devices_owner_id_fkey";
DROP INDEX IF EXISTS "devices_owner_id_idx";
ALTER TABLE "devices" DROP COLUMN IF EXISTS "owner_id";

-- 4. Event types for the new actions.
ALTER TYPE "RepairEventType" ADD VALUE 'CHECKED_IN';
ALTER TYPE "RepairEventType" ADD VALUE 'TECHNICIAN_REASSIGNED';
ALTER TYPE "RepairEventType" ADD VALUE 'TICKET_CLAIMED';
ALTER TYPE "RepairEventType" ADD VALUE 'TICKET_RELEASED';
ALTER TYPE "RepairEventType" ADD VALUE 'REPAIR_STARTED';
ALTER TYPE "RepairEventType" ADD VALUE 'REPAIR_BLOCKED';
ALTER TYPE "RepairEventType" ADD VALUE 'REPAIR_RESUMED';
ALTER TYPE "RepairEventType" ADD VALUE 'CANNOT_REPAIR_PROPOSED';
ALTER TYPE "RepairEventType" ADD VALUE 'CANNOT_REPAIR_CONFIRMED';
ALTER TYPE "RepairEventType" ADD VALUE 'CANNOT_REPAIR_REJECTED';
ALTER TYPE "RepairEventType" ADD VALUE 'STEP_UNDONE';
ALTER TYPE "RepairEventType" ADD VALUE 'NOTE_ADDED';
ALTER TYPE "RepairEventType" ADD VALUE 'MESSAGE_SENT';
ALTER TYPE "RepairEventType" ADD VALUE 'RATED';
