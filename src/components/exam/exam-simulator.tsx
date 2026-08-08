"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  XCircle,
  BarChart3,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────

interface ExamQuestion {
  id: number;
  text: string;
  options: string[];
  correct: number; // 0-indexed
  topic: string;
  marks: number;
  negativeMarks: number;
}

type ExamPhase = "setup" | "running" | "review";

interface ExamAnswer {
  selected: number | null;
  flagged: boolean;
}

// ── Sample questions ─────────────────────────────────────────────────────

const SAMPLE_QUESTIONS: ExamQuestion[] = [
  { id: 1, text: "The rank of a 3×3 matrix A is 2. The number of linearly independent solutions of Ax = 0 is:", options: ["0", "1", "2", "3"], correct: 1, topic: "Linear Algebra", marks: 1, negativeMarks: 0.33 },
  { id: 2, text: "If the Laplace transform of f(t) is 1/(s²+4), then f(t) is:", options: ["cos(2t)", "(1/2)sin(2t)", "sin(2t)", "e^(-2t)"], correct: 1, topic: "Signals & Systems", marks: 1, negativeMarks: 0.33 },
  { id: 3, text: "The characteristic equation of a system is s³ + 2s² + 3s + 6 = 0. The system is:", options: ["Stable", "Marginally stable", "Unstable", "Cannot determine"], correct: 0, topic: "Control Systems", marks: 2, negativeMarks: 0.66 },
  { id: 4, text: "A half-wave rectifier with input frequency 50 Hz has ripple frequency of:", options: ["25 Hz", "50 Hz", "100 Hz", "150 Hz"], correct: 1, topic: "Analog Circuits", marks: 1, negativeMarks: 0.33 },
  { id: 5, text: "The number of flip-flops required for a mod-10 counter is:", options: ["3", "4", "5", "10"], correct: 1, topic: "Digital Electronics", marks: 1, negativeMarks: 0.33 },
  { id: 6, text: "For a series RLC circuit at resonance, the impedance is:", options: ["Maximum", "Minimum", "Zero", "Infinite"], correct: 1, topic: "Network Theory", marks: 1, negativeMarks: 0.33 },
  { id: 7, text: "The eigenvalues of [[2,1],[0,3]] are:", options: ["2 and 3", "1 and 6", "0 and 5", "2 and 1"], correct: 0, topic: "Linear Algebra", marks: 2, negativeMarks: 0.66 },
  { id: 8, text: "The Nyquist rate for x(t) = cos(200πt) + sin(400πt) is:", options: ["200 Hz", "400 Hz", "600 Hz", "800 Hz"], correct: 1, topic: "Signals & Systems", marks: 2, negativeMarks: 0.66 },
  { id: 9, text: "A PID controller improves both transient and steady-state response. The derivative term helps with:", options: ["Reducing steady-state error", "Increasing speed of response", "Reducing overshoot", "Increasing gain margin"], correct: 2, topic: "Control Systems", marks: 1, negativeMarks: 0.33 },
  { id: 10, text: "The Boolean expression A + A'B simplifies to:", options: ["A + B", "A", "B", "A'B"], correct: 0, topic: "Digital Electronics", marks: 1, negativeMarks: 0.33 },
];

// ── Component ────────────────────────────────────────────────────────────

export function ExamSimulator() {
  const [phase, setPhase] = useState<ExamPhase>("setup");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);

  const questions = SAMPLE_QUESTIONS;
  const totalMarks = useMemo(() => questions.reduce((s, q) => s + q.marks, 0), [questions]);

  const startExam = useCallback(() => {
    setAnswers(questions.map(() => ({ selected: null, flagged: false })));
    setTimeLeft(durationMinutes * 60);
    setCurrentQ(0);
    setPhase("running");
  }, [durationMinutes, questions]);

  // Timer
  useEffect(() => {
    if (phase !== "running") return;
    if (timeLeft <= 0) {
      setPhase("review");
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  const selectOption = useCallback((optIndex: number) => {
    setAnswers((prev) => prev.map((a, i) => (i === currentQ ? { ...a, selected: a.selected === optIndex ? null : optIndex } : a)));
  }, [currentQ]);

  const toggleFlag = useCallback(() => {
    setAnswers((prev) => prev.map((a, i) => (i === currentQ ? { ...a, flagged: !a.flagged } : a)));
  }, [currentQ]);

  const score = useMemo(() => {
    if (phase !== "review") return { correct: 0, wrong: 0, skipped: 0, total: 0, marks: 0 };
    let correct = 0, wrong = 0, skipped = 0, marks = 0;
    questions.forEach((q, i) => {
      const a = answers[i];
      if (a.selected === null) { skipped++; }
      else if (a.selected === q.correct) { correct++; marks += q.marks; }
      else { wrong++; marks -= q.negativeMarks; }
    });
    return { correct, wrong, skipped, total: questions.length, marks: Math.round(marks * 100) / 100 };
  }, [phase, questions, answers]);

  const topicAnalysis = useMemo(() => {
    if (phase !== "review") return [];
    const map = new Map<string, { correct: number; total: number }>();
    questions.forEach((q, i) => {
      const entry = map.get(q.topic) ?? { correct: 0, total: 0 };
      entry.total++;
      if (answers[i].selected === q.correct) entry.correct++;
      map.set(q.topic, entry);
    });
    return Array.from(map.entries()).map(([topic, data]) => ({ topic, ...data, pct: Math.round((data.correct / data.total) * 100) }));
  }, [phase, questions, answers]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ── Setup phase ─────────────────────────────────────────────────────────

  if (phase === "setup") {
    return (
      <>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-surface-1" />
          <div className="relative z-10 mx-auto max-w-5xl px-6 pt-32 pb-12 sm:pt-40 sm:pb-16">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="mono-tag text-lab-amber mb-6 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-lab-amber animate-glow-pulse" />
              [EXAM_SIMULATOR: READY]
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.35 }}
              className="text-display-xl text-foreground max-w-3xl">
              Exam<br /><span className="text-gradient-hero">Simulator</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.55 }}
              className="mt-6 text-body-lg text-muted-foreground max-w-xl">
              GATE-style timed mock exam. +{questions[0]?.marks ?? 1} for correct, -{questions[0]?.negativeMarks ?? 0.33} for wrong. No penalty for skipped.
            </motion.p>
          </div>
        </section>
        <div className="mx-auto max-w-md px-6 pb-24">
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div>
              <label className="text-sm font-medium text-foreground">Duration (minutes)</label>
              <div className="flex items-center gap-3 mt-2">
                {[15, 30, 45, 60].map((m) => (
                  <button key={m} onClick={() => setDurationMinutes(m)}
                    className={cn("px-4 py-2 rounded-lg border text-sm font-medium transition-all", durationMinutes === m ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                    {m}m
                  </button>
                ))}
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{questions.length} questions &middot; {totalMarks} total marks</p>
              <p>Topics: {[...new Set(questions.map((q) => q.topic))].join(", ")}</p>
            </div>
            <button onClick={startExam} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
              Start Exam
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Review phase ────────────────────────────────────────────────────────

  if (phase === "review") {
    return (
      <div className="mx-auto max-w-3xl px-6 pt-28 pb-24 space-y-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Exam Complete</h1>
          <p className="text-muted-foreground">Your score: <span className="text-primary font-bold text-2xl">{score.marks}/{totalMarks}</span></p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-lab-green mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{score.correct}</p>
            <p className="text-[0.65rem] text-muted-foreground">Correct</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <XCircle className="h-5 w-5 text-destructive mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{score.wrong}</p>
            <p className="text-[0.65rem] text-muted-foreground">Wrong (-{(score.wrong * (questions[0]?.negativeMarks ?? 0.33)).toFixed(2)})</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-lab-amber mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{score.skipped}</p>
            <p className="text-[0.65rem] text-muted-foreground">Skipped</p>
          </div>
        </div>

        {/* Topic analysis */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Topic-wise Analysis</h2>
          </div>
          <div className="space-y-3">
            {topicAnalysis.map((t) => (
              <div key={t.topic}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground">{t.topic}</span>
                  <span className="text-muted-foreground">{t.correct}/{t.total} ({t.pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${t.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Question review */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Question Review</h2>
          {questions.map((q, i) => {
            const a = answers[i];
            const isCorrect = a.selected === q.correct;
            const isSkipped = a.selected === null;
            return (
              <div key={q.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className={cn("mt-0.5 flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[0.65rem] font-bold",
                    isSkipped ? "bg-muted text-muted-foreground" : isCorrect ? "bg-lab-green/20 text-lab-green" : "bg-destructive/20 text-destructive"
                  )}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground mb-2">{q.text}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className={cn("px-3 py-1.5 rounded-md text-xs border",
                          oi === q.correct ? "border-lab-green/40 bg-lab-green/10 text-lab-green" :
                          oi === a.selected && oi !== q.correct ? "border-destructive/40 bg-destructive/10 text-destructive" :
                          "border-border text-muted-foreground"
                        )}>{opt}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={() => setPhase("setup")} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <RotateCcw className="h-4 w-4" /> Take Another Exam
        </button>
      </div>
    );
  }

  // ── Running phase ───────────────────────────────────────────────────────

  const q = questions[currentQ];
  const a = answers[currentQ];

  return (
    <div className="mx-auto max-w-3xl px-6 pt-20 pb-24">
      {/* Timer bar */}
      <div className="fixed top-14 left-0 right-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={cn("h-4 w-4", timeLeft < 60 ? "text-destructive animate-pulse" : "text-muted-foreground")} />
            <span className={cn("text-sm font-mono font-bold", timeLeft < 60 ? "text-destructive" : "text-foreground")}>{formatTime(timeLeft)}</span>
          </div>
          <span className="text-xs text-muted-foreground">Q {currentQ + 1}/{questions.length}</span>
          <button onClick={() => setPhase("review")} className="px-3 py-1 text-xs rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors">
            Submit
          </button>
        </div>
        <div className="h-0.5 bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      {/* Question nav dots */}
      <div className="flex flex-wrap gap-1.5 mb-6 mt-12">
        {questions.map((_, i) => (
          <button key={i} onClick={() => setCurrentQ(i)}
            className={cn("h-7 w-7 rounded-md text-[0.6rem] font-bold border transition-all",
              i === currentQ ? "border-primary bg-primary/10 text-primary" :
              answers[i]?.selected !== null ? "border-lab-green/40 bg-lab-green/10 text-lab-green" :
              answers[i]?.flagged ? "border-lab-amber/40 bg-lab-amber/10 text-lab-amber" :
              "border-border text-muted-foreground"
            )}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          <div className="rounded-xl border border-border bg-card p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground">{q.topic} &middot; {q.marks} mark{q.marks > 1 ? "s" : ""}</span>
              <button onClick={toggleFlag} className={cn("flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-all",
                a.flagged ? "border-lab-amber/40 text-lab-amber bg-lab-amber/10" : "border-border text-muted-foreground hover:text-foreground"
              )}>
                <Flag className="h-3 w-3" /> {a.flagged ? "Flagged" : "Flag"}
              </button>
            </div>
            <p className="text-foreground font-medium">{q.text}</p>
          </div>

          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <button key={oi} onClick={() => selectOption(oi)}
                className={cn("w-full text-left px-4 py-3 rounded-lg border text-sm transition-all",
                  a.selected === oi ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                )}>
                <span className="font-mono text-xs text-muted-foreground mr-3">{String.fromCharCode(65 + oi)}</span>
                {opt}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button disabled={currentQ === 0} onClick={() => setCurrentQ((c) => c - 1)}
          className="flex items-center gap-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all">
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        {currentQ < questions.length - 1 ? (
          <button onClick={() => setCurrentQ((c) => c + 1)}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-primary text-sm text-primary hover:bg-primary/10 transition-all">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={() => setPhase("review")}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
            Submit Exam
          </button>
        )}
      </div>
    </div>
  );
}
