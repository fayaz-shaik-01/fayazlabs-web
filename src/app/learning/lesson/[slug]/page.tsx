import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, BookOpen } from "lucide-react";
import { MDXContent } from "@/components/mdx-content";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/learning/difficulty-badge";
import { StatusBadge } from "@/components/learning/status-badge";
import { LessonPlaceholder } from "@/components/learning/lesson-placeholder";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { LessonMentor } from "@/components/learning/lesson-mentor";
import { getLessonMeta, getPhase, getAllLessonMetas } from "@/lib/learning";
import { getLessonBySlug } from "@/lib/velite";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface LessonPageProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: LessonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const meta = getLessonMeta(slug);
  if (!meta) return {};

  const phase = getPhase(meta.phaseId);
  const description = `${meta.title} — Phase ${meta.phaseId}: ${phase?.title ?? ""}. ${meta.tags.join(", ")}`;
  const url = `${siteConfig.url}/learning/lesson/${slug}`;
  return {
    title: `${meta.title} — Learning`,
    description,
    openGraph: {
      title: `${meta.title} — AI Engineering Learning`,
      description,
      url,
      siteName: siteConfig.name,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${meta.title} — AI Engineering Learning`,
      description,
    },
    alternates: { canonical: url },
  };
}

export async function generateStaticParams() {
  return getAllLessonMetas().map((lesson) => ({ slug: lesson.slug }));
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug } = await params;
  const meta = getLessonMeta(slug);
  if (!meta) notFound();

  const phase = getPhase(meta.phaseId);
  if (!phase) notFound();

  const authored = getLessonBySlug(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: meta.title,
    description: `Phase ${meta.phaseId}: ${phase.title}. ${meta.tags.join(", ")}`,
    url: `${siteConfig.url}/learning/lesson/${slug}`,
    educationalLevel: meta.difficulty,
    timeRequired: `PT${meta.estimatedMinutes}M`,
    isPartOf: {
      "@type": "Course",
      name: `Phase ${phase.id}: ${phase.title}`,
      url: `${siteConfig.url}/learning/phase/${phase.id}`,
    },
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  if (!authored) {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LessonPlaceholder lesson={meta} phase={phase} />
      </>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReadingProgress />
      <div className="mx-auto max-w-6xl px-6 pt-32 pb-16 sm:pt-40 sm:pb-24">
        <div className="xl:grid xl:grid-cols-[1fr_220px] xl:gap-12">
          <article className="max-w-4xl">
            <Link
              href={`/learning/phase/${phase.id}`}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "mb-8 gap-1.5"
              )}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Phase {phase.id}: {phase.title}
            </Link>

            <header className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <DifficultyBadge difficulty={meta.difficulty} />
                <StatusBadge status={meta.status} />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[0.625rem] font-medium text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {meta.estimatedMinutes}m
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[0.625rem] font-medium text-muted-foreground">
                  <BookOpen className="h-3 w-3" />
                  {meta.type === "build" ? "Build" : "Learn"}
                </span>
              </div>
              <h1 className="text-display-lg mb-4 text-glow">
                {authored.title}
              </h1>
              <p className="text-body-lg text-muted-foreground mb-4">
                {authored.description}
              </p>
              <div className="flex gap-1.5">
                {meta.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </header>

            <div className="prose prose-invert max-w-none">
              <MDXContent code={authored.body} />
            </div>

            <LessonMentor
              lessonTitle={meta.title}
              lessonSlug={slug}
              phase={meta.phaseId}
              phaseTitle={phase.title}
              tags={meta.tags}
              hasAuthoredContent={true}
            />
          </article>

          <aside className="hidden xl:block">
            <TableOfContents />
          </aside>
        </div>
      </div>
    </>
  );
}
