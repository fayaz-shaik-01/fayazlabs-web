"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Lightbulb,
  AlertTriangle,
  Globe,
  Zap,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  GraduationCap,
  FlaskConical,
} from "lucide-react";

// ── FormulaCard ────────────────────────────────────────────────────────────
// Displays a named formula with LaTeX, plain-English explanation, and copy.

interface FormulaCardProps {
  readonly name: string;
  readonly children: React.ReactNode; // LaTeX rendered by KaTeX via MDX
  readonly description?: string;
  readonly id?: string;
}

export function FormulaCard({ name, children, description, id }: FormulaCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const el = document.getElementById(id ?? "");
    const text = el?.textContent ?? name;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [id, name]);

  return (
    <div
      id={id}
      className="my-6 rounded-lg border border-primary/20 bg-primary/[0.03] p-5 relative group"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium uppercase tracking-wider text-primary/80">
          <FlaskConical className="size-3.5" />
          {name}
        </span>
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center size-7 rounded-md border border-border bg-card/90 text-muted-foreground hover:text-foreground"
          aria-label="Copy formula"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        </button>
      </div>
      <div className="text-center text-lg [&_.katex]:text-[1.15em]">
        {children}
      </div>
      {description && (
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed border-t border-primary/10 pt-3">
          <span className="font-medium text-foreground/70">In plain English:</span>{" "}
          {description}
        </p>
      )}
    </div>
  );
}

// ── DefinitionCard ─────────────────────────────────────────────────────────
// Term + definition with optional analogy.

interface DefinitionCardProps {
  readonly term: string;
  readonly children: React.ReactNode;
  readonly analogy?: string;
  readonly id?: string;
}

export function DefinitionCard({ term, children, analogy, id }: DefinitionCardProps) {
  return (
    <div
      id={id}
      className="my-6 rounded-lg border-l-4 border-l-blue-500/60 border border-blue-500/15 bg-blue-500/[0.03] p-5"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <BookOpen className="size-3.5 text-blue-400/80" />
        <span className="text-xs font-mono font-medium uppercase tracking-wider text-blue-400/80">
          Definition
        </span>
      </div>
      <p className="font-semibold text-foreground mb-2">{term}</p>
      <div className="text-[0.9375rem] leading-[1.7] text-foreground/80">
        {children}
      </div>
      {analogy && (
        <p className="mt-3 text-sm text-muted-foreground italic border-t border-blue-500/10 pt-3">
          💡 <span className="font-medium">Think of it like:</span> {analogy}
        </p>
      )}
    </div>
  );
}

// ── ExamTip ────────────────────────────────────────────────────────────────
// Highlighted exam strategy advice.

interface ExamTipProps {
  readonly children: React.ReactNode;
  readonly exam?: string; // "GATE" | "SEBI" etc.
}

export function ExamTip({ children, exam }: ExamTipProps) {
  return (
    <div className="my-6 rounded-lg border-l-4 border-l-amber-500/60 border border-amber-500/15 bg-amber-500/[0.03] p-5">
      <div className="flex items-center gap-1.5 mb-2">
        <GraduationCap className="size-3.5 text-amber-400/80" />
        <span className="text-xs font-mono font-medium uppercase tracking-wider text-amber-400/80">
          {exam ? `${exam} Exam Tip` : "Exam Tip"}
        </span>
      </div>
      <div className="text-[0.9375rem] leading-[1.7] text-foreground/80">
        {children}
      </div>
    </div>
  );
}

// ── Warning ────────────────────────────────────────────────────────────────
// Common mistake or misconception callout.

interface WarningProps {
  readonly title?: string;
  readonly children: React.ReactNode;
}

export function Warning({ title, children }: WarningProps) {
  return (
    <div className="my-6 rounded-lg border-l-4 border-l-red-500/60 border border-red-500/15 bg-red-500/[0.03] p-5">
      <div className="flex items-center gap-1.5 mb-2">
        <AlertTriangle className="size-3.5 text-red-400/80" />
        <span className="text-xs font-mono font-medium uppercase tracking-wider text-red-400/80">
          {title ?? "Common Mistake"}
        </span>
      </div>
      <div className="text-[0.9375rem] leading-[1.7] text-foreground/80">
        {children}
      </div>
    </div>
  );
}

// ── EngineeringInsight ─────────────────────────────────────────────────────
// "Why this matters in practice" aside.

interface EngineeringInsightProps {
  readonly children: React.ReactNode;
}

export function EngineeringInsight({ children }: EngineeringInsightProps) {
  return (
    <div className="my-6 rounded-lg border-l-4 border-l-purple-500/60 border border-purple-500/15 bg-purple-500/[0.03] p-5">
      <div className="flex items-center gap-1.5 mb-2">
        <Zap className="size-3.5 text-purple-400/80" />
        <span className="text-xs font-mono font-medium uppercase tracking-wider text-purple-400/80">
          Engineering Insight
        </span>
      </div>
      <div className="text-[0.9375rem] leading-[1.7] text-foreground/80">
        {children}
      </div>
    </div>
  );
}

// ── RealWorldExample ───────────────────────────────────────────────────────
// Practical application of a concept.

interface RealWorldExampleProps {
  readonly title?: string;
  readonly children: React.ReactNode;
}

export function RealWorldExample({ title, children }: RealWorldExampleProps) {
  return (
    <div className="my-6 rounded-lg border-l-4 border-l-cyan-500/60 border border-cyan-500/15 bg-cyan-500/[0.03] p-5">
      <div className="flex items-center gap-1.5 mb-2">
        <Globe className="size-3.5 text-cyan-400/80" />
        <span className="text-xs font-mono font-medium uppercase tracking-wider text-cyan-400/80">
          {title ?? "Real-World Application"}
        </span>
      </div>
      <div className="text-[0.9375rem] leading-[1.7] text-foreground/80">
        {children}
      </div>
    </div>
  );
}

// ── ExampleCard ────────────────────────────────────────────────────────────
// Worked example with collapsible solution.

interface ExampleCardProps {
  readonly title: string;
  readonly difficulty?: "beginner" | "intermediate" | "advanced";
  readonly children: React.ReactNode; // problem statement
  readonly solution?: React.ReactNode;
}

const difficultyColors = {
  beginner: "text-green-400/80 border-green-500/30",
  intermediate: "text-amber-400/80 border-amber-500/30",
  advanced: "text-red-400/80 border-red-500/30",
};

export function ExampleCard({ title, difficulty, children, solution }: ExampleCardProps) {
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div className="my-6 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.03] overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-3.5 text-emerald-400/80" />
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-emerald-400/80">
              Worked Example
            </span>
          </div>
          {difficulty && (
            <span className={cn(
              "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border",
              difficultyColors[difficulty]
            )}>
              {difficulty}
            </span>
          )}
        </div>
        <p className="font-semibold text-foreground mb-3">{title}</p>
        <div className="text-[0.9375rem] leading-[1.7] text-foreground/80">
          {children}
        </div>
      </div>
      {solution && (
        <>
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="w-full flex items-center gap-2 px-5 py-3 text-sm font-medium text-emerald-400/80 hover:text-emerald-300 bg-emerald-500/[0.05] border-t border-emerald-500/10 transition-colors"
          >
            {showSolution ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
            {showSolution ? "Hide Solution" : "Show Solution"}
          </button>
          {showSolution && (
            <div className="px-5 pb-5 pt-3 border-t border-emerald-500/10 text-[0.9375rem] leading-[1.7] text-foreground/80">
              {solution}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── DerivationStepper ──────────────────────────────────────────────────────
// Multi-step derivation with progressive disclosure.

interface DerivationStep {
  readonly label: string;
  readonly children: React.ReactNode;
}

interface DerivationStepperProps {
  readonly title: string;
  readonly children: React.ReactNode; // expects DerivationStep children
}

export function DerivationStep({ label, children }: DerivationStep) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-l-2 border-primary/20 pl-4 py-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors w-full text-left"
      >
        {expanded ? (
          <ChevronDown className="size-3.5 text-primary/60 shrink-0" />
        ) : (
          <ChevronRight className="size-3.5 text-primary/60 shrink-0" />
        )}
        {label}
      </button>
      {expanded && (
        <div className="mt-2 ml-5.5 text-[0.9375rem] leading-[1.7] text-foreground/80">
          {children}
        </div>
      )}
    </div>
  );
}

export function DerivationStepper({ title, children }: DerivationStepperProps) {
  return (
    <div className="my-6 rounded-lg border border-primary/15 bg-primary/[0.02] p-5">
      <div className="flex items-center gap-1.5 mb-4">
        <Sparkles className="size-3.5 text-primary/70" />
        <span className="text-xs font-mono font-medium uppercase tracking-wider text-primary/70">
          Derivation
        </span>
      </div>
      <p className="font-semibold text-foreground mb-4">{title}</p>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

// ── ComparisonTable ────────────────────────────────────────────────────────
// Side-by-side comparison of two concepts.

interface ComparisonTableProps {
  readonly leftTitle: string;
  readonly rightTitle: string;
  readonly children: React.ReactNode; // expects <tr> rows
}

export function ComparisonTable({ leftTitle, rightTitle, children }: ComparisonTableProps) {
  return (
    <div className="my-6 rounded-lg border border-white/[0.08] overflow-hidden">
      <div className="grid grid-cols-2 bg-white/[0.03]">
        <div className="px-4 py-3 text-sm font-semibold text-foreground border-r border-white/[0.06] text-center">
          {leftTitle}
        </div>
        <div className="px-4 py-3 text-sm font-semibold text-foreground text-center">
          {rightTitle}
        </div>
      </div>
      <table className="w-full">
        <tbody className="divide-y divide-white/[0.06]">
          {children}
        </tbody>
      </table>
    </div>
  );
}

// ── ConceptCheckpoint ──────────────────────────────────────────────────────
// Inline quiz after a concept section.

interface ConceptCheckpointProps {
  readonly question: string;
  readonly options: string[];
  readonly correctIndex: number;
  readonly explanation: string;
}

export function ConceptCheckpoint({
  question,
  options,
  correctIndex,
  explanation,
}: ConceptCheckpointProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(() => {
    if (selected !== null) setSubmitted(true);
  }, [selected]);

  const handleReset = useCallback(() => {
    setSelected(null);
    setSubmitted(false);
  }, []);

  const isCorrect = selected === correctIndex;

  return (
    <div className="my-8 rounded-lg border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="flex items-center gap-1.5 mb-3">
        <CheckCircle2 className="size-3.5 text-lab-green/70" />
        <span className="text-xs font-mono font-medium uppercase tracking-wider text-lab-green/70">
          Quick Check
        </span>
      </div>
      <p className="font-medium text-foreground mb-4">{question}</p>
      <div className="space-y-2 mb-4">
        {options.map((option, i) => {
          let optionClasses = "border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.03]";
          if (submitted && i === correctIndex) {
            optionClasses = "border-green-500/40 bg-green-500/[0.06]";
          } else if (submitted && i === selected && !isCorrect) {
            optionClasses = "border-red-500/40 bg-red-500/[0.06]";
          } else if (!submitted && i === selected) {
            optionClasses = "border-primary/40 bg-primary/[0.06]";
          }

          return (
            <button
              key={`opt-${option}`}
              onClick={() => !submitted && setSelected(i)}
              disabled={submitted}
              className={cn(
                "w-full text-left px-4 py-2.5 rounded-md border text-sm transition-all flex items-center gap-3",
                optionClasses,
                submitted && "cursor-default"
              )}
            >
              <span className="font-mono text-xs text-muted-foreground w-5">
                {String.fromCodePoint(65 + i)}.
              </span>
              <span className="text-foreground/80">{option}</span>
              {submitted && i === correctIndex && (
                <CheckCircle2 className="size-4 text-green-400 ml-auto shrink-0" />
              )}
              {submitted && i === selected && !isCorrect && (
                <XCircle className="size-4 text-red-400 ml-auto shrink-0" />
              )}
            </button>
          );
        })}
      </div>
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className={cn(
            "text-sm font-medium px-4 py-2 rounded-md transition-all",
            selected !== null
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-white/[0.05] text-muted-foreground cursor-not-allowed"
          )}
        >
          Check Answer
        </button>
      ) : (
        <div>
          <div className={cn(
            "rounded-md p-3 text-sm leading-relaxed mb-3",
            isCorrect
              ? "bg-green-500/[0.06] border border-green-500/20 text-green-300/90"
              : "bg-red-500/[0.06] border border-red-500/20 text-red-300/90"
          )}>
            <span className="font-semibold">{isCorrect ? "Correct!" : "Not quite."}</span>{" "}
            {explanation}
          </div>
          <button
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

// ── TabGroup ───────────────────────────────────────────────────────────────
// Content tabs for alternate approaches: "Method 1 / Method 2 / Method 3"

interface TabGroupProps {
  readonly tabs: string[];
  readonly children: React.ReactNode[];
}

export function TabGroup({ tabs, children }: TabGroupProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="my-6 rounded-lg border border-white/[0.08] overflow-hidden">
      <div className="flex border-b border-white/[0.06] bg-white/[0.02]">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActive(i)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors relative",
              i === active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/70"
            )}
          >
            {tab}
            {i === active && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>
      <div className="p-5">
        {children[active]}
      </div>
    </div>
  );
}

// ── MemoryTrick ────────────────────────────────────────────────────────────
// Mnemonics and visual memory aids.

interface MemoryTrickProps {
  readonly children: React.ReactNode;
}

export function MemoryTrick({ children }: MemoryTrickProps) {
  return (
    <div className="my-6 rounded-lg border-l-4 border-l-pink-500/60 border border-pink-500/15 bg-pink-500/[0.03] p-5">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="size-3.5 text-pink-400/80" />
        <span className="text-xs font-mono font-medium uppercase tracking-wider text-pink-400/80">
          Memory Trick
        </span>
      </div>
      <div className="text-[0.9375rem] leading-[1.7] text-foreground/80">
        {children}
      </div>
    </div>
  );
}
