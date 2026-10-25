-- Data retention (AD4): mark erased tickets and keep the faculty for reports.
ALTER TABLE "repair_tickets" ADD COLUMN "anonymized_at" TIMESTAMP(3);
ALTER TABLE "repair_tickets" ADD COLUMN "requester_faculty" TEXT;
CREATE INDEX "repair_tickets_anonymized_at_idx" ON "repair_tickets"("anonymized_at");
