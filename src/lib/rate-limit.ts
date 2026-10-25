import type { PrismaClient } from "@prisma/client";

export type RateLimitResult = { allowed: true; remaining: number } | { allowed: false; retryAfterSeconds: number };

/**
 * Fixed-window rate limit stored in the database, so every server instance
 * shares the same counters. One atomic upsert per call.
 */
export async function checkRateLimit(prisma: PrismaClient, key: string, limit: number, windowMs: number, now = new Date()): Promise<RateLimitResult> {
  const resetAt = new Date(now.getTime() + windowMs);
  const [bucket] = await prisma.$queryRaw<Array<{ count: number; reset_at: Date }>>`
    INSERT INTO "rate_limit_buckets" ("key", "count", "reset_at")
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "rate_limit_buckets"."reset_at" <= ${now} THEN 1 ELSE "rate_limit_buckets"."count" + 1 END,
      "reset_at" = CASE WHEN "rate_limit_buckets"."reset_at" <= ${now} THEN ${resetAt} ELSE "rate_limit_buckets"."reset_at" END
    RETURNING "count", "reset_at"`;

  if (bucket.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.reset_at.getTime() - now.getTime()) / 1000)) };
  }

  return { allowed: true, remaining: limit - bucket.count };
}

/** Client IP as set by the hosting proxy (Vercel sets x-real-ip / x-forwarded-for). */
export function getRequestIp(request: Request) {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";

  return "unknown";
}

/** Deletes expired buckets; cheap to call occasionally. */
export function pruneRateLimits(prisma: PrismaClient, now = new Date()) {
  return prisma.rateLimitBucket.deleteMany({ where: { resetAt: { lt: now } } });
}
