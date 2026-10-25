-- Structured diagnosis and private photos (ticket #6 / GitHub #12).
ALTER TABLE "repair_tickets"
  DROP COLUMN IF EXISTS "photo_url",
  ADD COLUMN "problem_categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "problem_answers" JSONB,
  ADD COLUMN "started_when" TEXT,
  ADD COLUMN "recent_events" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "error_message" TEXT;

CREATE TYPE "PhotoKind" AS ENUM ('REQUESTER', 'DAMAGE');

CREATE TABLE "ticket_photos" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT,
    "kind" "PhotoKind" NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "upload_token" TEXT,
    "uploaded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_photos_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ticket_photos_upload_token_key" ON "ticket_photos"("upload_token");
CREATE INDEX "ticket_photos_ticket_id_idx" ON "ticket_photos"("ticket_id");
CREATE INDEX "ticket_photos_created_at_idx" ON "ticket_photos"("created_at");
ALTER TABLE "ticket_photos" ADD CONSTRAINT "ticket_photos_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "repair_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
