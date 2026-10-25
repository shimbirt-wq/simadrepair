/** Event dates are calendar days in Mogadishu (UTC+3, no daylight saving). */
export const EVENT_TIME_ZONE = "Africa/Mogadishu";

export type EventDates = {
  startsOn: Date;
  endsOn: Date;
  registrationOpensOn: Date;
  registrationClosesOn: Date;
};

export type RegistrationState = "OPEN" | "NOT_YET_OPEN" | "CLOSED" | "NO_EVENT";

/** YYYY-MM-DD of a moment, as a calendar day in Mogadishu. */
export function localDay(moment: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: EVENT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(moment);
}

/** YYYY-MM-DD of a stored @db.Date value (stored at UTC midnight). */
export function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function getRegistrationState(event: EventDates | null, now: Date): RegistrationState {
  if (!event) return "NO_EVENT";
  const today = localDay(now);
  if (today < dateOnly(event.registrationOpensOn)) return "NOT_YET_OPEN";
  if (today > dateOnly(event.registrationClosesOn)) return "CLOSED";
  return "OPEN";
}

export function isEventRunning(event: EventDates, now: Date) {
  const today = localDay(now);
  return today >= dateOnly(event.startsOn) && today <= dateOnly(event.endsOn);
}

const dayFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const dayYearFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "10–14 Nov 2026" or "28 Nov – 2 Dec 2026". */
export function formatEventDates(startsOn: Date, endsOn: Date) {
  const sameMonth = startsOn.getUTCMonth() === endsOn.getUTCMonth() && startsOn.getUTCFullYear() === endsOn.getUTCFullYear();
  if (sameMonth) return `${startsOn.getUTCDate()}–${dayYearFormat.format(endsOn)}`;
  return `${dayFormat.format(startsOn)} – ${dayYearFormat.format(endsOn)}`;
}

export function formatDay(value: Date) {
  return dayYearFormat.format(value);
}
