import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, BookOpen, ChevronRight } from "lucide-react";
import { DifficultyBadge } from "@/components/learning/difficulty-badge";
import { TrackStatusBadge } from "@/components/learning/track-status-badge";
import {
  getTrack,
  generateTrackParams,
  getTrackStats,
  getModuleStats,
  getLessonPath,
} from "@/lib/curriculum";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface TrackPageProps {
  readonly params: Promise<{ track: string }>;
}

export async function generateMetadata({
  params,
}: TrackPageProps): Promise<Metadata> {
  const { track: trackSlug } = await params;
  const track = getTrack(trackSlug);
  if (!track) return {};

  const url = `${siteConfig.url}/learning/${trackSlug}`;
  return {
    title: `${track.title} — Learning`,
    description: track.description,
    openGraph: {
      title: `${track.title} — AI Engineering Academy`,
      description: track.description,
      url,
      siteName: siteConfig.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: track.title,
      description: track.description,
    },
    alternates: { canonical: url },
  };
}

export async function generateStaticParams() {
  return generateTrackParams();
}

export default async function TrackPage({ params }: TrackPageProps) {
  const { track: trackSlug } = await params;
  const track = getTrack(trackSlug);
  if (!track) notFound();

  const stats = getTrackStats(track);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: track.title,
    description: track.description,
    url: `${siteConfig.url}/learning/${trackSlug}`,
    numberOfLessons: stats.totalLessons,
    educationalLevel: track.difficulty,
    timeRequired: `PT${stats.estimatedHours}H`,
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
          All Tracks
        </Link>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <DifficultyBadge difficulty={track.difficulty} />
          </div>
          <h1 className="text-display-lg mb-3 text-glow">{track.title}</h1>
          <p className="text-body-lg text-muted-foreground mb-4">
            {track.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground/60">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {stats.totalModules} modules &middot; {stats.totalLessons} lessons
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              ~{stats.estimatedHours} hours
            </span>
            <span className="text-emerald-400/80">
              {stats.publishedLessons} authored
            </span>
          </div>
        </header>

        <div className="space-y-6">
          {track.modules.map((mod) => {
            const modStats = getModuleStats(mod);
            return (
              <div
                key={mod.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">{mod.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {mod.description}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground/50">
                    {modStats.totalLessons} lessons &middot; ~
                    {modStats.estimatedMinutes}m
                  </span>
                </div>

                <div className="space-y-1">
                  {mod.lessons.map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={
                        lesson.hasContent
                          ? getLessonPath(trackSlug, mod.slug, lesson.slug)
                          : "#"
                      }
                      className={cn(
                        "flex items-center justify-between rounded-lg px-4 py-3 text-sm transition-colors",
                        lesson.hasContent
                          ? "hover:bg-white/[0.04] cursor-pointer"
                          : "opacity-50 cursor-default"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.04] text-[10px] font-medium text-muted-foreground">
                          {lesson.order}
                        </span>
                        <span
                          className={cn(
                            lesson.hasContent
                              ? "text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {lesson.title}
                        </span>
                        <TrackStatusBadge status={lesson.status} />
                        <DifficultyBadge difficulty={lesson.difficulty} />
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground/50">
                        <span className="text-xs">
                          {lesson.estimatedMinutes}m
                        </span>
                        {lesson.hasContent && (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
