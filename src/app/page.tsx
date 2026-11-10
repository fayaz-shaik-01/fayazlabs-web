import { LearningHomepageHero } from "@/components/home/learning-hero";
import { AskAi } from "@/components/home/ask-ai";
import { QuickAccess } from "@/components/home/quick-access";
import { FeaturedProducts } from "@/components/home/featured-products";
import { CTASection } from "@/components/home/cta-section";
import { siteConfig } from "@/lib/site-config";
import { tryGetCatalog } from "@/lib/course/catalog";

export default async function Home() {
  // The home page must render even when the course catalog is unreachable.
  const catalog = await tryGetCatalog();
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
          "Projects, writing and hands-on courses on engineering and testing AI products.",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LearningHomepageHero catalog={catalog} />
      <AskAi />
      <QuickAccess />
      <FeaturedProducts />
      <CTASection />
    </>
  );
}
