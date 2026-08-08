"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/use-local-storage";
import * as progressApi from "@/lib/learning/api";
import { migrateLocalProgressToApi } from "@/lib/learning/progress-sync";
import type { TrackMeta } from "@/lib/curriculum";

// ── Types ────────────────────────────────────────────────────────────────

interface ProgressData {
  completedLessons: string[]; // "trackSlug|moduleSlug|lessonSlug"
  lastVisited: Record<string, string>; // trackSlug -> "moduleSlug|lessonSlug"
}

const DEFAULT_PROGRESS: ProgressData = { completedLessons: [], lastVisited: {} };

// ── Auth helper (check if JWT exists) ────────────────────────────────────

function hasAuthToken(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("fayazlabs_auth");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed.accessToken;
  } catch {
    return false;
  }
}

// ── Background sync: merge API progress into localStorage ────────────────

function useProgressSync(
  setData: (fn: (prev: ProgressData) => ProgressData) => void,
) {
  const didSync = useRef(false);

  useEffect(() => {
    if (didSync.current || !hasAuthToken()) return;
    didSync.current = true;

    // 1. Migrate localStorage → API (one-time)
    migrateLocalProgressToApi().catch(() => {});

    // 2. Fetch API progress and merge into localStorage
    progressApi
      .getAllProgress()
      .then((entries) => {
        const apiCompleted = entries
          .filter((e) => e.completed)
          .map((e) => e.lessonId);

        if (apiCompleted.length > 0) {
          setData((prev) => {
            const merged = new Set([...prev.completedLessons, ...apiCompleted]);
            return { ...prev, completedLessons: [...merged] };
          });
        }
      })
      .catch(() => {
        // API unavailable — localStorage-only mode
      });
  }, [setData]);
}

// ── Track Progress Bar (used in track page) ──────────────────────────────

export function TrackProgressBar({ track }: Readonly<{ track: TrackMeta }>) {
  const [data, setData] = useLocalStorage<ProgressData>("fayazlabs-progress", DEFAULT_PROGRESS);
  useProgressSync(setData);

  const stats = useMemo(() => {
    const totalLessons = track.modules.reduce((s, m) => s + m.lessons.length, 0);
    const completed = data.completedLessons.filter((l) => l.startsWith(track.slug + "|")).length;
    const pct = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
    return { totalLessons, completed, pct };
  }, [track, data.completedLessons]);

  if (stats.completed === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-lab-amber" />
          <span className="text-sm font-medium text-foreground">Track Progress</span>
        </div>
        <span className="text-xs text-muted-foreground">{stats.completed}/{stats.totalLessons} lessons</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${stats.pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-primary to-chart-3"
        />
      </div>
      <p className="text-[0.65rem] text-muted-foreground mt-1.5">
        {stats.pct === 100 ? "Track complete! 🎉" : `${stats.pct}% complete`}
      </p>
    </div>
  );
}

// ── Module Progress (used in track page for each module) ─────────────────

export function ModuleProgress({ track, moduleSlug }: Readonly<{ track: TrackMeta; moduleSlug: string }>) {
  const [data] = useLocalStorage<ProgressData>("fayazlabs-progress", DEFAULT_PROGRESS);

  const mod = track.modules.find((m) => m.slug === moduleSlug);
  if (!mod) return null;

  const completed = mod.lessons.filter((l) =>
    data.completedLessons.includes(`${track.slug}|${mod.slug}|${l.slug}`)
  ).length;
  const pct = mod.lessons.length > 0 ? Math.round((completed / mod.lessons.length) * 100) : 0;

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[0.55rem] text-muted-foreground whitespace-nowrap">{completed}/{mod.lessons.length}</span>
    </div>
  );
}

// ── Lesson completion toggle (used in lesson page) ───────────────────────

export function LessonCompleteToggle({
  trackSlug,
  moduleSlug,
  lessonSlug,
}: Readonly<{
  trackSlug: string;
  moduleSlug: string;
  lessonSlug: string;
}>) {
  const [data, setData, hydrated] = useLocalStorage<ProgressData>("fayazlabs-progress", DEFAULT_PROGRESS);
  useProgressSync(setData);

  const key = `${trackSlug}|${moduleSlug}|${lessonSlug}`;
  const isComplete = data.completedLessons.includes(key);

  const toggle = () => {
    // Optimistic localStorage update
    setData((prev) => ({
      ...prev,
      completedLessons: isComplete
        ? prev.completedLessons.filter((l) => l !== key)
        : [...prev.completedLessons, key],
      lastVisited: { ...prev.lastVisited, [trackSlug]: `${moduleSlug}|${lessonSlug}` },
    }));

    // Fire-and-forget API call when authenticated
    if (hasAuthToken()) {
      const apiCall = isComplete
        ? progressApi.unmarkLessonComplete(key)
        : progressApi.markLessonComplete(key);

      apiCall.catch((err) => {
        console.error("Failed to sync progress to API:", err);
      });
    }
  };

  if (!hydrated) return null;

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
        isComplete
          ? "border-lab-green/40 bg-lab-green/10 text-lab-green"
          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
      )}
    >
      {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
      {isComplete ? "Completed" : "Mark as Complete"}
    </button>
  );
}

// ── Next recommended lesson ──────────────────────────────────────────────

export function NextLesson({ track }: Readonly<{ track: TrackMeta }>) {
  const [data] = useLocalStorage<ProgressData>("fayazlabs-progress", DEFAULT_PROGRESS);

  const next = useMemo(() => {
    for (const mod of track.modules) {
      for (const lesson of mod.lessons) {
        const key = `${track.slug}|${mod.slug}|${lesson.slug}`;
        if (!data.completedLessons.includes(key)) {
          return { mod, lesson };
        }
      }
    }
    return null;
  }, [track, data.completedLessons]);

  if (!next) {
    return (
      <div className="rounded-xl border border-lab-green/30 bg-lab-green/5 p-4 flex items-center gap-3">
        <Trophy className="h-5 w-5 text-lab-green" />
        <div>
          <p className="text-sm font-medium text-foreground">Track Complete!</p>
          <p className="text-xs text-muted-foreground">You&apos;ve completed all lessons in this track.</p>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/learning/${track.slug}/${next.mod.slug}/${next.lesson.slug}`}
      className="group rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:border-primary/30 transition-all"
    >
      <Zap className="h-5 w-5 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[0.65rem] text-muted-foreground">Recommended Next</p>
        <p className="text-sm font-medium text-foreground truncate">{next.lesson.title}</p>
        <p className="text-[0.6rem] text-muted-foreground">{next.mod.title}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
    </Link>
  );
}
