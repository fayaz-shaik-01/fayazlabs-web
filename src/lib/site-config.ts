export const siteConfig = {
  name: "Fayaz Labs",
  title: "Fayaz Labs — Building Intelligent Systems",
  description:
    "AI engineering, automation, and technical experiments by Shaik Fayaz. Building intelligent systems, workflow automation, and engineering products.",
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
    { title: "Projects", href: "/projects" },
    { title: "Writing", href: "/writing" },
    { title: "Notebook", href: "/notebook" },
    { title: "Services", href: "/services" },
    { title: "About", href: "/about" },
    { title: "Contact", href: "/contact" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
