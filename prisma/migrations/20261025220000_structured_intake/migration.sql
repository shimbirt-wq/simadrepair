-- Structured intake: required unique university ID, device specs, consent (ticket #5 / GitHub #11).

-- Requester types: Student, Lecturer, Staff ("Other" removed; existing ones become Staff).
CREATE TYPE "RequesterType_new" AS ENUM ('STUDENT', 'LECTURER', 'STAFF');
ALTER TABLE "requesters" ALTER COLUMN "requester_type" TYPE "RequesterType_new"
  USING (CASE WHEN "requester_type"::text = 'OTHER' THEN 'STAFF' ELSE "requester_type"::text END)::"RequesterType_new";
DROP TYPE "RequesterType";
ALTER TYPE "RequesterType_new" RENAME TO "RequesterType";

-- University ID: normalised, required and unique. Legacy rows without one get a placeholder.
UPDATE "requesters" SET "university_id" = upper(regexp_replace("university_id", '[\s-]', '', 'g')) WHERE "university_id" IS NOT NULL;
UPDATE "requesters" SET "university_id" = 'LEGACY' || substr(md5("id"), 1, 10) WHERE "university_id" IS NULL OR "university_id" = '';
UPDATE "requesters" r SET "university_id" = r."university_id" || '-' || substr(md5(r."id"), 1, 6)
  FROM (SELECT "id", row_number() OVER (PARTITION BY "university_id" ORDER BY "created_at") AS n FROM "requesters") d
  WHERE d."id" = r."id" AND d.n > 1;
DROP INDEX IF EXISTS "requesters_university_id_idx";
ALTER TABLE "requesters" ALTER COLUMN "university_id" SET NOT NULL;
CREATE UNIQUE INDEX "requesters_university_id_key" ON "requesters"("university_id");

-- Device specs.
ALTER TABLE "devices" ADD COLUMN "operating_system" TEXT, ADD COLUMN "ram" TEXT, ADD COLUMN "storage_type" TEXT, ADD COLUMN "age_band" TEXT;

-- Ticket intake details.
ALTER TABLE "repair_tickets"
  ADD COLUMN "accessories_left" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "wipe_allowed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "needs_password" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "consent_at" TIMESTAMP(3);
