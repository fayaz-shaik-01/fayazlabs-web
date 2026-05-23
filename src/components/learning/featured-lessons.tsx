"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Clock, Sparkles } from "lucide-react";
import { DifficultyBadge } from "./difficulty-badge";
import type { LessonMeta } from "@/lib/learning";

interface FeaturedLessonsProps {
  readonly lessons: (LessonMeta & { phaseId: number })[];
  readonly authoredSlugs: string[];
}

export function FeaturedLessons({ lessons, authoredSlugs }: FeaturedLessonsProps) {
  if (lessons.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {lessons.map((lesson, i) => {
        const isAuthored = authoredSlugs.includes(lesson.slug);
        return (
          <motion.div
            key={lesson.slug}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            <Link
              href={`/learning/lesson/${lesson.slug}`}
              className="group relative flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 h-full transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.04] hover:-translate-y-0.5"
            >
              {isAuthored && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[0.6rem] font-semibold text-emerald-400 uppercase tracking-wider">
                    <FileText className="h-2.5 w-2.5" />
                    Authored
                  </span>
                </div>
              )}

              {!isAuthored && lesson.premium && (
                <div className="absolute top-3 right-3">
                  <Sparkles className="h-4 w-4 text-amber-400/60" />
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                <DifficultyBadge difficulty={lesson.difficulty} />
                <span className="text-[0.625rem] font-medium text-muted-foreground/50 uppercase tracking-wider">
                  Phase {lesson.phaseId}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors mb-1.5">
                {lesson.title}
              </h3>

              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground/50">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {lesson.estimatedMinutes}m
                  </span>
                  <span className="capitalize">{lesson.type}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
