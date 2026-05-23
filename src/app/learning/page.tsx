import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { LearningHero } from "@/components/learning/learning-hero";
import { FeaturedLessons } from "@/components/learning/featured-lessons";
import { LearningPathsGrid } from "@/components/learning/learning-paths-grid";
import { TopicCards } from "@/components/learning/topic-cards";
import { PhaseCard } from "@/components/learning/phase-card";
import { SectionHeader } from "@/components/shared/section-header";
import {
  getPhases,
  getTotalLessonCount,
  getTotalHours,
  getFeaturedLessonMetas,
  getLearningPaths,
  getHighlightedTopics,
} from "@/lib/learning";
import { getPublishedLessons } from "@/lib/velite";

const title = "Learning — AI Engineering from First Principles";
const description =
  "A structured roadmap from foundations to production AI systems. Master math, ML, deep learning, LLMs, agents, and more.";
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
  const phases = getPhases();
  const totalLessons = getTotalLessonCount();
  const totalHours = getTotalHours();
  const authoredLessons = getPublishedLessons();
  const authoredSlugs = authoredLessons.map((l) => l.lessonSlug);
  const featuredLessons = getFeaturedLessonMetas();
  const learningPaths = getLearningPaths();
  const topics = getHighlightedTopics();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AI Engineering Learning Platform",
    description,
    url,
    numberOfItems: phases.length,
    itemListElement: phases.map((phase, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `Phase ${phase.id}: ${phase.title}`,
      url: `${siteConfig.url}/learning/phase/${phase.id}`,
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
        totalPhases={phases.length}
        totalLessons={totalLessons}
        totalHours={totalHours}
        authoredCount={authoredLessons.length}
      />

      <div className="mx-auto max-w-6xl px-6 pb-24">
        {/* Featured Lessons */}
        <section className="mb-24">
          <SectionHeader
            label="Featured"
            title="Start Here"
            description="Hand-crafted lessons to kick off your AI engineering journey."
          />
          <FeaturedLessons lessons={featuredLessons} authoredSlugs={authoredSlugs} />
        </section>

        {/* Learning Paths */}
        <section id="paths" className="mb-24">
          <SectionHeader
            label="Paths"
            title="Learning Paths"
            description="Curated tracks for different goals — from career prep to deep specialization."
          />
          <LearningPathsGrid paths={learningPaths} />
        </section>

        {/* Architecture Topics */}
        <section className="mb-24">
          <SectionHeader
            label="Architecture"
            title="Deep Dive Topics"
            description="Production architecture patterns and advanced AI systems."
          />
          <TopicCards topics={topics} />
        </section>

        {/* Full Roadmap */}
        <section id="roadmap">
          <SectionHeader
            label="Roadmap"
            title="Full Curriculum"
            description="20 phases from environment setup to capstone project — every lesson mapped."
          />
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {phases.map((phase, index) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                index={index}
                authoredSlugs={authoredSlugs}
              />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
