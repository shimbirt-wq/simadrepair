import { randomInt } from "node:crypto";
import { CODE_LENGTH, TRACKING_ALPHABET } from "@/lib/tickets/tracking-code-format";

export { TRACKING_ALPHABET, normalizeTrackingCode } from "@/lib/tickets/tracking-code-format";

export function generateTrackingCode(now = new Date(), pick: (max: number) => number = randomInt) {
  const year = now.getUTCFullYear().toString().slice(-2);
  let suffix = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) suffix += TRACKING_ALPHABET[pick(TRACKING_ALPHABET.length)];
  return `SIM-${year}-${suffix}`;
}
