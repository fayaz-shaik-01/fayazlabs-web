"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const HeroScene = dynamic(
  () => import("@/components/three/scene-wrapper").then((m) => ({ default: m.HeroScene })),
  { ssr: false }
);

const metrics = [
  { value: "2+", label: "YRS_ENPHASE" },
  { value: "60%", label: "TEST_REDUCTION" },
  { value: "50+", label: "APIS_AUTOMATED" },
  { value: "10K+", label: "DOCS_INDEXED" },
];

const ease = [0.16, 1, 0.3, 1] as const;

function Crosshair({ position }: Readonly<{ position: "tl" | "tr" | "bl" | "br" }>) {
  const base = "absolute pointer-events-none text-lab-green/30 z-20 hidden lg:block";
  const size = 32;
  const pos = {
    tl: "top-6 left-6",
    tr: "top-6 right-6",
    bl: "bottom-6 left-6",
    br: "bottom-6 right-6",
  }[position];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn(base, pos)}
      aria-hidden="true"
    >
      {position === "tl" && (
        <>
          <line x1="0" y1="0" x2="12" y2="0" stroke="currentColor" strokeWidth="1" />
          <line x1="0" y1="0" x2="0" y2="12" stroke="currentColor" strokeWidth="1" />
        </>
      )}
      {position === "tr" && (
        <>
          <line x1={size} y1="0" x2={size - 12} y2="0" stroke="currentColor" strokeWidth="1" />
          <line x1={size} y1="0" x2={size} y2="12" stroke="currentColor" strokeWidth="1" />
        </>
      )}
      {position === "bl" && (
        <>
          <line x1="0" y1={size} x2="12" y2={size} stroke="currentColor" strokeWidth="1" />
          <line x1="0" y1={size} x2="0" y2={size - 12} stroke="currentColor" strokeWidth="1" />
        </>
      )}
      {position === "br" && (
        <>
          <line x1={size} y1={size} x2={size - 12} y2={size} stroke="currentColor" strokeWidth="1" />
          <line x1={size} y1={size} x2={size} y2={size - 12} stroke="currentColor" strokeWidth="1" />
        </>
      )}
    </svg>
  );
}

export function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-surface-1" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-glow-primary/[0.04] blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-glow-accent/[0.03] blur-[130px]" />
      <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] rounded-full bg-glow-violet/[0.03] blur-[120px] animate-float" />

      {/* Crosshair tracking brackets */}
      <Crosshair position="tl" />
      <Crosshair position="tr" />
      <Crosshair position="bl" />
      <Crosshair position="br" />

      {/* Layer 2 — Full-section 3D canvas (desktop only) */}
      <div className="absolute inset-0 z-[1] hidden lg:block">
        {mounted && <HeroScene />}
      </div>

      {/* Layer 3 — Atmospheric depth overlay */}
      <div className="absolute inset-0 z-[2] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 50% 60% at 50% 50%, transparent 0%, var(--background) 100%)",
          }}
        />
      </div>

      {/* Layer 4 — Foreground text content */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-32 pb-20 w-full">
        <div className="max-w-2xl">
          {/* System init tag */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="mono-tag text-lab-green mb-6 flex items-center gap-2"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-lab-green animate-glow-pulse" />
            [SYSTEM_INIT: SUCCESS]
          </motion.div>

          {/* Heading — high-contrast, dramatic composition */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease }}
            className="text-display-2xl text-foreground"
          >
            Building
            <br />
            <span className="text-gradient-hero">Intelligent</span>
            <br />
            <span className="text-foreground/50">Systems</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease }}
            className="mt-8 text-body-lg text-muted-foreground max-w-lg"
          >
            <span className="text-foreground font-semibold">Shaik Fayaz</span> — AI Engineer crafting
            agentic workflows, LLM-powered automation, and production backend systems at Enphase Energy.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7, ease }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <Link
              href="/projects"
              className={cn(
                buttonVariants({ size: "lg" }),
                "gap-2.5 rounded-[2px] bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-400 text-sm font-semibold px-7 h-11"
              )}
            >
              View My Work
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/Single_Column_Solid_Resume.pdf"
              target="_blank"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "gap-2.5 rounded-[2px] border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all duration-400 text-sm font-semibold px-7 h-11"
              )}
            >
              <Download className="h-4 w-4" />
              Resume
            </Link>
          </motion.div>

          {/* Metrics — monospace readouts */}
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
                  <div className="text-2xl sm:text-3xl font-bold text-foreground font-mono tracking-tight">{m.value}</div>
                  <div className="mono-tag text-muted-foreground mt-1">{m.label}</div>
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
