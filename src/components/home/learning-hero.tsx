"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FolderGit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const ease = [0.16, 1, 0.3, 1] as const;

export function LearningHomepageHero() {
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
            [FAYAZLABS]
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease }}
            className="text-display-2xl text-foreground"
          >
            Building and testing
            <br />
            <span className="text-gradient-hero">AI products</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease }}
            className="mt-8 text-body-lg text-muted-foreground max-w-xl"
          >
            Projects, writing and hands-on courses on engineering and testing
            software built on LLMs. By{" "}
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
              href="/learning/ai-product-testing"
              className={cn(
                buttonVariants({ size: "lg" }),
                "gap-2.5 rounded-md bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-400 text-sm font-semibold px-7 h-11"
              )}
            >
              Start the course
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/projects"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "gap-2.5 rounded-md border-border bg-card hover:bg-muted hover:border-primary/50 transition-all duration-400 text-sm font-semibold px-7 h-11"
              )}
            >
              <FolderGit2 className="h-4 w-4" />
              See Projects
            </Link>
          </motion.div>

        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
