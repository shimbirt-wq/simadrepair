-- Delete any users with roles that will be removed
DELETE FROM "users" WHERE "role" IN ('STUDENT', 'LECTURER');

-- Nullify any repair events whose actor_role will be removed
UPDATE "repair_events" SET "actor_role" = NULL WHERE "actor_role" IN ('STUDENT', 'LECTURER');

-- Create replacement enum without STUDENT and LECTURER
CREATE TYPE "UserRole_new" AS ENUM ('TECHNICIAN', 'LEAD_TECHNICIAN', 'ADMIN');

-- Migrate the users.role column
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING "role"::text::"UserRole_new";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'TECHNICIAN'::"UserRole_new";

-- Migrate the repair_events.actor_role column (nullable)
ALTER TABLE "repair_events" ALTER COLUMN "actor_role" TYPE "UserRole_new" USING "actor_role"::text::"UserRole_new";

-- Replace enum
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
