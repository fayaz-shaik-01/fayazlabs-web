"use client";

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────

interface Flashcard {
  front: string;
  back: string;
  hint?: string;
  tags?: string[];
}

interface FlashcardDeckProps {
  readonly cards: Flashcard[];
  readonly title?: string;
  readonly shuffle?: boolean;
  readonly showProgress?: boolean;
  readonly showHints?: boolean;
}

// ── Component ───────────────────────────────────────────────────────────

export default function FlashcardDeck({
  cards,
  title,
  shuffle = false,
  showProgress = true,
  showHints = true,
}: FlashcardDeckProps) {
  const deck = useMemo(() => {
    if (!shuffle) return cards;
    const arr = [...cards];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [cards, shuffle]);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [known, setKnown] = useState<Set<number>>(() => new Set());
  const [review, setReview] = useState<Set<number>>(() => new Set());

  const card = deck[index];

  const flip = useCallback(() => setFlipped((f) => !f), []);

  const next = useCallback(() => {
    if (index < deck.length - 1) {
      setIndex((i) => i + 1);
      setFlipped(false);
      setShowHint(false);
    }
  }, [index, deck.length]);

  const prev = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
      setFlipped(false);
      setShowHint(false);
    }
  }, [index]);

  const markKnown = useCallback(() => {
    setKnown((s) => {
      const ns = new Set(s);
      ns.add(index);
      return ns;
    });
    setReview((s) => {
      const ns = new Set(s);
      ns.delete(index);
      return ns;
    });
    next();
  }, [index, next]);

  const markReview = useCallback(() => {
    setReview((s) => {
      const ns = new Set(s);
      ns.add(index);
      return ns;
    });
    setKnown((s) => {
      const ns = new Set(s);
      ns.delete(index);
      return ns;
    });
    next();
  }, [index, next]);

  const resetDeck = useCallback(() => {
    setIndex(0);
    setFlipped(false);
    setShowHint(false);
    setKnown(new Set());
    setReview(new Set());
  }, []);

  if (!card) return null;

  const total = deck.length;
  const knownCount = known.size;
  const reviewCount = review.size;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      {title && <div className="text-sm font-medium text-muted-foreground">{title}</div>}

      {/* Progress bar */}
      {showProgress && (
        <div className="w-full flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-foreground/5 overflow-hidden">
            <div
              className="h-full bg-emerald-400/50 transition-all duration-300"
              style={{ width: `${(knownCount / total) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            {knownCount}/{total}
          </span>
        </div>
      )}

      {/* Card */}
      <button
        type="button"
        onClick={flip}
        className={cn(
          "w-full min-h-[180px] p-6 rounded-xl border transition-all duration-300 cursor-pointer text-left",
          "hover:shadow-md",
          flipped
            ? "bg-primary/[0.03] border-primary/20"
            : "bg-foreground/[0.02] border-foreground/10",
          known.has(index) && "border-l-4 border-l-emerald-400",
          review.has(index) && "border-l-4 border-l-amber-400",
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <span className={cn(
            "text-[10px] font-mono px-1.5 py-0.5 rounded",
            flipped ? "bg-primary/10 text-primary" : "bg-foreground/5 text-foreground/40",
          )}>
            {flipped ? "ANSWER" : "QUESTION"}
          </span>
          {card.tags && card.tags.length > 0 && (
            <div className="flex gap-1">
              {card.tags.map((tag) => (
                <span key={tag} className="text-[8px] font-mono px-1 py-0.5 rounded bg-foreground/5 text-foreground/30">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
          {flipped ? card.back : card.front}
        </div>

        {/* Hint */}
        {!flipped && showHints && card.hint && (
          <div className="mt-3">
            {showHint ? (
              <p className="text-xs text-amber-400/70 italic">{card.hint}</p>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHint(true);
                }}
                className="text-[10px] font-mono text-foreground/30 hover:text-foreground/50 transition-colors"
              >
                Show hint
              </button>
            )}
          </div>
        )}
      </button>

      {/* Controls */}
      <div className="flex items-center gap-2 w-full justify-center">
        <button type="button" onClick={prev} disabled={index === 0}
          className="px-3 py-1.5 text-xs font-mono rounded bg-foreground/5 text-foreground/60 hover:bg-foreground/10 disabled:opacity-30 transition-colors">
          ← Prev
        </button>
        <span className="text-xs font-mono text-muted-foreground px-2">
          {index + 1} / {total}
        </span>
        <button type="button" onClick={next} disabled={index === total - 1}
          className="px-3 py-1.5 text-xs font-mono rounded bg-foreground/5 text-foreground/60 hover:bg-foreground/10 disabled:opacity-30 transition-colors">
          Next →
        </button>
      </div>

      {/* Mark buttons */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={markKnown}
          className="px-3 py-1.5 text-xs font-mono rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
          ✓ Got it
        </button>
        <button type="button" onClick={markReview}
          className="px-3 py-1.5 text-xs font-mono rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors">
          ↻ Review
        </button>
        <button type="button" onClick={resetDeck}
          className="px-3 py-1.5 text-xs font-mono rounded bg-foreground/5 text-foreground/40 hover:bg-foreground/10 transition-colors">
          Reset
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
        <span className="text-emerald-400">✓ Known: {knownCount}</span>
        <span className="text-amber-400">↻ Review: {reviewCount}</span>
        <span>Remaining: {total - knownCount - reviewCount}</span>
      </div>
    </div>
  );
}
