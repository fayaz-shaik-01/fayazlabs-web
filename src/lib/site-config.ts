import { getFeatureFlags, type FeatureName } from "@/lib/features";

export interface NavItem {
  title: string;
  href: string;
  feature?: FeatureName;
}

export const siteConfig = {
  name: "Fayaz Labs",
  title: "Fayaz Labs — Projects, writing and courses by Shaik Fayaz",
  description:
    "Personal site of Shaik Fayaz: projects, writing, and courses on testing AI products.",
  url: "https://fayazlabs.com",
  author: {
    name: "Shaik Fayaz",
    email: "fayazshaik1722@gmail.com",
    phone: "+91 7569920124",
    role: "AI Engineer & Software Engineer",
    location: "India",
  },
  links: {
    github: "https://github.com/fayaz-shaik-01",
    linkedin: "https://www.linkedin.com/in/shaik-fayaz-177526190/",
    twitter: "",
    email: "mailto:fayazshaik1722@gmail.com",
  },
  nav: [
    { title: "Home", href: "/" },
    { title: "Learning", href: "/learning" },
    { title: "Projects", href: "/projects" },
    { title: "Writing", href: "/writing" },
    { title: "Notebook", href: "/notebook" },
    { title: "About", href: "/about" },
    { title: "Contact", href: "/contact" },
    // Optional product routes, shown only when their feature flag is on.
    { title: "Practice", href: "/practice", feature: "practice" },
    { title: "Flashcards", href: "/flashcards", feature: "flashcards" },
    { title: "Formulas", href: "/formulas", feature: "formulas" },
    { title: "Dashboard", href: "/dashboard", feature: "dashboard" },
  ] as readonly NavItem[],
} as const;

/** Nav items with feature-flagged routes removed when their flag is off. */
export function getNav(): { title: string; href: string }[] {
  const flags = getFeatureFlags();
  return siteConfig.nav
    .filter((item) => !item.feature || flags[item.feature])
    .map(({ title, href }) => ({ title, href }));
}

export type SiteConfig = typeof siteConfig;
