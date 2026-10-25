import { timingSafeEqual } from "node:crypto";

/** Scheduled jobs call with `Authorization: Bearer $CRON_SECRET`; no secret configured means no access. */
export function isAuthorizedCron(header: string | null, secret = process.env.CRON_SECRET) {
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
