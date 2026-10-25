import { BeforeYouCome, Faq, HowItWorks, WhatWeFix } from "@/components/public/home/home-sections";
import { Hero } from "@/components/public/home/hero";
import { LiveNumbers } from "@/components/public/home/live-numbers";
import { PublicLayout } from "@/components/public/public-layout";
import { unstable_cache } from "next/cache";
import { getHomeNumbers } from "@/lib/site/home-numbers";
import { prisma } from "@/lib/db/prisma";
import { getRegistration } from "@/lib/events/event-service";

export const dynamic = "force-dynamic";

// Briefly cached: the home page is the busiest public page during registration.
const cachedHomeNumbers = unstable_cache(() => getHomeNumbers(prisma), ["home-numbers"], { revalidate: 60 });

export default async function HomePage() {
  const [{ state, event }, numbers] = await Promise.all([getRegistration(prisma), cachedHomeNumbers().catch(() => null)]);

  return (
    <PublicLayout width="full">
      <Hero state={state} event={event} />
      {numbers ? <LiveNumbers numbers={numbers} /> : null}
      <HowItWorks />
      <BeforeYouCome />
      <WhatWeFix />
      <Faq holdDays={event?.holdDays ?? 30} />
    </PublicLayout>
  );
}
