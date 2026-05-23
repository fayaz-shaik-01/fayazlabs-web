"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, BookOpen, ChevronRight } from "lucide-react";
import { DifficultyBadge } from "./difficulty-badge";
import type { Phase } from "@/lib/learning";
import { getPhaseStats } from "@/lib/learning";

interface PhaseCardProps {
  readonly phase: Phase;
  readonly index: number;
  readonly authoredSlugs?: string[];
}

export function PhaseCard({ phase, index, authoredSlugs = [] }: PhaseCardProps) {
  const stats = getPhaseStats(phase);
  const authoredCount = phase.lessons.filter((l) =>
    authoredSlugs.includes(l.slug)
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        href={`/learning/phase/${phase.id}`}
        className="group relative flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] hover:-translate-y-0.5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
              {phase.id}
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {phase.title}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground/70 line-clamp-1">
                {phase.description}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground/60">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {stats.total} lessons
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {phase.estimatedHours}h
          </span>
          <DifficultyBadge difficulty={phase.difficulty} />
        </div>

        {(authoredCount > 0 || stats.completed > 0) && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[0.625rem] text-muted-foreground/50 mb-1">
              <span>{authoredCount} authored</span>
              <span>{stats.completionPercent}%</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-primary/60 transition-all duration-500"
                style={{ width: `${stats.completionPercent}%` }}
              />
            </div>
          </div>
        )}
      </Link>
    </motion.div>
  );
}
