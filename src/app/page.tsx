import { BeforeYouCome, Faq, HowItWorks, WhatWeFix } from "@/components/public/home/home-sections";
import { Hero } from "@/components/public/home/hero";
import { PastPrograms } from "@/components/public/home/past-programs";
import { ProgramStoryWithNumbers } from "@/components/public/home/program-band";
import { PublicLayout } from "@/components/public/public-layout";
import { unstable_cache } from "next/cache";
import { getHomeNumbers } from "@/lib/site/home-numbers";
import { prisma } from "@/lib/db/prisma";
import type { Metadata } from "next";
import { getActiveEvent, getRegistration } from "@/lib/events/event-service";
import { formatEventDates } from "@/lib/events/event-window";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const event = await getActiveEvent(prisma).catch(() => null);
  if (!event) return {};
  const title = `${event.name} · ${formatEventDates(event.startsOn, event.endsOn)}`;
  return { title: { absolute: `${title} · SIMADRepair` }, openGraph: { title, description: `Free repair and maintenance at ${event.venue}, ${event.hours}.` } };
}

// Briefly cached: the home page is the busiest public page during registration.
const cachedHomeNumbers = unstable_cache(() => getHomeNumbers(prisma), ["home-numbers"], { revalidate: 60 });

export default async function HomePage() {
  const [{ state, event }, numbers] = await Promise.all([getRegistration(prisma), cachedHomeNumbers().catch(() => null)]);

  return (
    <PublicLayout width="full">
      <Hero state={state} event={event} />
      <HowItWorks />
      <ProgramStoryWithNumbers numbers={numbers} />
      <PastPrograms />
      <BeforeYouCome />
      <WhatWeFix />
      <Faq holdDays={event?.holdDays ?? 30} />
    </PublicLayout>
  );
}
