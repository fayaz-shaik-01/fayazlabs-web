"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Command } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-all duration-500",
        scrolled
          ? "bg-background/85 border-b border-border shadow-[0_1px_24px_oklch(0_0_0/0.08)] dark:shadow-[0_1px_24px_oklch(0_0_0/0.3)]"
          : "bg-background/60 border-b border-transparent"
      )}
    >
      <nav
        className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5"
      >
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-bold tracking-[-0.02em]"
        >
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-[2px] bg-gradient-to-br from-primary via-chart-3 to-accent text-white text-sm font-bold transition-transform group-hover:scale-110">
            F
            <span className="absolute inset-0 rounded-[2px] bg-gradient-to-br from-primary via-chart-3 to-accent opacity-0 group-hover:opacity-100 blur-md transition-opacity" />
          </span>
          <span className="hidden sm:inline text-foreground/90">{siteConfig.name}</span>
        </Link>

        <div className="hidden md:flex items-center gap-1 rounded-[2px] border border-border bg-muted/30 px-1.5 py-1">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={cn(
                "relative px-3 py-1.5 text-[0.8125rem] font-medium tracking-[-0.006em] transition-all duration-300 rounded-[2px]",
                isActive(pathname, item.href)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive(pathname, item.href) && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute inset-0 rounded-[2px] bg-foreground/[0.06] border border-border"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{item.title}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <UserMenu />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex h-8 w-8 rounded-[2px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() =>
              document.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", metaKey: true })
              )
            }
          >
            <Command className="h-3.5 w-3.5" />
            <span className="sr-only">Command palette</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 rounded-[2px] text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mx-4 mt-2 rounded-[2px] glass-panel overflow-hidden"
          >
            <div className="p-3 flex flex-col gap-0.5">
              {siteConfig.nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className={cn(
                    "px-4 py-2.5 text-sm font-medium rounded-[2px] transition-all",
                    isActive(pathname, item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
