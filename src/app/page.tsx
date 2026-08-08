import { LearningHomepageHero } from "@/components/home/learning-hero";
import { QuickAccess } from "@/components/home/quick-access";
import { FeaturedTracks } from "@/components/home/featured-tracks";
import { CTASection } from "@/components/home/cta-section";
import { siteConfig } from "@/lib/site-config";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        publisher: { "@id": `${siteConfig.url}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        url: siteConfig.url,
        founder: {
          "@type": "Person",
          name: siteConfig.author.name,
          jobTitle: siteConfig.author.role,
          url: siteConfig.links.linkedin,
        },
        sameAs: [
          siteConfig.links.github,
          siteConfig.links.linkedin,
        ],
      },
      {
        "@type": "EducationalOrganization",
        name: siteConfig.name,
        url: siteConfig.url,
        description:
          "Structured learning tracks, practice problems, flashcards, and interactive tools for AI engineering and GATE preparation.",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LearningHomepageHero />
      <QuickAccess />
      <FeaturedTracks />
      <CTASection />
    </>
  );
}
