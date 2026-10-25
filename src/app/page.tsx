import { BeforeYouCome, Faq, HowItWorks, WhatWeFix } from "@/components/public/home/home-sections";
import { Hero } from "@/components/public/home/hero";
import { PublicLayout } from "@/components/public/public-layout";
import { prisma } from "@/lib/db/prisma";
import { getRegistration } from "@/lib/events/event-service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { state, event } = await getRegistration(prisma);

  return (
    <PublicLayout width="full">
      <Hero state={state} event={event} />
      <HowItWorks />
      <BeforeYouCome />
      <WhatWeFix />
      <Faq holdDays={event?.holdDays ?? 30} />
    </PublicLayout>
  );
}
