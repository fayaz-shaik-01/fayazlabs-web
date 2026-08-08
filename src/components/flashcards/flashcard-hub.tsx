"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Filter,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllTracks } from "@/lib/curriculum";
import { useAuth } from "@/lib/auth/auth-context";
import * as flashcardApi from "@/lib/flashcards/api";
import type { FlashcardStatsResponse } from "@/lib/flashcards/api";

// ── Leitner Box System ───────────────────────────────────────────────────

const LEITNER_BOXES = [
  { label: "Box 1 — Daily", interval: 1, color: "text-lab-red" },
  { label: "Box 2 — Every 3 days", interval: 3, color: "text-lab-amber" },
  { label: "Box 3 — Weekly", interval: 7, color: "text-chart-1" },
  { label: "Box 4 — Biweekly", interval: 14, color: "text-lab-green" },
  { label: "Box 5 — Monthly", interval: 30, color: "text-primary" },
];

// ── Types ────────────────────────────────────────────────────────────────

interface Flashcard {
  id: string;
  front: string;
  back: string;
  track: string;
  module: string;
  tags: string[];
  box: number;
  lastReviewed: number | null;
}

// ── Sample Flashcards ────────────────────────────────────────────────────

const sampleFlashcards: Flashcard[] = [
  {
    id: "fc-mat-001",
    front: "What is the rank-nullity theorem?",
    back: "For an m×n matrix A: rank(A) + nullity(A) = n (number of columns). Rank = dim(column space), Nullity = dim(null space).",
    track: "gate-ra-2027",
    module: "linear-algebra",
    tags: ["rank", "null-space"],
    box: 1,
    lastReviewed: null,
  },
  {
    id: "fc-mat-002",
    front: "For a skew-symmetric matrix A, what is Aᵀ?",
    back: "Aᵀ = −A. All diagonal elements must be 0 (since aᵢᵢ = −aᵢᵢ ⟹ aᵢᵢ = 0).",
    track: "gate-ra-2027",
    module: "linear-algebra",
    tags: ["skew-symmetric", "transpose"],
    box: 1,
    lastReviewed: null,
  },
  {
    id: "fc-mat-003",
    front: "What is the determinant of an orthogonal matrix?",
    back: "det(Q) = ±1. Proof: QᵀQ = I ⟹ det(Qᵀ)·det(Q) = 1 ⟹ [det(Q)]² = 1.",
    track: "gate-ra-2027",
    module: "linear-algebra",
    tags: ["orthogonal", "determinant"],
    box: 1,
    lastReviewed: null,
  },
  {
    id: "fc-mat-004",
    front: "Any square matrix can be uniquely decomposed into which two parts?",
    back: "Symmetric + Skew-Symmetric: A = (A + Aᵀ)/2 + (A − Aᵀ)/2. The first part is symmetric, the second is skew-symmetric.",
    track: "gate-ra-2027",
    module: "linear-algebra",
    tags: ["decomposition", "symmetric"],
    box: 1,
    lastReviewed: null,
  },
  {
    id: "fc-mat-005",
    front: "What condition must hold for matrix multiplication AB to be defined?",
    back: "Number of columns of A must equal number of rows of B. If A is m×n and B is n×p, then AB is m×p.",
    track: "gate-ra-2027",
    module: "linear-algebra",
    tags: ["multiplication", "matrix"],
    box: 1,
    lastReviewed: null,
  },
  {
    id: "fc-cs-001",
    front: "What is the Routh stability criterion?",
    back: "A system is stable iff all elements in the first column of the Routh array are positive (no sign changes). Number of sign changes = number of RHP poles.",
    track: "gate-ra-2027",
    module: "control-systems",
    tags: ["stability", "routh-hurwitz"],
    box: 1,
    lastReviewed: null,
  },
  {
    id: "fc-cs-002",
    front: "What is the gain margin in Bode plot analysis?",
    back: "GM = −20·log₁₀|G(jω_pc)| dB, where ω_pc is the phase crossover frequency (where phase = −180°). GM > 0 dB means stable.",
    track: "gate-ra-2027",
    module: "control-systems",
    tags: ["bode", "gain-margin"],
    box: 1,
    lastReviewed: null,
  },
  {
    id: "fc-cs-003",
    front: "What are the three terms in a PID controller?",
    back: "P (proportional): reduces steady-state error. I (integral): eliminates steady-state error. D (derivative): improves transient response and stability.",
    track: "gate-ra-2027",
    module: "control-systems",
    tags: ["PID", "controller"],
    box: 1,
    lastReviewed: null,
  },
];

// ── Flashcard Component ──────────────────────────────────────────────────

function FlashcardCard({
  card,
  onKnow,
  onDontKnow,
}: Readonly<{
  card: Flashcard;
  onKnow: () => void;
  onDontKnow: () => void;
}>) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Card */}
      <motion.div
        className="relative cursor-pointer perspective-1000"
        onClick={() => setFlipped(!flipped)}
        style={{ minHeight: 280 }}
      >
        <AnimatePresence mode="wait">
          {!flipped ? (
            <motion.div
              key="front"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-8 sm:p-10 flex flex-col items-center justify-center text-center"
              style={{ minHeight: 280 }}
            >
              <div className="mono-tag text-primary mb-4 flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5" /> QUESTION
              </div>
              <p className="text-lg sm:text-xl text-foreground leading-relaxed font-medium">
                {card.front}
              </p>
              <p className="mt-6 text-xs text-muted-foreground/40">
                Click to reveal answer
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl border border-primary/20 bg-primary/[0.03] p-8 sm:p-10 flex flex-col items-center justify-center text-center"
              style={{ minHeight: 280 }}
            >
              <div className="mono-tag text-lab-green mb-4 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> ANSWER
              </div>
              <p className="text-base sm:text-lg text-foreground/90 leading-relaxed">
                {card.back}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tags */}
      <div className="mt-4 flex justify-center gap-1.5">
        {card.tags.map((tag) => (
          <span
            key={tag}
            className="text-[0.625rem] px-2 py-0.5 rounded-full bg-white/[0.04] text-muted-foreground/50 font-mono"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Actions (only show when flipped) */}
      {flipped && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-center justify-center gap-4"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFlipped(false);
              onDontKnow();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-lab-red/30 bg-lab-red/5 text-lab-red text-sm font-medium hover:bg-lab-red/10 transition-colors"
          >
            <XCircle className="h-4 w-4" />
            {"Didn't Know"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFlipped(false);
              onKnow();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-lab-green/30 bg-lab-green/5 text-lab-green text-sm font-medium hover:bg-lab-green/10 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            Got It
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ── Leitner Box Visualization ────────────────────────────────────────────

function LeitnerBoxes({ cards }: Readonly<{ cards: Flashcard[] }>) {
  const boxCounts = LEITNER_BOXES.map((_, i) =>
    cards.filter((c) => c.box === i + 1).length
  );

  return (
    <div className="grid grid-cols-5 gap-2 mb-8">
      {LEITNER_BOXES.map((box, i) => (
        <div
          key={box.label}
          className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center"
        >
          <div className={cn("text-lg font-bold font-mono", box.color)}>
            {boxCounts[i]}
          </div>
          <div className="text-[0.5625rem] text-muted-foreground/50 font-mono mt-0.5">
            BOX {i + 1}
          </div>
          <div className="text-[0.5rem] text-muted-foreground/30 mt-0.5">
            {box.interval === 1 ? "Daily" : `${box.interval}d`}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Hub ─────────────────────────────────────────────────────────────

export function FlashcardHub() {
  const [cards, setCards] = useState<Flashcard[]>(sampleFlashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });
  const [apiStats, setApiStats] = useState<FlashcardStatsResponse | null>(null);
  const tracks = getAllTracks();
  const { isAuthenticated } = useAuth();

  // Load API stats and card state on mount (if authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    flashcardApi.getFlashcardStats().then(setApiStats).catch(() => {});
    flashcardApi
      .getAllCards()
      .then((apiCards) => {
        if (apiCards.length > 0) {
          setCards((prev) =>
            prev.map((c) => {
              const remote = apiCards.find((r) => r.cardId === c.id);
              return remote
                ? { ...c, box: remote.boxNumber, lastReviewed: remote.nextReview ? Date.parse(remote.nextReview) : c.lastReviewed }
                : c;
            })
          );
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const filteredCards = useMemo(
    () =>
      cards.filter((c) => {
        if (selectedTrack !== "all" && c.track !== selectedTrack) return false;
        return true;
      }),
    [cards, selectedTrack]
  );

  const currentCard = filteredCards[currentIndex % filteredCards.length];
  const totalReviewed = sessionStats.correct + sessionStats.incorrect;

  const syncReview = useCallback(
    (card: Flashcard, quality: number) => {
      if (!isAuthenticated) return;
      flashcardApi
        .reviewCard({
          cardId: card.id,
          trackSlug: card.track,
          moduleSlug: card.module,
          quality,
        })
        .then(() => {
          flashcardApi.getFlashcardStats().then(setApiStats).catch(() => {});
        })
        .catch(() => {});
    },
    [isAuthenticated],
  );

  const handleKnow = useCallback(() => {
    if (!currentCard) return;
    setCards((prev) =>
      prev.map((c) =>
        c.id === currentCard.id
          ? { ...c, box: Math.min(c.box + 1, 5), lastReviewed: Date.now() }
          : c
      )
    );
    setSessionStats((prev) => ({ ...prev, correct: prev.correct + 1 }));
    setCurrentIndex((prev) => prev + 1);
    syncReview(currentCard, 4);
  }, [currentCard, syncReview]);

  const handleDontKnow = useCallback(() => {
    if (!currentCard) return;
    setCards((prev) =>
      prev.map((c) =>
        c.id === currentCard.id
          ? { ...c, box: 1, lastReviewed: Date.now() }
          : c
      )
    );
    setSessionStats((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
    setCurrentIndex((prev) => prev + 1);
    syncReview(currentCard, 1);
  }, [currentCard, syncReview]);

  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setSessionStats({ correct: 0, incorrect: 0 });
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-surface-1" />
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] rounded-full bg-glow-violet/[0.05] blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-32 pb-16 sm:pt-40 sm:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mono-tag text-lab-green mb-6 flex items-center gap-2"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-lab-green animate-glow-pulse" />
            [SPACED_REPETITION: LEITNER]
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35 }}
            className="text-display-xl text-foreground max-w-3xl"
          >
            Flashcards
            <br />
            <span className="text-gradient-hero">Spaced Repetition</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="mt-6 text-body-lg text-muted-foreground max-w-xl"
          >
            Master concepts with the Leitner box system. Cards you know move to
            higher boxes (less frequent review); cards you miss go back to Box 1.
          </motion.p>

          {/* Session stats */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="mt-8 flex items-center gap-6"
          >
            <div className="border-l border-lab-green/20 pl-3">
              <div className="text-xl font-bold text-foreground font-mono">{filteredCards.length}</div>
              <div className="mono-tag text-muted-foreground mt-0.5 flex items-center gap-1">
                <Brain className="h-3 w-3" /> CARDS
              </div>
            </div>
            {apiStats && apiStats.totalCards > 0 && (
              <div className="border-l border-primary/20 pl-3">
                <div className="text-xl font-bold text-primary font-mono">{apiStats.masteredCards}</div>
                <div className="mono-tag text-muted-foreground mt-0.5 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> MASTERED
                </div>
              </div>
            )}
            {totalReviewed > 0 && (
              <>
                <div className="border-l border-lab-green/20 pl-3">
                  <div className="text-xl font-bold text-lab-green font-mono">{sessionStats.correct}</div>
                  <div className="mono-tag text-muted-foreground mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> CORRECT
                  </div>
                </div>
                <div className="border-l border-lab-red/20 pl-3">
                  <div className="text-xl font-bold text-lab-red font-mono">{sessionStats.incorrect}</div>
                  <div className="mono-tag text-muted-foreground mt-0.5 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> MISSED
                  </div>
                </div>
                <div className="border-l border-primary/20 pl-3">
                  <div className="text-xl font-bold text-primary font-mono">
                    {totalReviewed > 0 ? Math.round((sessionStats.correct / totalReviewed) * 100) : 0}%
                  </div>
                  <div className="mono-tag text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Flame className="h-3 w-3" /> ACCURACY
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 pb-24">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Track:
          </div>
          <select
            value={selectedTrack}
            onChange={(e) => {
              setSelectedTrack(e.target.value);
              setCurrentIndex(0);
            }}
            className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-xs text-foreground focus:border-primary/40 focus:outline-none"
          >
            <option value="all">All Tracks</option>
            {tracks.map((t) => (
              <option key={t.slug} value={t.slug}>{t.title}</option>
            ))}
          </select>

          {totalReviewed > 0 && (
            <button
              onClick={handleReset}
              className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <RotateCcw className="h-3 w-3" /> Reset Session
            </button>
          )}
        </div>

        {/* Leitner Boxes */}
        <LeitnerBoxes cards={filteredCards} />

        {/* Card Review Area */}
        {filteredCards.length > 0 ? (
          <>
            {/* Progress */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs text-muted-foreground/50 font-mono flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Card {(currentIndex % filteredCards.length) + 1} of {filteredCards.length}
              </span>
              <div className="h-1 flex-1 mx-4 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all duration-300"
                  style={{
                    width: `${(((currentIndex % filteredCards.length) + 1) / filteredCards.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground/50 font-mono">
                {Math.round((((currentIndex % filteredCards.length) + 1) / filteredCards.length) * 100)}%
              </span>
            </div>

            {/* Current Flashcard */}
            {currentCard && (
              <FlashcardCard
                card={currentCard}
                onKnow={handleKnow}
                onDontKnow={handleDontKnow}
              />
            )}
          </>
        ) : (
          <div className="text-center py-16 text-muted-foreground/50">
            <Brain className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No flashcards match your filters.</p>
          </div>
        )}
      </div>
    </>
  );
}
