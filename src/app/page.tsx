import { LandingFeaturesSection } from "@/components/landing/features-section";
import { LandingHero } from "@/components/landing/hero";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingStatisticsSection } from "@/components/landing/statistics-section";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#ffffff_0%,_#f7fbfa_55%,_#f4f8ff_100%)] transition-colors duration-300 dark:bg-[#020617]">
      <LandingNavbar />
      <LandingHero />
      <LandingFeaturesSection />
      <LandingStatisticsSection />
    </main>
  );
}
