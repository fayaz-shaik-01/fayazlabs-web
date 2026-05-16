import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { BookOpen, Calendar } from "lucide-react";
import { getPublishedNotebooks } from "@/lib/velite";
import { Badge } from "@/components/ui/badge";
import { AnimatedSection } from "@/components/shared/animated-section";
import { SectionHeader } from "@/components/shared/section-header";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Engineering Notebook",
  description:
    "Handwritten architecture notes, system design sketches, and engineering diagrams from my Samsung tablet.",
};

export default function NotebookPage() {
  const notebooks = getPublishedNotebooks();

  return (
    <AnimatedSection>
      <SectionHeader
        label="From My Notebook"
        title="Engineering Notebook"
        description="Architecture notes, system design sketches, and handwritten diagrams exported from my Samsung tablet — where ideas take shape before code."
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {notebooks.map((entry, index) => (
          <Link
            key={entry.slug}
            href={`/${entry.slug}`}
            className="group rounded-[2px] glass-card overflow-hidden transition-all duration-500 hover:shadow-lg hover:shadow-primary/5"
          >
            {entry.images[0] && (
              <div className="relative aspect-[4/3] bg-white/[0.02] border-b border-white/[0.06] overflow-hidden">
                <Image
                  src={entry.images[0]}
                  alt={entry.title}
                  fill
                  priority={index === 0}
                  className="object-contain p-4 transition-transform group-hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                  <div className="inline-flex items-center gap-1.5 rounded-[2px] bg-background/70 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono font-medium text-muted-foreground border border-white/10">
                    <BookOpen className="h-3 w-3" />
                    Handwritten
                  </div>
                </div>
              </div>
            )}

            <div className="p-5">
              <h3 className="text-[0.9375rem] font-semibold tracking-[-0.01em] mb-1.5 group-hover:text-primary transition-colors">
                {entry.title}
              </h3>
              <p className="text-body-sm text-muted-foreground mb-3 line-clamp-2">
                {entry.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {entry.tags.slice(0, 3).map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="h-2.5 w-2.5" />
                  {format(new Date(entry.date), "MMM yyyy")}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {notebooks.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          Notebook entries coming soon.
        </p>
      )}
    </AnimatedSection>
  );
}
