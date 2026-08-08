import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LessonProgress {
  completedAt: string | null;
  lastVisitedAt: string;
  timeSpentSeconds: number;
}

interface ProgressState {
  lessons: Record<string, LessonProgress>;
  streak: number;
  lastStudyDate: string | null;
  dailyGoalMinutes: number;
  todayMinutes: number;

  markComplete: (lessonSlug: string) => void;
  recordVisit: (lessonSlug: string) => void;
  addStudyTime: (lessonSlug: string, seconds: number) => void;
  setDailyGoal: (minutes: number) => void;
  isComplete: (lessonSlug: string) => boolean;
  getProgress: (lessonSlug: string) => LessonProgress | undefined;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      lessons: {},
      streak: 0,
      lastStudyDate: null,
      dailyGoalMinutes: 60,
      todayMinutes: 0,

      markComplete: (lessonSlug) =>
        set((s) => ({
          lessons: {
            ...s.lessons,
            [lessonSlug]: {
              ...(s.lessons[lessonSlug] ?? {
                lastVisitedAt: new Date().toISOString(),
                timeSpentSeconds: 0,
              }),
              completedAt: new Date().toISOString(),
            },
          },
        })),

      recordVisit: (lessonSlug) =>
        set((s) => ({
          lessons: {
            ...s.lessons,
            [lessonSlug]: {
              completedAt: s.lessons[lessonSlug]?.completedAt ?? null,
              lastVisitedAt: new Date().toISOString(),
              timeSpentSeconds: s.lessons[lessonSlug]?.timeSpentSeconds ?? 0,
            },
          },
        })),

      addStudyTime: (lessonSlug, seconds) =>
        set((s) => {
          const existing = s.lessons[lessonSlug];
          return {
            lessons: {
              ...s.lessons,
              [lessonSlug]: {
                completedAt: existing?.completedAt ?? null,
                lastVisitedAt: new Date().toISOString(),
                timeSpentSeconds:
                  (existing?.timeSpentSeconds ?? 0) + seconds,
              },
            },
            todayMinutes: s.todayMinutes + seconds / 60,
          };
        }),

      setDailyGoal: (minutes) => set({ dailyGoalMinutes: minutes }),

      isComplete: (lessonSlug) =>
        !!get().lessons[lessonSlug]?.completedAt,

      getProgress: (lessonSlug) => get().lessons[lessonSlug],
    }),
    {
      name: "fayazlabs-progress",
      partialize: (s) => ({
        lessons: s.lessons,
        streak: s.streak,
        lastStudyDate: s.lastStudyDate,
        dailyGoalMinutes: s.dailyGoalMinutes,
      }),
    },
  ),
);
