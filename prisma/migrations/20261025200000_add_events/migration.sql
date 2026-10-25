-- Events: one Computer Maintenance Week each (ticket #3 / GitHub #9).
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "starts_on" DATE NOT NULL,
    "ends_on" DATE NOT NULL,
    "registration_opens_on" DATE NOT NULL,
    "registration_closes_on" DATE NOT NULL,
    "venue" TEXT NOT NULL,
    "hours" TEXT NOT NULL,
    "desk_whatsapp" TEXT NOT NULL,
    "hold_days" INTEGER NOT NULL DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "last_tag_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "events_is_active_idx" ON "events"("is_active");
-- At most one active event.
CREATE UNIQUE INDEX "events_single_active_idx" ON "events"("is_active") WHERE "is_active";

-- Existing tickets belong to a closed "Legacy" event.
INSERT INTO "events" ("id", "name", "starts_on", "ends_on", "registration_opens_on", "registration_closes_on", "venue", "hours", "desk_whatsapp", "updated_at")
SELECT 'legacy', 'Legacy tickets', COALESCE(MIN("created_at")::date, CURRENT_DATE), COALESCE(MAX("created_at")::date, CURRENT_DATE),
       COALESCE(MIN("created_at")::date, CURRENT_DATE), COALESCE(MAX("created_at")::date, CURRENT_DATE), 'IT service desk', '—', '—', CURRENT_TIMESTAMP
FROM "repair_tickets";

ALTER TABLE "repair_tickets" ADD COLUMN "event_id" TEXT;
UPDATE "repair_tickets" SET "event_id" = 'legacy';
ALTER TABLE "repair_tickets" ALTER COLUMN "event_id" SET NOT NULL;
CREATE INDEX "repair_tickets_event_id_idx" ON "repair_tickets"("event_id");
ALTER TABLE "repair_tickets" ADD CONSTRAINT "repair_tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
