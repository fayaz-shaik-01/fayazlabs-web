import { authenticatedFetch } from "@/lib/auth/authenticated-fetch";

// ── Types ────────────────────────────────────────────────────────────────

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  activeToday: boolean;
}

export interface AnalyticsSummary {
  totalStudyMinutes: number;
  totalEvents: number;
  lessonsCompleted: number;
  quizzesSubmitted: number;
  flashcardsReviewed: number;
  streak: StreakData;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  eventsCount: number;
  lessonsCompleted: number;
  quizzesSubmitted: number;
  flashcardsReviewed: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  error: { code: string; message: string } | null;
  timestamp: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────

async function unwrap<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json();
  if (!json.success || json.data === null) {
    throw new Error(json.error?.message ?? json.message ?? "Request failed");
  }
  return json.data;
}

// ── API functions ────────────────────────────────────────────────────────

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const res = await authenticatedFetch("/api/v1/analytics/summary");
  return unwrap<AnalyticsSummary>(res);
}

export async function getDailyActivity(
  days: number = 30,
): Promise<DailyActivity[]> {
  const res = await authenticatedFetch(`/api/v1/analytics/daily?days=${days}`);
  return unwrap<DailyActivity[]>(res);
}

export async function getStreak(): Promise<StreakData> {
  const res = await authenticatedFetch("/api/v1/analytics/streak");
  return unwrap<StreakData>(res);
}
