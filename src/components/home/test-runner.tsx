"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings } from "lucide-react";

interface LogEntry {
  readonly text: string;
  readonly type: "init" | "pass" | "info" | "summary";
}

const LOG_SCRIPT: LogEntry[] = [
  { text: "\u{1F7E2} [INIT] Booting test harness...", type: "init" },
  { text: "\u2714 Checking Hero components......... 0.04s", type: "pass" },
  { text: "\u2714 Verifying WebGL R3F Context...... 0.08s", type: "pass" },
  { text: "\u2714 Hydrating 'System Deployments'... 1.12s", type: "pass" },
  { text: "\u2714 Validating navigation routes..... 0.02s", type: "pass" },
  { text: "\u2714 Running accessibility audit...... 0.16s", type: "pass" },
  { text: "\u2714 Checking responsive breakpoints.. 0.05s", type: "pass" },
  { text: "\u2714 Verifying API mock endpoints..... 0.03s", type: "pass" },
  { text: "", type: "info" },
  { text: "\u{1F4CA} SUMMARY:", type: "summary" },
  { text: "   Suites: 4 passed, 4 total", type: "summary" },
  { text: "   Tests:  32 passed, 32 total", type: "summary" },
  { text: "   Time:   1.50s", type: "summary" },
  { text: "   Latency: 14ms", type: "summary" },
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

interface TestRunnerProps {
  readonly autoOpen?: boolean;
}

export function TestRunner({ autoOpen = false }: TestRunnerProps) {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<LogEntry[]>([]);
  const [started, setStarted] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startStreaming = useCallback(() => {
    if (started) return;
    setStarted(true);

    if (prefersReducedMotion) {
      setLines(LOG_SCRIPT);
      return;
    }

    let idx = 0;
    intervalRef.current = setInterval(() => {
      if (idx >= LOG_SCRIPT.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      const entry = LOG_SCRIPT[idx];
      idx++;
      setLines((prev) => [...prev, entry]);
    }, 320);
  }, [started, prefersReducedMotion]);

  useEffect(() => {
    if (!autoOpen) return;
    const timer = setTimeout(() => {
      setOpen(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [autoOpen]);

  useEffect(() => {
    if (open && !started) {
      startStreaming();
    }
  }, [open, started, startStreaming]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const colorFor = (type: LogEntry["type"]) => {
    switch (type) {
      case "init":
        return "text-lab-amber";
      case "pass":
        return "text-lab-green";
      case "summary":
        return "text-foreground/70";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 hidden lg:block">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="hw-module w-[380px] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
              <span className="mono-tag text-lab-green text-[10px]">Automated Test Runner</span>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close test runner"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Log area */}
            <div
              ref={scrollRef}
              className="px-4 py-3 h-[260px] overflow-y-auto font-mono text-[11px] leading-[1.8] scrollbar-thin"
            >
              {lines.map((line, i) => (
                <div key={i} className={colorFor(line.type)}>
                  {line.text || "\u00A0"}
                </div>
              ))}
              {lines.length > 0 && lines.length < LOG_SCRIPT.length && (
                <span className="inline-block w-1.5 h-3.5 bg-lab-green/60 animate-glow-pulse" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button when closed */}
      {!open && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setOpen(true)}
          className="hw-module p-3 text-lab-green hover:text-foreground transition-colors"
          aria-label="Open test runner"
        >
          <Settings className="h-4 w-4" />
        </motion.button>
      )}
    </div>
  );
}
