import Link from "next/link";
import { Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import { BrandMark } from "@/components/layout/brand-mark";
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

const linkClass =
  "text-sm text-muted-foreground transition-colors hover:text-primary";
const socialClass =
  "inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-heading text-lg font-bold tracking-[-0.01em]"
            >
              <BrandMark />
              <span>{siteConfig.name}</span>
            </Link>
            <p className="max-w-xs text-body-sm text-muted-foreground">
              Personal site and courses by Shaik Fayaz.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="eyebrow">Pages</h4>
            <div className="flex flex-col gap-2.5">
              {getNav().map((item) => (
                <Link key={item.href} href={item.href} className={linkClass}>
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="eyebrow">Learning</h4>
            <div className="flex flex-col gap-2.5">
              {learningLinks.map((item) => (
                <Link key={item.href} href={item.href} className={linkClass}>
                  {item.title}
                </Link>
              ))}
              <a
                href="/rss.xml"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                RSS Feed
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="eyebrow">Connect</h4>
            <div className="flex gap-2.5">
              <Link
                href={siteConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className={socialClass}
              >
                <GithubIcon className="size-4" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link
                href={siteConfig.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className={socialClass}
              >
                <LinkedinIcon className="size-4" />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link href={siteConfig.links.email} className={socialClass}>
                <Mail className="size-4" />
                <span className="sr-only">Email</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights
            reserved.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-1">
            {legalLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="eyebrow !tracking-[0.04em] transition-colors hover:text-primary"
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
