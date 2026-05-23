"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, BookOpen, ArrowLeft, MessageSquare, Sparkles, ExternalLink } from "lucide-react";
import { DifficultyBadge } from "./difficulty-badge";
import { StatusBadge } from "./status-badge";
import { LessonMentor } from "./lesson-mentor";
import type { LessonMeta, Phase } from "@/lib/learning";

interface LessonPlaceholderProps {
  readonly lesson: LessonMeta & { phaseId: number };
  readonly phase: Phase;
}

export function LessonPlaceholder({ lesson, phase }: LessonPlaceholderProps) {
  const [showMentor, setShowMentor] = useState(false);
  const prerequisites = lesson.prerequisites.length > 0 ? lesson.prerequisites : null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link
          href={`/learning/phase/${phase.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Phase {phase.id}: {phase.title}
        </Link>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
          <div className="flex items-center gap-2 mb-4">
            <StatusBadge status={lesson.status} />
            <DifficultyBadge difficulty={lesson.difficulty} />
            {lesson.premium && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider text-amber-400">
                <Sparkles className="h-3 w-3" />
                Premium
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            {lesson.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground/60 mb-6">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {lesson.estimatedMinutes} minutes
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {lesson.type === "build" ? "Hands-on Build" : "Conceptual Learn"}
            </span>
            {lesson.languages.length > 0 && (
              <span>{lesson.languages.join(", ")}</span>
            )}
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 mb-8">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Lesson Coming Soon
                </h3>
                <p className="text-sm text-muted-foreground/70">
                  This lesson is part of the learning roadmap and will be authored soon.
                  In the meantime, you can ask the AI Mentor about this topic.
                </p>
              </div>
            </div>
          </div>

          {lesson.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
                Topics Covered
              </h3>
              <div className="flex flex-wrap gap-2">
                {lesson.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-white/[0.04] px-2.5 py-1 text-xs text-muted-foreground/70 border border-white/[0.06]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {prerequisites && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
                Prerequisites
              </h3>
              <div className="flex flex-col gap-1.5">
                {prerequisites.map((prereq) => (
                  <Link
                    key={prereq}
                    href={`/learning/lesson/${prereq}`}
                    className="text-sm text-primary/80 hover:text-primary transition-colors"
                  >
                    {prereq.replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              onClick={() => setShowMentor(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              data-premium="mentor-cta"
            >
              <MessageSquare className="h-4 w-4" />
              Ask AI Mentor About This Topic
            </button>
            <Link
              href={`/learning/phase/${phase.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-white/[0.08]"
            >
              <ExternalLink className="h-4 w-4" />
              Explore Phase {phase.id}
            </Link>
          </div>

          {showMentor && (
            <LessonMentor
              lessonTitle={lesson.title}
              lessonSlug={lesson.slug}
              phase={lesson.phaseId}
              phaseTitle={phase.title}
              tags={lesson.tags}
              hasAuthoredContent={false}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
