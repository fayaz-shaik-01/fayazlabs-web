"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Filter,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllTracks } from "@/lib/curriculum";
import { useAuth } from "@/lib/auth/auth-context";
import * as practiceApi from "@/lib/practice/api";
import type { PracticeStatsResponse } from "@/lib/practice/api";

// ── Types ────────────────────────────────────────────────────────────────

type ProblemType = "mcq" | "numerical" | "true-false";
type Difficulty = "beginner" | "intermediate" | "advanced";

interface Problem {
  id: string;
  question: string;
  type: ProblemType;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: Difficulty;
  track: string;
  module: string;
  tags: string[];
}

// ── Sample Problems (demo data, would come from KO extraction in production) ──

const sampleProblems: Problem[] = [
  {
    id: "p-mat-001",
    question: "If A is a 3×3 skew-symmetric matrix, what is the value of det(A)?",
    type: "mcq",
    options: ["0", "1", "-1", "Cannot be determined"],
    correctAnswer: "0",
    explanation: "For any odd-order skew-symmetric matrix, det(A) = det(Aᵀ) = det(-A) = (-1)ⁿ det(A). For n=3 (odd), det(A) = -det(A), so 2·det(A) = 0, giving det(A) = 0.",
    difficulty: "intermediate",
    track: "gate-ra-2027",
    module: "linear-algebra",
    tags: ["matrices", "determinants", "skew-symmetric"],
  },
  {
    id: "p-mat-002",
    question: "If A is an orthogonal matrix, then |det(A)| equals:",
    type: "mcq",
    options: ["0", "1", "2", "It depends on the matrix"],
    correctAnswer: "1",
    explanation: "For orthogonal Q: QᵀQ = I ⟹ det(Qᵀ)·det(Q) = 1 ⟹ [det(Q)]² = 1 ⟹ det(Q) = ±1.",
    difficulty: "beginner",
    track: "gate-ra-2027",
    module: "linear-algebra",
    tags: ["matrices", "orthogonal"],
  },
  {
    id: "p-mat-003",
    question: "A 4×4 matrix has rank 2. The dimension of its null space is:",
    type: "mcq",
    options: ["0", "1", "2", "4"],
    correctAnswer: "2",
    explanation: "By the rank-nullity theorem: rank + nullity = n. So nullity = 4 - 2 = 2.",
    difficulty: "intermediate",
    track: "gate-ra-2027",
    module: "linear-algebra",
    tags: ["rank", "null-space"],
  },
  {
    id: "p-mat-004",
    question: "The number of independent elements in a 4×4 symmetric matrix is:",
    type: "numerical",
    correctAnswer: "10",
    explanation: "For an n×n symmetric matrix, independent elements = n(n+1)/2 = 4×5/2 = 10.",
    difficulty: "beginner",
    track: "gate-ra-2027",
    module: "linear-algebra",
    tags: ["matrices", "symmetric"],
  },
  {
    id: "p-mat-005",
    question: "If A² = A for a matrix A, then A is called:",
    type: "mcq",
    options: ["Involutory", "Idempotent", "Nilpotent", "Orthogonal"],
    correctAnswer: "Idempotent",
    explanation: "A² = A defines an idempotent matrix. Involutory: A² = I. Nilpotent: Aᵏ = O. Orthogonal: AᵀA = I.",
    difficulty: "beginner",
    track: "gate-ra-2027",
    module: "linear-algebra",
    tags: ["matrices", "types"],
  },
  {
    id: "p-cs-001",
    question: "A unity feedback system has open-loop transfer function G(s) = K/[s(s+2)(s+4)]. The system is Type:",
    type: "mcq",
    options: ["Type 0", "Type 1", "Type 2", "Type 3"],
    correctAnswer: "Type 1",
    explanation: "The type number equals the number of open-loop poles at the origin. G(s) has one pole at s=0 (the 's' in the denominator), so it is Type 1.",
    difficulty: "intermediate",
    track: "gate-ra-2027",
    module: "control-systems",
    tags: ["steady-state", "error-constants"],
  },
];

// ── Problem Card ─────────────────────────────────────────────────────────

function ProblemCard({
  problem,
  index,
  onAnswered,
}: Readonly<{
  problem: Problem;
  index: number;
  onAnswered?: (problemId: string, selectedAnswer: string, correct: boolean) => void;
}>) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [numericalAnswer, setNumericalAnswer] = useState("");

  const isCorrect =
    problem.type === "numerical"
      ? numericalAnswer.trim() === problem.correctAnswer
      : selected === problem.correctAnswer;

  const handleCheck = useCallback(() => {
    setShowExplanation(true);
    const answer = numericalAnswer.trim();
    const correct = answer === problem.correctAnswer;
    onAnswered?.(problem.id, answer, correct);
  }, [numericalAnswer, problem, onAnswered]);

  const handleReset = useCallback(() => {
    setSelected(null);
    setShowExplanation(false);
    setNumericalAnswer("");
  }, []);

  const difficultyColor = {
    beginner: "text-lab-green border-lab-green/30",
    intermediate: "text-lab-amber border-lab-amber/30",
    advanced: "text-lab-red border-lab-red/30",
  }[problem.difficulty];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="mono-tag text-muted-foreground">Q{index + 1}</span>
          <span className={`text-[0.625rem] px-2 py-0.5 rounded border font-mono uppercase ${difficultyColor}`}>
            {problem.difficulty}
          </span>
          <span className="text-[0.625rem] px-2 py-0.5 rounded border border-white/10 font-mono uppercase text-muted-foreground/60">
            {problem.type}
          </span>
        </div>
      </div>

      {/* Question */}
      <p className="text-sm text-foreground leading-relaxed mb-5">{problem.question}</p>

      {/* MCQ Options */}
      {problem.type === "mcq" && problem.options && (
        <div className="space-y-2 mb-4">
          {problem.options.map((option, i) => {
            const letter = String.fromCodePoint(65 + i);
            const isSelected = selected === option;
            const isAnswer = option === problem.correctAnswer;

            return (
              <button
                key={`${problem.id}-opt-${letter}`}
                onClick={() => {
                  if (!showExplanation) {
                    setSelected(option);
                    setShowExplanation(true);
                    onAnswered?.(problem.id, option, option === problem.correctAnswer);
                  }
                }}
                disabled={showExplanation}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border text-left text-sm transition-all",
                  !showExplanation && !isSelected && "border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03]",
                  !showExplanation && isSelected && "border-primary/40 bg-primary/5",
                  showExplanation && isAnswer && "border-lab-green/40 bg-lab-green/5 text-lab-green",
                  showExplanation && isSelected && !isAnswer && "border-lab-red/40 bg-lab-red/5 text-lab-red",
                  showExplanation && !isSelected && !isAnswer && "opacity-50"
                )}
              >
                <span className="font-mono text-xs text-muted-foreground w-5">{letter}.</span>
                <span className="flex-1">{option}</span>
                {showExplanation && isAnswer && <CheckCircle2 className="h-4 w-4 text-lab-green flex-shrink-0" />}
                {showExplanation && isSelected && !isAnswer && <XCircle className="h-4 w-4 text-lab-red flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Numerical Input */}
      {problem.type === "numerical" && (
        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            value={numericalAnswer}
            onChange={(e) => setNumericalAnswer(e.target.value)}
            disabled={showExplanation}
            placeholder="Enter your answer..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none"
          />
          {!showExplanation && (
            <button
              onClick={handleCheck}
              disabled={!numericalAnswer.trim()}
              className="px-4 py-2.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-40"
            >
              Check
            </button>
          )}
        </div>
      )}

      {/* Explanation */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={cn(
              "mt-3 p-4 rounded-lg border text-sm leading-relaxed",
              isCorrect
                ? "border-lab-green/20 bg-lab-green/5 text-lab-green/90"
                : "border-lab-amber/20 bg-lab-amber/5 text-lab-amber/90"
            )}>
              <div className="flex items-center gap-2 font-semibold mb-2">
                {isCorrect ? (
                  <><CheckCircle2 className="h-4 w-4" /> Correct!</>
                ) : (
                  <><XCircle className="h-4 w-4" /> Incorrect — Answer: {problem.correctAnswer}</>
                )}
              </div>
              <p className="text-muted-foreground">{problem.explanation}</p>
            </div>
            <button
              onClick={handleReset}
              className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <RotateCcw className="h-3 w-3" /> Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tags */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {problem.tags.map((tag) => (
          <span key={tag} className="text-[0.625rem] px-2 py-0.5 rounded-full bg-white/[0.04] text-muted-foreground/50 font-mono">
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ── Practice Hub ─────────────────────────────────────────────────────────

export function PracticeHub() {
  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [stats, setStats] = useState<PracticeStatsResponse | null>(null);
  const tracks = getAllTracks();
  const { isAuthenticated } = useAuth();
  const startTimeRef = useRef<number>(Date.now());

  // Load stats on mount (if authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    practiceApi.getPracticeStats().then(setStats).catch(() => {});
  }, [isAuthenticated]);

  const handleAnswered = useCallback(
    (problemId: string, selectedAnswer: string, correct: boolean) => {
      const problem = sampleProblems.find((p) => p.id === problemId);
      if (!problem) return;

      if (isAuthenticated) {
        const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
        startTimeRef.current = Date.now();
        practiceApi
          .submitAnswer({
            problemId: problem.id,
            trackSlug: problem.track,
            moduleSlug: problem.module,
            problemType: problem.type,
            difficulty: problem.difficulty,
            selectedAnswer,
            correctAnswer: problem.correctAnswer,
            timeTakenSecs: timeTaken,
          })
          .then(() => {
            practiceApi.getPracticeStats().then(setStats).catch(() => {});
          })
          .catch(() => {});
      }
    },
    [isAuthenticated],
  );

  const filtered = sampleProblems.filter((p) => {
    if (selectedTrack !== "all" && p.track !== selectedTrack) return false;
    if (selectedDifficulty !== "all" && p.difficulty !== selectedDifficulty) return false;
    return true;
  });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-surface-1" />
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-glow-primary/[0.05] blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-32 pb-16 sm:pt-40 sm:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mono-tag text-lab-green mb-6 flex items-center gap-2"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-lab-green animate-glow-pulse" />
            [PRACTICE_ENGINE: ACTIVE]
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35 }}
            className="text-display-xl text-foreground max-w-3xl"
          >
            Practice
            <br />
            <span className="text-gradient-hero">Problems</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="mt-6 text-body-lg text-muted-foreground max-w-xl"
          >
            Test your understanding with targeted problems. Instant feedback,
            detailed solutions, and difficulty-graded challenges.
          </motion.p>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="mt-8 flex items-center gap-6"
          >
            <div className="border-l border-lab-green/20 pl-3">
              <div className="text-xl font-bold text-foreground font-mono">{sampleProblems.length}</div>
              <div className="mono-tag text-muted-foreground mt-0.5 flex items-center gap-1">
                <FlaskConical className="h-3 w-3" /> PROBLEMS
              </div>
            </div>
            <div className="border-l border-lab-green/20 pl-3">
              <div className="text-xl font-bold text-foreground font-mono">{tracks.length}</div>
              <div className="mono-tag text-muted-foreground mt-0.5 flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> TRACKS
              </div>
            </div>
            {stats && stats.totalAttempts > 0 && (
              <>
                <div className="border-l border-primary/20 pl-3">
                  <div className="text-xl font-bold text-foreground font-mono">{stats.totalAttempts}</div>
                  <div className="mono-tag text-muted-foreground mt-0.5 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> ATTEMPTED
                  </div>
                </div>
                <div className="border-l border-lab-green/20 pl-3">
                  <div className="text-xl font-bold text-lab-green font-mono">{Math.round(stats.accuracy)}%</div>
                  <div className="mono-tag text-muted-foreground mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> ACCURACY
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* Filters + Problems */}
      <div className="mx-auto max-w-6xl px-6 pb-24">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filters:
          </div>

          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-xs text-foreground focus:border-primary/40 focus:outline-none"
          >
            <option value="all">All Tracks</option>
            {tracks.map((t) => (
              <option key={t.slug} value={t.slug}>{t.title}</option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-xs text-foreground focus:border-primary/40 focus:outline-none"
          >
            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <span className="ml-auto text-xs text-muted-foreground/50 font-mono">
            {filtered.length} problem{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Problem Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((problem, i) => (
            <ProblemCard key={problem.id} problem={problem} index={i} onAnswered={handleAnswered} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground/50">
            <FlaskConical className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No problems match your filters.</p>
          </div>
        )}
      </div>
    </>
  );
}
