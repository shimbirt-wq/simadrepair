import { LandingFooter } from "@/components/landing/footer";
import { LandingFeaturesSection } from "@/components/landing/features-section";
import { LandingHowItWorksSection } from "@/components/landing/how-it-works-section";
import { LandingHero } from "@/components/landing/hero";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingStatsStripSection } from "@/components/landing/stats-strip-section";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white transition-colors duration-300 dark:bg-[#020617]">
      <LandingNavbar />
      <LandingHero />
      <LandingFeaturesSection />
      <LandingHowItWorksSection />
      <LandingStatsStripSection />
      <LandingFooter />
    </main>
  );
}
