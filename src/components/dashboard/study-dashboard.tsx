"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Clock,
  Target,
  TrendingUp,
  BookOpen,
  Brain,
  FlaskConical,
  Calendar,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAuth } from "@/lib/auth";
import * as analyticsApi from "@/lib/analytics/api";

// ── Types ────────────────────────────────────────────────────────────────

interface StudySession {
  date: string; // YYYY-MM-DD
  minutesStudied: number;
  lessonsCompleted: number;
  problemsSolved: number;
  flashcardsReviewed: number;
}

interface StudyData {
  sessions: StudySession[];
  dailyGoalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  bookmarks: string[];
}

const DEFAULT_DATA: StudyData = {
  sessions: [],
  dailyGoalMinutes: 60,
  currentStreak: 0,
  longestStreak: 0,
  bookmarks: [],
};

function getDateStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

// ── Component ────────────────────────────────────────────────────────────

export function StudyDashboard() {
  const { isAuthenticated } = useAuth();
  const [data, setData, hydrated] = useLocalStorage<StudyData>("fayazlabs-study", DEFAULT_DATA);
  const [apiLoading, setApiLoading] = useState(false);
  const [synced, setSynced] = useState(false);

  const syncFromApi = useCallback(async () => {
    if (!isAuthenticated || synced) return;
    setApiLoading(true);
    try {
      const [summary, daily] = await Promise.all([
        analyticsApi.getAnalyticsSummary(),
        analyticsApi.getDailyActivity(30),
      ]);

      const sessions: StudySession[] = daily.map((d) => ({
        date: d.date,
        minutesStudied: d.durationMinutes,
        lessonsCompleted: d.lessonsCompleted,
        problemsSolved: d.quizzesSubmitted,
        flashcardsReviewed: d.flashcardsReviewed,
      }));

      setData((prev) => ({
        ...prev,
        sessions,
        currentStreak: summary.streak.currentStreak,
        longestStreak: summary.streak.longestStreak,
      }));
      setSynced(true);
    } catch {
      // API unavailable — fall back to localStorage
    } finally {
      setApiLoading(false);
    }
  }, [isAuthenticated, synced, setData]);

  useEffect(() => {
    syncFromApi();
  }, [syncFromApi]);

  const today = useMemo(() => {
    const todayStr = getDateStr(0);
    return data.sessions.find((s) => s.date === todayStr) ?? {
      date: todayStr,
      minutesStudied: 0,
      lessonsCompleted: 0,
      problemsSolved: 0,
      flashcardsReviewed: 0,
    };
  }, [data.sessions]);

  const weekTotal = useMemo(() => {
    const weekAgo = getDateStr(-6);
    return data.sessions
      .filter((s) => s.date >= weekAgo)
      .reduce((sum, s) => sum + s.minutesStudied, 0);
  }, [data.sessions]);

  const goalProgress = Math.min(100, Math.round((today.minutesStudied / data.dailyGoalMinutes) * 100));

  const last7 = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const dateStr = getDateStr(i - 6);
      const session = data.sessions.find((s) => s.date === dateStr);
      return {
        day: new Date(dateStr).toLocaleDateString("en", { weekday: "short" }),
        minutes: session?.minutesStudied ?? 0,
      };
    });
  }, [data.sessions]);

  const maxMinutes = Math.max(...last7.map((d) => d.minutes), 1);

  if (!hydrated || apiLoading) {
    return (
      <div className="mx-auto max-w-5xl px-6 pt-32 pb-24">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-surface-1" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-glow-primary/[0.05] blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 pt-32 pb-12 sm:pt-40 sm:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mono-tag text-lab-green mb-6 flex items-center gap-2"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-lab-green animate-glow-pulse" />
            [STUDY_DASHBOARD: ACTIVE]
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35 }}
            className="text-display-xl text-foreground max-w-3xl"
          >
            Study
            <br />
            <span className="text-gradient-hero">Dashboard</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="mt-6 text-body-lg text-muted-foreground max-w-xl"
          >
            Track your study streak, daily progress, and learning velocity.
            {isAuthenticated
              ? "Synced with your account."
              : "Sign in to sync data across devices."}
          </motion.p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      <div className="mx-auto max-w-5xl px-6 pb-24 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            icon={<Flame className="h-5 w-5 text-orange-500" />}
            label="Current Streak"
            value={`${data.currentStreak} days`}
            sublabel={`Best: ${data.longestStreak} days`}
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-primary" />}
            label="Today"
            value={`${today.minutesStudied} min`}
            sublabel={`Goal: ${data.dailyGoalMinutes} min`}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-lab-green" />}
            label="This Week"
            value={`${Math.round(weekTotal / 60)}h ${weekTotal % 60}m`}
            sublabel={`${data.sessions.filter((s) => s.minutesStudied > 0).length}/7 active days`}
          />
          <StatCard
            icon={<Target className="h-5 w-5 text-chart-5" />}
            label="Daily Goal"
            value={`${goalProgress}%`}
            sublabel={`${today.minutesStudied}/${data.dailyGoalMinutes} min`}
          />
        </div>

        {/* Daily Goal Progress */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Daily Goal Progress</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setData((d) => ({ ...d, dailyGoalMinutes: Math.max(15, d.dailyGoalMinutes - 15) }))}
                className="px-2 py-0.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                -15m
              </button>
              <span className="text-xs text-muted-foreground">{data.dailyGoalMinutes}m</span>
              <button
                onClick={() => setData((d) => ({ ...d, dailyGoalMinutes: d.dailyGoalMinutes + 15 }))}
                className="px-2 py-0.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                +15m
              </button>
            </div>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${goalProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-chart-3"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {goalProgress >= 100
              ? "Goal achieved! Great work today."
              : `${data.dailyGoalMinutes - today.minutesStudied} minutes remaining to hit your daily goal.`}
          </p>
        </div>

        {/* Weekly Activity Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Weekly Activity</h2>
          </div>
          <div className="flex items-end gap-2 h-32">
            {last7.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[0.6rem] text-muted-foreground">{d.minutes}m</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.minutes / maxMinutes) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="w-full rounded-t-sm bg-primary/60 min-h-[2px]"
                />
                <span className="text-[0.6rem] text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Breakdown */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Today&apos;s Activity</h2>
          <div className="grid grid-cols-3 gap-4">
            <ActivityItem icon={<BookOpen className="h-4 w-4" />} label="Lessons" value={today.lessonsCompleted} />
            <ActivityItem icon={<FlaskConical className="h-4 w-4" />} label="Problems" value={today.problemsSolved} />
            <ActivityItem icon={<Brain className="h-4 w-4" />} label="Flashcards" value={today.flashcardsReviewed} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickAction href="/learning" icon={<BookOpen className="h-5 w-5" />} label="Continue Learning" description="Pick up where you left off" />
          <QuickAction href="/practice" icon={<FlaskConical className="h-5 w-5" />} label="Practice Problems" description="Solve problems by topic" />
          <QuickAction href="/flashcards" icon={<Brain className="h-5 w-5" />} label="Review Flashcards" description="Spaced repetition session" />
        </div>

        {/* Study Calendar Heatmap */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Study Calendar</h2>
          </div>
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: 30 }, (_, i) => {
              const dateStr = getDateStr(i - 29);
              const session = data.sessions.find((s) => s.date === dateStr);
              const intensity = session ? Math.min(4, Math.ceil(session.minutesStudied / 30)) : 0;
              const opacities = ["bg-muted", "bg-primary/20", "bg-primary/40", "bg-primary/60", "bg-primary/80"];
              return (
                <div
                  key={i}
                  title={`${dateStr}: ${session?.minutesStudied ?? 0} min`}
                  className={`h-4 w-4 rounded-sm ${opacities[intensity]}`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-1 mt-2 text-[0.6rem] text-muted-foreground">
            <span>Less</span>
            {["bg-muted", "bg-primary/20", "bg-primary/40", "bg-primary/60", "bg-primary/80"].map((c, i) => (
              <div key={i} className={`h-3 w-3 rounded-sm ${c}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-[0.65rem] text-muted-foreground mt-0.5">{sublabel}</p>
    </motion.div>
  );
}

function ActivityItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-lg font-bold text-foreground">{value}</p>
        <p className="text-[0.65rem] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({ href, icon, label, description }: { href: string; icon: React.ReactNode; label: string; description: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all"
    >
      <div className="text-primary">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-[0.65rem] text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
    </Link>
  );
}
