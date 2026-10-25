import { describe, expect, it } from "vitest";
import { formatEventDates, getRegistrationState, localDay } from "@/lib/events/event-window";

const d = (day: string) => new Date(`${day}T00:00:00.000Z`);
const event = { startsOn: d("2026-11-10"), endsOn: d("2026-11-14"), registrationOpensOn: d("2026-11-01"), registrationClosesOn: d("2026-11-12") };

describe("event registration window", () => {
  it("is open from the opening day to the closing day inclusive, in Mogadishu time", () => {
    expect(getRegistrationState(event, new Date("2026-10-31T20:59:00Z"))).toBe("NOT_YET_OPEN"); // 23:59 in Mogadishu
    expect(getRegistrationState(event, new Date("2026-10-31T21:00:00Z"))).toBe("OPEN"); // 00:00 on 1 Nov
    expect(getRegistrationState(event, new Date("2026-11-12T20:59:00Z"))).toBe("OPEN");
    expect(getRegistrationState(event, new Date("2026-11-12T21:00:00Z"))).toBe("CLOSED");
  });

  it("is NO_EVENT without an active event", () => {
    expect(getRegistrationState(null, new Date())).toBe("NO_EVENT");
  });

  it("uses Mogadishu calendar days", () => {
    expect(localDay(new Date("2026-11-09T22:30:00Z"))).toBe("2026-11-10");
  });

  it("formats date ranges compactly", () => {
    expect(formatEventDates(d("2026-11-10"), d("2026-11-14"))).toBe("10–14 Nov 2026");
    expect(formatEventDates(d("2026-11-28"), d("2026-12-02"))).toBe("28 Nov – 2 Dec 2026");
  });
});

describe("event input", async () => {
  const { eventInputSchema } = await import("@/lib/events/event-schema");
  const valid = { name: "Week 2026", startsOn: "2026-11-10", endsOn: "2026-11-14", registrationOpensOn: "2026-11-01", registrationClosesOn: "2026-11-12", venue: "Main Hall", hours: "8:00–16:00", deskWhatsapp: "061 500 1122", holdDays: "30" };

  it("normalises the desk number and coerces hold days", () => {
    expect(eventInputSchema.parse(valid)).toMatchObject({ deskWhatsapp: "+252615001122", holdDays: 30 });
  });

  it("rejects registration closing after the event or dates out of order", () => {
    expect(eventInputSchema.safeParse({ ...valid, registrationClosesOn: "2026-11-20" }).success).toBe(false);
    expect(eventInputSchema.safeParse({ ...valid, endsOn: "2026-11-01" }).success).toBe(false);
  });
});
