import { authenticatedFetch } from "@/lib/auth/authenticated-fetch";

// ── Types ────────────────────────────────────────────────────────────────

export interface SubmitAnswerRequest {
  problemId: string;
  trackSlug: string;
  moduleSlug: string;
  selectedAnswer: string;
  correctAnswer: string;
  timeTakenSeconds: number;
}

export interface AttemptResponse {
  id: number;
  problemId: string;
  trackSlug: string;
  moduleSlug: string;
  selectedAnswer: string;
  correctAnswer: string;
  correct: boolean;
  timeTakenSeconds: number;
  createdAt: string;
}

export interface PracticeStatsResponse {
  totalAttempts: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  trackSlug: string | null;
  moduleSlug: string | null;
}

export interface BulkSubmitRequest {
  answers: SubmitAnswerRequest[];
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

export async function submitAnswer(
  request: SubmitAnswerRequest,
): Promise<AttemptResponse> {
  const res = await authenticatedFetch("/api/v1/practice/submit", {
    method: "POST",
    body: JSON.stringify(request),
  });
  return unwrap<AttemptResponse>(res);
}

export async function bulkSubmitAnswers(
  answers: SubmitAnswerRequest[],
): Promise<AttemptResponse[]> {
  const res = await authenticatedFetch("/api/v1/practice/bulk-submit", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
  return unwrap<AttemptResponse[]>(res);
}

export async function getPracticeHistory(
  trackSlug?: string,
  moduleSlug?: string,
): Promise<AttemptResponse[]> {
  let path = "/api/v1/practice/history";
  if (trackSlug && moduleSlug) {
    path += `/${encodeURIComponent(trackSlug)}/${encodeURIComponent(moduleSlug)}`;
  } else if (trackSlug) {
    path += `/${encodeURIComponent(trackSlug)}`;
  }
  const res = await authenticatedFetch(path);
  return unwrap<AttemptResponse[]>(res);
}

export async function getPracticeStats(
  trackSlug?: string,
  moduleSlug?: string,
): Promise<PracticeStatsResponse> {
  let path = "/api/v1/practice/stats";
  if (trackSlug && moduleSlug) {
    path += `/${encodeURIComponent(trackSlug)}/${encodeURIComponent(moduleSlug)}`;
  } else if (trackSlug) {
    path += `/${encodeURIComponent(trackSlug)}`;
  }
  const res = await authenticatedFetch(path);
  return unwrap<PracticeStatsResponse>(res);
}
