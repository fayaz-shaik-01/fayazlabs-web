export const siteConfig = {
  name: "Fayaz Labs",
  title: "Fayaz Labs — Learn Engineering From First Principles",
  description:
    "Structured learning tracks, practice problems, flashcards, and interactive tools for AI engineering and GATE preparation. Built by Shaik Fayaz.",
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
    { title: "Practice", href: "/practice" },
    { title: "Flashcards", href: "/flashcards" },
    { title: "Formulas", href: "/formulas" },
    { title: "Dashboard", href: "/dashboard" },
    { title: "About", href: "/about" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
