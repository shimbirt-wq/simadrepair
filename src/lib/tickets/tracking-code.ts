import { randomInt } from "node:crypto";

/** No 0/O, 1/I/L — easy to read aloud and copy by hand. */
export const TRACKING_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 6;

/** New codes: SIM-26-K7P3QX. Old sequential codes (SIM-2026-000123) still resolve. */
const NEW_CODE = new RegExp(`^SIM-\\d{2}-[${TRACKING_ALPHABET}]{${CODE_LENGTH}}$`);
const LEGACY_CODE = /^SIM-\d{4}-\d{6}$/;

export function generateTrackingCode(now = new Date(), pick: (max: number) => number = randomInt) {
  const year = now.getUTCFullYear().toString().slice(-2);
  let suffix = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) suffix += TRACKING_ALPHABET[pick(TRACKING_ALPHABET.length)];
  return `SIM-${year}-${suffix}`;
}

/** Normalises what a person typed ("sim 26 k7p3qx", "SIM26K7P3QX") or returns null. */
export function normalizeTrackingCode(input: string): string | null {
  const compact = input.toUpperCase().replace(/[\s_-]/g, "");
  const match = compact.match(/^SIM(\d{2})([A-Z0-9]{6})$/) ?? compact.match(/^SIM(\d{4})(\d{6})$/);
  if (!match) return null;
  const code = `SIM-${match[1]}-${match[2]}`;
  return NEW_CODE.test(code) || LEGACY_CODE.test(code) ? code : null;
}
