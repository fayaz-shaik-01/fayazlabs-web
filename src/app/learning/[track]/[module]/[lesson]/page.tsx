import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, BookOpen } from "lucide-react";
import { MDXContent } from "@/components/mdx-content";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/learning/difficulty-badge";
import { TrackStatusBadge } from "@/components/learning/track-status-badge";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { LessonMentor } from "@/components/learning/lesson-mentor";
import {
  getTrack,
  getModule,
  getLessonStub,
  generateLessonParams,
  getPrevNextLesson,
  getLessonPath,
} from "@/lib/curriculum";
import { getTrackLesson } from "@/lib/velite";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { LessonContentWrapper } from "@/components/learning/lesson-content-wrapper";
import { LessonCompleteToggle } from "@/components/learning/progress-tracker";

interface LessonPageProps {
  readonly params: Promise<{
    track: string;
    module: string;
    lesson: string;
  }>;
}

export async function generateMetadata({
  params,
}: LessonPageProps): Promise<Metadata> {
  const { track: trackSlug, module: moduleSlug, lesson: lessonSlug } = await params;
  const track = getTrack(trackSlug);
  const stub = getLessonStub(trackSlug, moduleSlug, lessonSlug);
  if (!track || !stub) return {};

  const url = `${siteConfig.url}/learning/${trackSlug}/${moduleSlug}/${lessonSlug}`;
  const description = `${stub.title} — ${track.title}. ${stub.difficulty} level, ~${stub.estimatedMinutes} minutes.`;

  return {
    title: `${stub.title} — ${track.title}`,
    description,
    openGraph: {
      title: `${stub.title} — AI Engineering Academy`,
      description,
      url,
      siteName: siteConfig.name,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: stub.title,
      description,
    },
    alternates: { canonical: url },
  };
}

export async function generateStaticParams() {
  return generateLessonParams();
}

export default async function TrackLessonPage({ params }: LessonPageProps) {
  const { track: trackSlug, module: moduleSlug, lesson: lessonSlug } = await params;
  const track = getTrack(trackSlug);
  const mod = getModule(trackSlug, moduleSlug);
  const stub = getLessonStub(trackSlug, moduleSlug, lessonSlug);
  if (!track || !mod || !stub) notFound();

  const authored = getTrackLesson(trackSlug, moduleSlug, lessonSlug);
  const { prev, next } = getPrevNextLesson(trackSlug, moduleSlug, lessonSlug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: stub.title,
    description: `${track.title} > ${mod.title}`,
    url: `${siteConfig.url}/learning/${trackSlug}/${moduleSlug}/${lessonSlug}`,
    educationalLevel: stub.difficulty,
    timeRequired: `PT${stub.estimatedMinutes}M`,
    isPartOf: {
      "@type": "Course",
      name: track.title,
      url: `${siteConfig.url}/learning/${trackSlug}`,
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
        <div className="mx-auto max-w-4xl px-6 pt-32 pb-16 sm:pt-40 sm:pb-24">
          <Link
            href={`/learning/${trackSlug}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "mb-8 gap-1.5"
            )}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {track.title}
          </Link>

          <div className="text-center py-16">
            <div className="flex items-center justify-center gap-2 mb-6">
              <DifficultyBadge difficulty={stub.difficulty} />
              <TrackStatusBadge status={stub.status} />
            </div>
            <h1 className="text-display-lg mb-4 text-glow">{stub.title}</h1>
            <p className="text-body-lg text-muted-foreground mb-2">
              {track.title} &rarr; {mod.title}
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground/60 mb-8">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                ~{stub.estimatedMinutes} min
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {stub.lessonType}
              </span>
            </div>
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12">
              <p className="text-muted-foreground mb-4">
                This lesson is coming soon.
              </p>
              <LessonMentor
                lessonTitle={stub.title}
                lessonSlug={`${trackSlug}/${moduleSlug}/${lessonSlug}`}
                phase={0}
                phaseTitle={track.title}
                tags={track.tags}
                hasAuthoredContent={false}
              />
            </div>
          </div>

          <LessonNavigation prev={prev} next={next} trackSlug={trackSlug} />
        </div>
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
              href={`/learning/${trackSlug}`}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "mb-8 gap-1.5"
              )}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {track.title} &rarr; {mod.title}
            </Link>

            <header className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <DifficultyBadge difficulty={stub.difficulty} />
                <TrackStatusBadge status={stub.status} />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[0.625rem] font-medium text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {stub.estimatedMinutes}m
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[0.625rem] font-medium text-muted-foreground">
                  <BookOpen className="h-3 w-3" />
                  {stub.lessonType}
                </span>
              </div>
              <h1 className="text-display-lg mb-4 text-glow">
                {authored.title}
              </h1>
              <p className="text-body-lg text-muted-foreground mb-4">
                {authored.description}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {authored.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </header>

            <LessonContentWrapper lessonKey={`${trackSlug}|${moduleSlug}|${lessonSlug}`} lessonTitle={stub.title}>
              <div className="prose prose-invert max-w-none">
                <MDXContent code={authored.body} />
              </div>
            </LessonContentWrapper>

            <div className="flex justify-center my-8">
              <LessonCompleteToggle trackSlug={trackSlug} moduleSlug={moduleSlug} lessonSlug={lessonSlug} />
            </div>

            <LessonMentor
              lessonTitle={stub.title}
              lessonSlug={`${trackSlug}/${moduleSlug}/${lessonSlug}`}
              phase={0}
              phaseTitle={track.title}
              tags={authored.tags}
              hasAuthoredContent={true}
            />

            <LessonNavigation prev={prev} next={next} trackSlug={trackSlug} />
          </article>

          <aside className="hidden xl:block">
            <TableOfContents />
          </aside>
        </div>
      </div>
    </>
  );
}

function LessonNavigation({
  prev,
  next,
  trackSlug,
}: Readonly<{
  prev: { moduleSlug: string; lessonSlug: string; title: string } | null;
  next: { moduleSlug: string; lessonSlug: string; title: string } | null;
  trackSlug: string;
}>) {
  if (!prev && !next) return null;
  return (
    <nav className="mt-16 flex items-center justify-between border-t border-white/[0.06] pt-8">
      {prev ? (
        <Link
          href={getLessonPath(trackSlug, prev.moduleSlug, prev.lessonSlug)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="max-w-[200px] truncate">{prev.title}</span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={getLessonPath(trackSlug, next.moduleSlug, next.lessonSlug)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="max-w-[200px] truncate">{next.title}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
