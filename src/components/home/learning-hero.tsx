"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Zap,
  GraduationCap,
  FlaskConical,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { getGlobalStats } from "@/lib/curriculum";

const ease = [0.16, 1, 0.3, 1] as const;

export function LearningHomepageHero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const stats = getGlobalStats();

  const metrics = [
    { value: `${stats.totalTracks}`, label: "TRACKS", icon: <Layers className="h-3.5 w-3.5" /> },
    { value: `${stats.totalLessons}`, label: "LESSONS", icon: <BookOpen className="h-3.5 w-3.5" /> },
    { value: `${stats.publishedLessons}`, label: "AUTHORED", icon: <GraduationCap className="h-3.5 w-3.5" /> },
    { value: `${stats.estimatedHours}+`, label: "HOURS", icon: <Zap className="h-3.5 w-3.5" /> },
  ];

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-surface-1" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-glow-primary/[0.04] blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-glow-accent/[0.03] blur-[130px]" />
      <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] rounded-full bg-glow-violet/[0.03] blur-[120px] animate-float" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-32 pb-20 w-full">
        <div className="max-w-3xl">
          {/* System init tag */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="mono-tag text-lab-green mb-6 flex items-center gap-2"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-lab-green animate-glow-pulse" />
            [LEARNING_ENGINE: ACTIVE]
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease }}
            className="text-display-2xl text-foreground"
          >
            Learn Engineering
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
            Structured tracks covering AI engineering, GATE preparation, and
            systems design — with interactive practice, flashcards, and
            knowledge graphs. Built by{" "}
            <span className="text-foreground font-semibold">Shaik Fayaz</span>.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7, ease }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <Link
              href="/learning"
              className={cn(
                buttonVariants({ size: "lg" }),
                "gap-2.5 rounded-[2px] bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-400 text-sm font-semibold px-7 h-11"
              )}
            >
              Start Learning
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/practice"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "gap-2.5 rounded-[2px] border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all duration-400 text-sm font-semibold px-7 h-11"
              )}
            >
              <FlaskConical className="h-4 w-4" />
              Practice Problems
            </Link>
            <Link
              href="/flashcards"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "gap-2.5 rounded-[2px] border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all duration-400 text-sm font-semibold px-7 h-11"
              )}
            >
              <Brain className="h-4 w-4" />
              Flashcards
            </Link>
          </motion.div>

          {/* Metrics */}
          {mounted && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9, ease }}
              className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6"
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
                  <div className="mono-tag text-muted-foreground mt-1 flex items-center gap-1.5">
                    {m.icon}
                    {m.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
