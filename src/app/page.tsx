import { LandingFooter } from "@/components/landing/footer";
import { LandingFeaturesSection } from "@/components/landing/features-section";
import { LandingHowItWorksSection } from "@/components/landing/how-it-works-section";
import { LandingHero } from "@/components/landing/hero";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingStatsStripSection } from "@/components/landing/stats-strip-section";
import { LandingTeamSection } from "@/components/landing/team-section";
import { LandingCtaBanner } from "@/components/landing/cta-banner";

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: "#050D1B" }}>
      <LandingNavbar />
      <LandingHero />
      <LandingStatsStripSection />
      <LandingHowItWorksSection />
      <LandingFeaturesSection />
      <LandingTeamSection />
      <LandingCtaBanner />
      <LandingFooter />
    </main>
  );
}
