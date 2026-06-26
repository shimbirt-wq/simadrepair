import { LandingFooter } from "@/components/landing/footer";
import { LandingFeaturesSection } from "@/components/landing/features-section";
import { LandingHowItWorksSection } from "@/components/landing/how-it-works-section";
import { LandingHero } from "@/components/landing/hero";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingStatsStripSection } from "@/components/landing/stats-strip-section";
import { LandingTeamSection } from "@/components/landing/team-section";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <LandingNavbar />
      <LandingHero />
      <LandingHowItWorksSection />
      <LandingFeaturesSection />
      <LandingStatsStripSection />
      <LandingTeamSection />
      <LandingFooter />
    </main>
  );
}
