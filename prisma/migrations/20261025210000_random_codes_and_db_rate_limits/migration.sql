-- Random tracking codes replace the sequential counter; rate limits move to
-- the database so they hold across server instances (ticket #4 / GitHub #10).
DROP TABLE "tracking_code_counters";

CREATE TABLE "rate_limit_buckets" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "reset_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);
