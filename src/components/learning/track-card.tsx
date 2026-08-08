"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock,
  BookOpen,
  ChevronRight,
  Brain,
  Bot,
  Layers,
  Shield,
  Server,
  Cpu,
  GraduationCap,
} from "lucide-react";
import { DifficultyBadge } from "./difficulty-badge";
import type { TrackMeta } from "@/lib/curriculum";
import { getTrackStats } from "@/lib/curriculum";

const iconMap: Record<string, React.ReactNode> = {
  Brain: <Brain className="h-5 w-5" />,
  Bot: <Bot className="h-5 w-5" />,
  Layers: <Layers className="h-5 w-5" />,
  Cpu: <Cpu className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  Server: <Server className="h-5 w-5" />,
  GraduationCap: <GraduationCap className="h-5 w-5" />,
};

interface TrackCardProps {
  readonly track: TrackMeta;
  readonly index: number;
}

export function TrackCard({ track, index }: TrackCardProps) {
  const stats = getTrackStats(track);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <Link
        href={`/learning/${track.slug}`}
        className="group relative flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 h-full transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] hover:-translate-y-0.5"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {iconMap[track.icon] ?? <BookOpen className="h-5 w-5" />}
          </span>
          <DifficultyBadge difficulty={track.difficulty} />
        </div>

        <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors mb-1.5">
          {track.title}
        </h3>
        <p className="text-sm text-muted-foreground/70 mb-4 line-clamp-2">
          {track.description}
        </p>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-3 text-xs text-muted-foreground/50">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {stats.totalModules} modules &middot; {stats.totalLessons} lessons
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~{stats.estimatedHours}h
            </span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
        </div>

        {stats.publishedLessons > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[0.625rem] text-muted-foreground/50 mb-1">
              <span>{stats.publishedLessons} authored</span>
              <span>{Math.round((stats.publishedLessons / stats.totalLessons) * 100)}%</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-primary/60 transition-all duration-500"
                style={{ width: `${Math.round((stats.publishedLessons / stats.totalLessons) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </Link>
    </motion.div>
  );
}
