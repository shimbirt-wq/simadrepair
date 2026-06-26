-- Map existing complex workflow values to the MVP workflow before changing enum definitions.
UPDATE "repair_tickets"
SET "status" = 'REPAIR_IN_PROGRESS'
WHERE "status" = 'DIAGNOSIS_IN_PROGRESS';

UPDATE "repair_tickets"
SET "status" = 'READY_FOR_COLLECTION',
    "ready_for_pickup_at" = COALESCE("ready_for_pickup_at", NOW())
WHERE "status" = 'QUALITY_INSPECTION';

UPDATE "repair_events"
SET "event_type" = 'STATUS_CHANGED'
WHERE "event_type" IN ('TRIAGE_UPDATED', 'STUDENT_ACTION_REQUESTED', 'PART_REQUIREMENT_ADDED', 'REPAIR_NOTE_ADDED');

-- Remove tables that are no longer part of the MVP architecture.
DROP TABLE IF EXISTS "notifications";
DROP TABLE IF EXISTS "repair_logs";
DROP TABLE IF EXISTS "technician_activity";

-- Remove complex repair ticket fields and their indexes/relations.
ALTER TABLE "repair_tickets" DROP CONSTRAINT IF EXISTS "repair_tickets_triaged_by_id_fkey";

DROP INDEX IF EXISTS "repair_tickets_triaged_by_id_idx";
DROP INDEX IF EXISTS "repair_tickets_issue_category_idx";
DROP INDEX IF EXISTS "repair_tickets_severity_idx";
DROP INDEX IF EXISTS "repair_tickets_repair_method_idx";
DROP INDEX IF EXISTS "repair_tickets_triaged_at_idx";

ALTER TABLE "repair_tickets"
  DROP COLUMN IF EXISTS "severity",
  DROP COLUMN IF EXISTS "repair_method",
  DROP COLUMN IF EXISTS "issue_category",
  DROP COLUMN IF EXISTS "triage_notes",
  DROP COLUMN IF EXISTS "triaged_by_id",
  DROP COLUMN IF EXISTS "triaged_at",
  DROP COLUMN IF EXISTS "student_action_required",
  DROP COLUMN IF EXISTS "part_requirement";

-- Remove complex custody check-in fields.
ALTER TABLE "device_custody"
  DROP COLUMN IF EXISTS "screen_condition",
  DROP COLUMN IF EXISTS "keyboard_condition",
  DROP COLUMN IF EXISTS "battery_condition",
  DROP COLUMN IF EXISTS "body_condition",
  DROP COLUMN IF EXISTS "check_in_photo_urls",
  DROP COLUMN IF EXISTS "accessories";

-- Replace RepairStatus enum without diagnosis/quality states.
ALTER TYPE "RepairStatus" RENAME TO "RepairStatus_old";

CREATE TYPE "RepairStatus" AS ENUM (
  'REGISTRATION_COMPLETED',
  'DEVICE_RECEIVED',
  'REPAIR_IN_PROGRESS',
  'READY_FOR_COLLECTION',
  'DEVICE_COLLECTED'
);

ALTER TABLE "repair_tickets" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "repair_tickets"
  ALTER COLUMN "status" TYPE "RepairStatus"
  USING ("status"::text::"RepairStatus");
ALTER TABLE "repair_tickets" ALTER COLUMN "status" SET DEFAULT 'REGISTRATION_COMPLETED';

DROP TYPE "RepairStatus_old";

-- Replace RepairEventType enum without removed event kinds.
ALTER TYPE "RepairEventType" RENAME TO "RepairEventType_old";

CREATE TYPE "RepairEventType" AS ENUM (
  'TICKET_CREATED',
  'STATUS_CHANGED',
  'CUSTODY_CHANGED',
  'TECHNICIAN_ASSIGNED',
  'READY_FOR_PICKUP',
  'PICKUP_CONFIRMED',
  'TICKET_CLOSED',
  'TICKET_CANCELLED'
);

ALTER TABLE "repair_events"
  ALTER COLUMN "event_type" TYPE "RepairEventType"
  USING ("event_type"::text::"RepairEventType");

DROP TYPE "RepairEventType_old";

-- Drop enum types that no longer have schema dependencies.
DROP TYPE IF EXISTS "Severity";
DROP TYPE IF EXISTS "RepairMethod";
DROP TYPE IF EXISTS "NotificationChannel";
DROP TYPE IF EXISTS "NotificationStatus";
DROP TYPE IF EXISTS "NotificationEventType";
