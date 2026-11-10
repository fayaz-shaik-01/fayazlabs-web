import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { COURSE_BASE } from "@/lib/course/catalog";
import { GLOSSARY } from "@/lib/course/glossary";

export const metadata: Metadata = {
  title: "Glossary · AI Product Testing",
  description: "Plain-language definitions of the terms used across the AI Product Testing course.",
};

export default function GlossaryPage() {
  const letters = Array.from(new Set(GLOSSARY.map((t) => t.term[0].toUpperCase()))).sort();
  return (
    <div className="mx-auto max-w-3xl px-4 pt-28 pb-24 sm:px-6 sm:pt-32">
      <Link href={COURSE_BASE} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft className="size-4" />
        Course
      </Link>
      <p className="eyebrow">Reference</p>
      <h1 className="mt-3 text-display-lg text-foreground">Glossary</h1>
      <p className="mt-4 max-w-[60ch] text-body-lg text-muted-foreground">
        Plain-language definitions of the terms used across the course. {GLOSSARY.length} terms.
      </p>
      <nav aria-label="Jump to letter" className="mt-6 flex flex-wrap gap-1.5 font-mono text-sm">
        {letters.map((l) => (
          <a key={l} href={`#letter-${l}`} className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-card transition-colors hover:border-primary hover:text-primary">
            {l}
          </a>
        ))}
      </nav>
      <dl className="mt-8">
        {GLOSSARY.map((t, i) => {
          const letter = t.term[0].toUpperCase();
          const first = i === 0 || GLOSSARY[i - 1].term[0].toUpperCase() !== letter;
          return (
            <div key={t.id} id={t.id} className="glossary-entry scroll-mt-24 border-t border-border py-5 first:border-t-0">
              {first && <span id={`letter-${letter}`} className="sr-only scroll-mt-24">{letter}</span>}
              <dt className="font-heading text-xl font-bold text-foreground">{t.term}</dt>
              <dd className="mt-1 text-base leading-relaxed text-foreground">{t.definition}</dd>
              {t.see && (
                <dd className="mt-1.5 text-sm text-muted-foreground">
                  <span className="eyebrow mr-2">See</span>
                  {t.see}
                </dd>
              )}
            </div>
          );
        })}
      </dl>
    </div>
  );
}
