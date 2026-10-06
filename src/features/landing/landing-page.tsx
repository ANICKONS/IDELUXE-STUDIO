import { HeroSection } from "@/features/landing/sections/hero/hero-section";
import { AboutSection } from "@/features/landing/sections/about/about-section";
import { AudienceSection } from "@/features/landing/sections/audience/audience-section";
import { PlatformSection } from "@/features/landing/sections/platform/platform-section";
import { FaqSection } from "@/features/landing/sections/faq/faq-section";
import { CtaSection } from "@/features/landing/sections/cta/cta-section";
import { ReelTheatre } from "@/features/reel";

/**
 * Landing composition. Blocks go top to bottom; to add one, create
 * sections/<name>/<name>-section.tsx, give it the `section` class (and an id from
 * config/routes → landingAnchors if the menu should link to it) and put it here.
 */
export function LandingPage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <AudienceSection />
      <PlatformSection />
      <FaqSection />
      <CtaSection />
      {/* Showreel / «о нас» player: opened by any ReelButton on the page */}
      <ReelTheatre />
    </>
  );
}
