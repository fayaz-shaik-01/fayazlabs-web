import { authenticatedFetch } from "@/lib/auth/authenticated-fetch";

// ── Types ────────────────────────────────────────────────────────────────

export interface ReviewCardRequest {
  cardId: string;
  trackSlug: string;
  moduleSlug: string;
  quality: number; // 0-5 SM-2 quality rating
}

export interface ReviewCardResponse {
  id: number;
  cardId: string;
  trackSlug: string;
  moduleSlug: string;
  boxNumber: number;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReview: string | null;
  totalReviews: number;
  correctCount: number;
}

export interface FlashcardStatsResponse {
  totalCards: number;
  dueCards: number;
  masteredCards: number;
  averageEaseFactor: number;
  trackSlug: string | null;
  moduleSlug: string | null;
}

export interface BulkReviewRequest {
  reviews: ReviewCardRequest[];
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

export async function reviewCard(
  request: ReviewCardRequest,
): Promise<ReviewCardResponse> {
  const res = await authenticatedFetch("/api/v1/flashcards/review", {
    method: "POST",
    body: JSON.stringify(request),
  });
  return unwrap<ReviewCardResponse>(res);
}

export async function bulkReviewCards(
  reviews: ReviewCardRequest[],
): Promise<{ reviewed: number }> {
  const res = await authenticatedFetch("/api/v1/flashcards/bulk-review", {
    method: "POST",
    body: JSON.stringify({ reviews }),
  });
  return unwrap<{ reviewed: number }>(res);
}

export async function getDueCards(
  trackSlug?: string,
): Promise<ReviewCardResponse[]> {
  let path = "/api/v1/flashcards/due";
  if (trackSlug) {
    path += `/${encodeURIComponent(trackSlug)}`;
  }
  const res = await authenticatedFetch(path);
  return unwrap<ReviewCardResponse[]>(res);
}

export async function getAllCards(
  trackSlug?: string,
): Promise<ReviewCardResponse[]> {
  let path = "/api/v1/flashcards/cards";
  if (trackSlug) {
    path += `/${encodeURIComponent(trackSlug)}`;
  }
  const res = await authenticatedFetch(path);
  return unwrap<ReviewCardResponse[]>(res);
}

export async function getFlashcardStats(
  trackSlug?: string,
): Promise<FlashcardStatsResponse> {
  let path = "/api/v1/flashcards/stats";
  if (trackSlug) {
    path += `/${encodeURIComponent(trackSlug)}`;
  }
  const res = await authenticatedFetch(path);
  return unwrap<FlashcardStatsResponse>(res);
}
