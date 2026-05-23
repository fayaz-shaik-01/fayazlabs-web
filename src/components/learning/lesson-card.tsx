"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, FileText, Sparkles } from "lucide-react";
import { DifficultyBadge } from "./difficulty-badge";
import { StatusBadge } from "./status-badge";
import type { LessonMeta } from "@/lib/learning";

interface LessonCardProps {
  readonly lesson: LessonMeta & { phaseId: number };
  readonly index?: number;
  readonly isAuthored?: boolean;
}

export function LessonCard({ lesson, index = 0, isAuthored = false }: LessonCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
    >
      <Link
        href={`/learning/lesson/${lesson.slug}`}
        className="group relative flex items-center gap-4 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-xs font-medium text-muted-foreground/60">
          {lesson.order}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-foreground/90 group-hover:text-primary transition-colors truncate">
              {lesson.title}
            </h4>
            {lesson.premium && (
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-400/70" />
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground/50">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lesson.estimatedMinutes}m
            </span>
            <span className="capitalize">{lesson.type}</span>
            {lesson.languages.length > 0 && (
              <span>{lesson.languages.join(", ")}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isAuthored && (
            <FileText className="h-3.5 w-3.5 text-emerald-400/60" />
          )}
          <DifficultyBadge difficulty={lesson.difficulty} />
          <StatusBadge status={lesson.status} />
        </div>
      </Link>
    </motion.div>
  );
}
