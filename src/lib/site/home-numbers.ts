import type { PrismaClient } from "@prisma/client";
import { getEventReport } from "@/lib/reports/event-report";
import { latestEvent } from "@/lib/site/volunteers";

export type HomeNumbers = { eventName: string; running: boolean; registered: number; repaired: number; averageRating: number | null; ratings: number };

/** Real numbers for the home page, from the event report (ticket 20). Null when there is nothing to show. */
export async function getHomeNumbers(prisma: PrismaClient, now = new Date()): Promise<HomeNumbers | null> {
  const event = await latestEvent(prisma, now);
  if (!event) return null;
  const report = await getEventReport(prisma, event.id, now);
  if (!report || report.summary.registered === 0) return null;
  const { registered, fixed, averageRating, ratings } = report.summary;
  return { eventName: event.name, running: event.isActive, registered, repaired: fixed, averageRating: ratings > 0 ? averageRating : null, ratings };
}
