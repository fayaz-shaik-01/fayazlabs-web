"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const ease = [0.16, 1, 0.3, 1] as const;

interface LearningHeroProps {
  readonly totalPhases: number;
  readonly totalLessons: number;
  readonly totalHours: number;
  readonly authoredCount: number;
}

const stats = (p: LearningHeroProps) => [
  { value: `${p.totalPhases}`, label: "PHASES" },
  { value: `${p.totalLessons}`, label: "LESSONS" },
  { value: `${p.authoredCount}`, label: "AUTHORED" },
  { value: `${p.totalHours}+`, label: "HOURS" },
];

export function LearningHero(props: LearningHeroProps) {
  const metrics = stats(props);

  return (
    <section className="relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-surface-1" />
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-glow-primary/[0.05] blur-[140px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-glow-accent/[0.04] blur-[120px]" />
      <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] rounded-full bg-glow-violet/[0.03] blur-[100px] animate-float" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-32 pb-20 sm:pt-40 sm:pb-28">
        {/* System tag */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease }}
          className="mono-tag text-lab-green mb-6 flex items-center gap-2"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-lab-green animate-glow-pulse" />{" "}
          [LEARNING_PLATFORM: ACTIVE]
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease }}
          className="text-display-xl text-foreground max-w-3xl"
        >
          Master AI Engineering
          <br />
          <span className="text-gradient-hero">From First Principles</span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55, ease }}
          className="mt-8 text-body-lg text-muted-foreground max-w-xl"
        >
          A structured, open-source roadmap from math foundations to
          production AI systems. Learn by building — every lesson grounded in
          real engineering.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease }}
          className="mt-10 flex flex-wrap gap-3"
        >
          <Link
            href="#roadmap"
            className={cn(
              buttonVariants({ size: "lg" }),
              "gap-2.5 rounded-[2px] bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-400 text-sm font-semibold px-7 h-11"
            )}
          >
            Start Learning
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#paths"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "gap-2.5 rounded-[2px] border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all duration-400 text-sm font-semibold px-7 h-11"
            )}
          >
            <Layers className="h-4 w-4" />
            View Learning Paths
          </Link>
        </motion.div>

        {/* Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9, ease }}
          className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6"
        >
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1 + i * 0.08, ease }}
              className="border-l border-lab-green/20 pl-3"
            >
              <div className="text-2xl sm:text-3xl font-bold text-foreground font-mono tracking-tight">
                {m.value}
              </div>
              <div className="mono-tag text-muted-foreground mt-1">{m.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
