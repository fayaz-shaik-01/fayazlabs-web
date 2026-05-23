"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Bot,
  Search,
  Server,
  Target,
  Clock,
  BookOpen,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { DifficultyBadge } from "./difficulty-badge";
import type { LearningPath } from "@/lib/learning";

const iconMap: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap className="h-5 w-5" />,
  Bot: <Bot className="h-5 w-5" />,
  Search: <Search className="h-5 w-5" />,
  Server: <Server className="h-5 w-5" />,
  Target: <Target className="h-5 w-5" />,
};

interface LearningPathsGridProps {
  readonly paths: LearningPath[];
}

export function LearningPathsGrid({ paths }: LearningPathsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {paths.map((path, i) => (
        <motion.div
          key={path.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.06 }}
        >
          <div className="group relative flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 h-full transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]">
            {path.premium && (
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[0.6rem] font-semibold text-amber-400 uppercase tracking-wider">
                  <Sparkles className="h-2.5 w-2.5" />
                  Premium
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {iconMap[path.icon] ?? <BookOpen className="h-5 w-5" />}
              </span>
              <DifficultyBadge difficulty={path.difficulty} />
            </div>

            <h3 className="text-base font-semibold text-foreground mb-1.5">
              {path.title}
            </h3>
            <p className="text-sm text-muted-foreground/70 mb-4 line-clamp-2">
              {path.description}
            </p>

            <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/[0.04]">
              <div className="flex items-center gap-3 text-xs text-muted-foreground/50">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {path.phaseIds.length} phases
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  ~{path.estimatedHours}h
                </span>
              </div>
              <Link
                href={`/learning/phase/${path.phaseIds[0]}`}
                className="text-xs font-medium text-primary/70 hover:text-primary transition-colors flex items-center gap-1"
              >
                Explore
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
