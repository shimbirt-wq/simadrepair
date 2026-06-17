type RateLimitResult =
  | {
      allowed: true;
      remaining: number;
    }
  | {
      allowed: false;
      retryAfterSeconds: number;
    };

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

export function checkRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      remaining: limit - 1,
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;

  return {
    allowed: true,
    remaining: limit - current.count,
  };
}

export function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function clearRateLimitBucketsForTests() {
  buckets.clear();
}
