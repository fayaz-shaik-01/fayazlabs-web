"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Brain,
  Shield,
  Activity,
  Layers,
  Server,
} from "lucide-react";
import type { HighlightedTopic } from "@/lib/learning";

const iconMap: Record<string, React.ReactNode> = {
  Search: <Search className="h-5 w-5" />,
  Brain: <Brain className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  Activity: <Activity className="h-5 w-5" />,
  Layers: <Layers className="h-5 w-5" />,
  Server: <Server className="h-5 w-5" />,
};

interface TopicCardsProps {
  readonly topics: HighlightedTopic[];
}

export function TopicCards({ topics }: TopicCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {topics.map((topic, i) => (
        <motion.div
          key={topic.title}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.06 }}
        >
          <div className="group flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 h-full transition-all duration-300 hover:border-primary/20 hover:bg-white/[0.04]">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {iconMap[topic.icon] ?? <Layers className="h-5 w-5" />}
              </span>
              <span className="mono-tag text-muted-foreground/50 uppercase">
                {topic.category}
              </span>
            </div>

            <h3 className="text-sm font-semibold text-foreground mb-1">
              {topic.title}
            </h3>
            <p className="text-xs text-muted-foreground/60 mb-4">
              {topic.description}
            </p>

            <div className="mt-auto flex flex-wrap gap-1.5">
              {topic.lessonSlugs.map((slug) => (
                <Link
                  key={slug}
                  href={`/learning/lesson/${slug}`}
                  className="rounded-md bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[0.625rem] text-muted-foreground/60 hover:text-primary hover:border-primary/20 transition-colors"
                >
                  {slug.replaceAll("-", " ")}
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
