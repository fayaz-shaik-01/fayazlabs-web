import { authenticatedFetch } from "@/lib/auth/authenticated-fetch";

// ── Types ────────────────────────────────────────────────────────────────

export interface ProgressEntry {
  lessonId: string;
  completed: boolean;
  completedAt: string | null;
  timeSpentMinutes: number;
  lastAccessedAt: string | null;
}

export interface BulkProgressEntry {
  lessonId: string;
  completed: boolean;
  completedAt: string | null;
  timeSpentMinutes: number;
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

export async function getAllProgress(): Promise<ProgressEntry[]> {
  const res = await authenticatedFetch("/api/v1/progress");
  return unwrap<ProgressEntry[]>(res);
}

export async function getLessonProgress(
  lessonId: string,
): Promise<ProgressEntry | null> {
  const res = await authenticatedFetch(`/api/v1/progress/${encodeURIComponent(lessonId)}`);
  const json: ApiResponse<ProgressEntry> = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message ?? json.message ?? "Request failed");
  }
  return json.data;
}

export async function markLessonComplete(
  lessonId: string,
): Promise<ProgressEntry> {
  const res = await authenticatedFetch(`/api/v1/progress/${encodeURIComponent(lessonId)}/complete`, {
    method: "POST",
  });
  return unwrap<ProgressEntry>(res);
}

export async function unmarkLessonComplete(
  lessonId: string,
): Promise<void> {
  const res = await authenticatedFetch(`/api/v1/progress/${encodeURIComponent(lessonId)}/complete`, {
    method: "DELETE",
  });
  const json: ApiResponse<void> = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message ?? json.message ?? "Request failed");
  }
}

export async function updateTimeSpent(
  lessonId: string,
  minutes: number,
): Promise<ProgressEntry> {
  const res = await authenticatedFetch(`/api/v1/progress/${encodeURIComponent(lessonId)}/time`, {
    method: "POST",
    body: JSON.stringify({ minutes }),
  });
  return unwrap<ProgressEntry>(res);
}

export async function bulkImportProgress(
  entries: BulkProgressEntry[],
): Promise<{ imported: number }> {
  const res = await authenticatedFetch("/api/v1/progress/bulk-import", {
    method: "POST",
    body: JSON.stringify({ entries }),
  });
  return unwrap<{ imported: number }>(res);
}
