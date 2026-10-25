-- Check-in details (ticket #8 / GitHub #14).
ALTER TABLE "repair_tickets" ADD COLUMN "device_password_enc" TEXT;
ALTER TABLE "device_custody"
  ADD COLUMN "id_checked" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "condition_checks" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "accessories_received" TEXT[] DEFAULT ARRAY[]::TEXT[];
