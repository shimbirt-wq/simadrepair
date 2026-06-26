CREATE TABLE "tracking_code_counters" (
  "scope" TEXT NOT NULL,
  "last_value" INTEGER NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "tracking_code_counters_pkey" PRIMARY KEY ("scope")
);

INSERT INTO "tracking_code_counters" ("scope", "last_value", "updated_at")
SELECT
  'SIM-' || code_match[1] AS "scope",
  MAX((code_match[2])::INTEGER) AS "last_value",
  NOW() AS "updated_at"
FROM (
  SELECT regexp_match(COALESCE("tracking_code", "ticket_id"), '^SIM-(\d{4})-(\d+)$') AS code_match
  FROM "repair_tickets"
  WHERE COALESCE("tracking_code", "ticket_id") ~ '^SIM-\d{4}-\d+$'
) AS existing_codes
WHERE code_match IS NOT NULL
GROUP BY code_match[1]
ON CONFLICT ("scope") DO UPDATE SET
  "last_value" = GREATEST("tracking_code_counters"."last_value", EXCLUDED."last_value"),
  "updated_at" = NOW();
