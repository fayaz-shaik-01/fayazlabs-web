import Link from "next/link";
import { Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import { siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="relative mt-20">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-surface-1/60 via-transparent to-transparent pointer-events-none" />
      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link
              href="/"
              className="group flex items-center gap-2.5 font-bold text-lg tracking-[-0.02em]"
            >
              <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-[2px] bg-gradient-to-br from-primary via-chart-3 to-accent text-white text-sm font-bold transition-transform group-hover:scale-105">
                F
              </span>
              <span className="text-foreground/80">{siteConfig.name}</span>
            </Link>
            <p className="text-body-sm text-muted-foreground/70 max-w-xs">
              AI engineering, automation, and technical experiments.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/50">Pages</h4>
            <div className="flex flex-col gap-2.5">
              {siteConfig.nav.slice(0, 4).map((item) => (
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
            <h4 className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/50">More</h4>
            <div className="flex flex-col gap-2.5">
              {siteConfig.nav.slice(4).map((item) => (
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-[2px] bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300"
              >
                <GithubIcon className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link
                href={siteConfig.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[2px] bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300"
              >
                <LinkedinIcon className="h-4 w-4" />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link
                href={siteConfig.links.email}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[2px] bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300"
              >
                <Mail className="h-4 w-4" />
                <span className="sr-only">Email</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.05] pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights
            reserved.
          </p>
          <p className="text-xs text-muted-foreground/50">
            Built with Next.js, Tailwind CSS, and care.
          </p>
        </div>
      </div>
    </footer>
  );
}
