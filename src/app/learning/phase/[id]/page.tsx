import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, BookOpen } from "lucide-react";
import { DifficultyBadge } from "@/components/learning/difficulty-badge";
import { LessonCard } from "@/components/learning/lesson-card";
import { getPhase, getPhases, getPhaseStats } from "@/lib/learning";
import { getPublishedLessons } from "@/lib/velite";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface PhasePageProps {
  readonly params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PhasePageProps): Promise<Metadata> {
  const { id } = await params;
  const phase = getPhase(Number(id));
  if (!phase) return {};

  const url = `${siteConfig.url}/learning/phase/${id}`;
  return {
    title: `Phase ${phase.id}: ${phase.title} — Learning`,
    description: phase.description,
    openGraph: {
      title: `Phase ${phase.id}: ${phase.title} — AI Engineering Learning`,
      description: phase.description,
      url,
      siteName: siteConfig.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Phase ${phase.id}: ${phase.title}`,
      description: phase.description,
    },
    alternates: { canonical: url },
  };
}

export async function generateStaticParams() {
  return getPhases().map((phase) => ({ id: String(phase.id) }));
}

export default async function PhasePage({ params }: PhasePageProps) {
  const { id } = await params;
  const phase = getPhase(Number(id));
  if (!phase) notFound();

  const stats = getPhaseStats(phase);
  const authoredLessons = getPublishedLessons();
  const authoredSlugs = new Set(authoredLessons.map((l) => l.lessonSlug));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `Phase ${phase.id}: ${phase.title}`,
    description: phase.description,
    url: `${siteConfig.url}/learning/phase/${id}`,
    numberOfLessons: stats.total,
    educationalLevel: phase.difficulty,
    timeRequired: `PT${phase.estimatedHours}H`,
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <div className="mx-auto max-w-4xl px-6 pt-32 pb-16 sm:pt-40 sm:pb-24">
      <Link
        href="/learning"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mb-8 gap-1.5"
        )}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Phases
      </Link>

      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
            {phase.id}
          </span>
          <DifficultyBadge difficulty={phase.difficulty} />
        </div>
        <h1 className="text-display-lg mb-3 text-glow">{phase.title}</h1>
        <p className="text-body-lg text-muted-foreground mb-4">
          {phase.description}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground/60">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            {stats.total} lessons
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            ~{phase.estimatedHours} hours
          </span>
          {stats.completed > 0 && (
            <span className="text-emerald-400/80">
              {stats.completionPercent}% complete
            </span>
          )}
        </div>
      </header>

      <div className="space-y-2">
        {phase.lessons.map((lesson, index) => (
          <LessonCard
            key={lesson.id}
            lesson={{ ...lesson, phaseId: phase.id }}
            index={index}
            isAuthored={authoredSlugs.has(lesson.slug)}
          />
        ))}
      </div>
    </div>
    </>
  );
}
