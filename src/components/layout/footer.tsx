import Link from "next/link";
import { Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import { getProducts } from "@/lib/products";
import { siteConfig, getNav } from "@/lib/site-config";

const learningLinks = [
  { title: "All Products", href: "/learning" },
  ...getProducts().map((p) => ({ title: p.title, href: p.href })),
  { title: "Pricing", href: "/pricing" },
];

const legalLinks = [
  { title: "Terms of Service", href: "/legal/terms" },
  { title: "Privacy Policy", href: "/legal/privacy" },
  { title: "Refund Policy", href: "/legal/refund" },
];

export function Footer() {
  return (
    <footer className="relative mt-20">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-surface-1/60 via-transparent to-transparent pointer-events-none" />
      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <Link
              href="/"
              className="group flex items-center gap-2.5 font-bold text-lg tracking-[-0.02em]"
            >
              <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary via-chart-3 to-accent text-white text-sm font-bold transition-transform group-hover:scale-105">
                F
              </span>
              <span className="text-foreground/80">{siteConfig.name}</span>
            </Link>
            <p className="text-body-sm text-muted-foreground/70 max-w-xs">
              Personal site and courses by Shaik Fayaz.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/50">Pages</h4>
            <div className="flex flex-col gap-2.5">
              {getNav().map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all duration-300"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/50">Learning</h4>
            <div className="flex flex-col gap-2.5">
              {learningLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all duration-300"
                >
                  {item.title}
                </Link>
              ))}
              <a
                href="/rss.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all duration-300"
              >
                RSS Feed
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/50">Connect</h4>
            <div className="flex gap-3">
              <Link
                href={siteConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300"
              >
                <GithubIcon className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link
                href={siteConfig.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300"
              >
                <LinkedinIcon className="h-4 w-4" />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link
                href={siteConfig.links.email}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300"
              >
                <Mail className="h-4 w-4" />
                <span className="sr-only">Email</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights
            reserved.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-1">
            {legalLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
