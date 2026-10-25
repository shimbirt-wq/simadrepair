import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db/prisma";
import { getActiveEvent } from "@/lib/events/event-service";
import { formatEventDates } from "@/lib/events/event-window";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "SIMADRepair · SIMAD University IT Service Desk";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share card with the active event's name, dates and venue (WA7). */
export default async function OpenGraphImage() {
  const event = await getActiveEvent(prisma).catch(() => null);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0F7A45", color: "#FFFFFF", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, fontWeight: 700 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#FFFFFF", color: "#0F7A45", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0F7A45" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </div>
          SIMADRepair
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>{event?.name ?? "SIMAD University IT Service Desk"}</div>
          <div style={{ fontSize: 34, color: "#D7F0E2" }}>{event ? `${formatEventDates(event.startsOn, event.endsOn)} · ${event.venue}` : "Free computer repair for students and staff"}</div>
        </div>
        <div style={{ fontSize: 26, color: "#D7F0E2" }}>Free repair and maintenance · SIMAD University</div>
      </div>
    ),
    size,
  );
}
