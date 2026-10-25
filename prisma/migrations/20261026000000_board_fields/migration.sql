-- Lead board: tag numbers, priority, repair start time (tickets #7–#8 / GitHub #13–#14).
CREATE TYPE "TicketPriority" AS ENUM ('NORMAL', 'URGENT');
ALTER TABLE "repair_tickets"
  ADD COLUMN "tag_number" INTEGER,
  ADD COLUMN "priority" "TicketPriority" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN "started_at" TIMESTAMP(3);
CREATE UNIQUE INDEX "repair_tickets_event_id_tag_number_key" ON "repair_tickets"("event_id", "tag_number");
UPDATE "repair_tickets" t SET "started_at" = e."created_at"
  FROM (SELECT DISTINCT ON ("ticket_id") "ticket_id", "created_at" FROM "repair_events" WHERE "event_type" = 'REPAIR_STARTED' ORDER BY "ticket_id", "created_at") e
  WHERE e."ticket_id" = t."id";
