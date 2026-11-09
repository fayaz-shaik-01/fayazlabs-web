import type { Metadata } from "next";
import { PricingClient } from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Plans for the Fayaz Labs courses. Start free, upgrade when you want the full path.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 pt-32 pb-24">
      <header className="mb-12 max-w-2xl">
        <p className="mono-tag text-lab-green mb-3">[PRICING]</p>
        <h1 className="text-display-xl text-foreground">Pricing</h1>
        <p className="mt-4 text-body-lg text-muted-foreground">
          Start free. Upgrade when you want the full path.
        </p>
      </header>
      <PricingClient />
    </div>
  );
}
