import { Hero } from "@/components/home/hero";
import { TrustStrip } from "@/components/home/trust-strip";
import { FeaturedBuilds } from "@/components/home/featured-builds";
import { ServicesPreview } from "@/components/home/services-preview";
import { CurrentlyBuilding } from "@/components/home/currently-building";
import { CTASection } from "@/components/home/cta-section";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <FeaturedBuilds />
      <ServicesPreview />
      <CurrentlyBuilding />
      <CTASection />
    </>
  );
}
