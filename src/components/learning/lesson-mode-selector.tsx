"use client";

import { useState, useMemo, createContext, useContext } from "react";
import { motion } from "framer-motion";
import { BookOpen, Repeat, FlaskConical, GraduationCap, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export type LessonMode = "full" | "review" | "practice" | "exam" | "visual";

const MODES = [
  { id: "full" as const, label: "Full", icon: BookOpen, description: "Complete lesson with all sections" },
  { id: "review" as const, label: "Review", icon: Repeat, description: "Key concepts, formulas & tips only" },
  { id: "practice" as const, label: "Practice", icon: FlaskConical, description: "Problems & checkpoints only" },
  { id: "exam" as const, label: "Exam", icon: GraduationCap, description: "Timed exam-style practice" },
  { id: "visual" as const, label: "Visual", icon: Eye, description: "Diagrams, charts & derivations only" },
];

const LessonModeContext = createContext<{
  mode: LessonMode;
  setMode: (m: LessonMode) => void;
}>({ mode: "full", setMode: () => {} });

export function useLessonMode() {
  return useContext(LessonModeContext);
}

export function LessonModeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [mode, setMode] = useState<LessonMode>("full");
  const value = useMemo(() => ({ mode, setMode }), [mode]);
  return (
    <LessonModeContext.Provider value={value}>
      {children}
    </LessonModeContext.Provider>
  );
}

export function LessonModeSelector() {
  const { mode, setMode } = useLessonMode();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
      {MODES.map((m) => {
        const Icon = m.icon;
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            title={m.description}
            className={cn(
              "relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/80"
            )}
          >
            {active && (
              <motion.span
                layoutId="lesson-mode-indicator"
                className="absolute inset-0 rounded-md bg-background border border-border shadow-sm"
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{m.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function LessonModeGate({
  show,
  children,
}: Readonly<{
  show: LessonMode | LessonMode[];
  children: React.ReactNode;
}>) {
  const { mode } = useLessonMode();
  const modes = Array.isArray(show) ? show : [show];
  if (!modes.includes(mode)) return null;
  return <>{children}</>;
}
