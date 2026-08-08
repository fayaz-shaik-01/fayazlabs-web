import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { LearningHero } from "@/components/learning/learning-hero";
import { TrackCard } from "@/components/learning/track-card";
import { SectionHeader } from "@/components/shared/section-header";
import { getAllTracks, getGlobalStats } from "@/lib/curriculum";

const title = "Learning — AI Engineering from First Principles";
const description =
  "A structured, track-based curriculum from math foundations to production AI systems. Master LLMs, agents, ML systems, and more.";
const url = `${siteConfig.url}/learning`;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url,
    siteName: siteConfig.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: { canonical: url },
};

export default function LearningPage() {
  const tracks = getAllTracks();
  const stats = getGlobalStats();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AI Engineering Learning Platform",
    description,
    url,
    numberOfItems: tracks.length,
    itemListElement: tracks.map((track, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: track.title,
      url: `${siteConfig.url}/learning/${track.slug}`,
    })),
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <LearningHero
        totalTracks={stats.totalTracks}
        totalLessons={stats.totalLessons}
        totalHours={stats.estimatedHours}
        authoredCount={stats.publishedLessons}
      />

      <div className="mx-auto max-w-6xl px-6 pb-24">
        {/* All Tracks */}
        <section id="tracks">
          <SectionHeader
            label="Tracks"
            title="Learning Tracks"
            description="Structured tracks from foundations to advanced specialization — pick your path."
          />
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map((track, index) => (
              <TrackCard key={track.id} track={track} index={index} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
