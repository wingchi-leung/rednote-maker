import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingPreviewCard } from "@/components/landing/LandingPreviewCard";
import { LandingCta } from "@/components/landing/LandingCta";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-apple-gray6">
      <LandingHeader />
      <LandingHero />
      <LandingFeatures />
      <LandingPreviewCard />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
