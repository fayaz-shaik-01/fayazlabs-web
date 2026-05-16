"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { List } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Extract headings from rendered DOM
  useEffect(() => {
    const article = document.querySelector("article");
    if (!article) return;

    const elements = article.querySelectorAll(
      ".prose h2, .prose h3"
    );

    const items: TocItem[] = Array.from(elements).map((el) => {
      // Ensure each heading has an id for scrolling
      if (!el.id) {
        el.id = el.textContent
          ?.toLowerCase()
          .replaceAll(/[^a-z0-9]+/g, "-")
          .replaceAll(/(^-|-$)/g, "") ?? "";
      }
      return {
        id: el.id,
        text: el.textContent ?? "",
        level: el.tagName === "H2" ? 2 : 3,
      };
    });

    setHeadings(items);
  }, []);

  // Track active section with IntersectionObserver
  useEffect(() => {
    if (headings.length === 0) return;

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      // Find the first heading that is intersecting (visible)
      const visibleEntries = entries.filter((e) => e.isIntersecting);
      if (visibleEntries.length > 0) {
        setActiveId(visibleEntries[0].target.id);
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: "-80px 0px -60% 0px",
      threshold: 0,
    });

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [headings]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="hidden xl:block sticky top-32 max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-thin"
    >
      <div className="flex items-center gap-2 mb-4">
        <List className="h-3.5 w-3.5 text-muted-foreground/60" />
        <span className="mono-tag text-muted-foreground/60 text-[10px]">
          On this page
        </span>
      </div>
      <ul className="space-y-1 border-l border-white/[0.06]">
        {headings.map((heading) => (
          <li key={heading.id}>
            <button
              onClick={() => scrollTo(heading.id)}
              className={cn(
                "block w-full text-left text-[0.8125rem] leading-relaxed py-1.5 transition-all duration-200 border-l-2 -ml-px",
                heading.level === 3 ? "pl-6" : "pl-4",
                activeId === heading.id
                  ? "border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground/70 hover:text-foreground/80 hover:border-white/[0.1]"
              )}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
