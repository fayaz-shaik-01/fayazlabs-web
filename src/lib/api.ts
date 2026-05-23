const PLATFORM_URL = process.env.PLATFORM_URL ?? process.env.NEXT_PUBLIC_PLATFORM_URL ?? "http://localhost:8080";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  metadata?: QueryMetadata;
  timestamp: number;
}

export interface Source {
  title: string;
  slug: string;
  sourceType: string;
  snippet: string;
  relevanceScore: number;
  url: string;
}

export interface QueryMetadata {
  queryType: string;
  sourcesUsed: number;
  latencyMs: number;
  model: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  error: { code: string; message: string } | null;
  timestamp: string;
}

export interface ChatQueryResponse {
  answer: string;
  sources: Source[];
  metadata: QueryMetadata;
}

export type QueryType = "CHAT" | "NOTEBOOK_QA" | "ARCHITECTURE_EXPLAIN" | "PROJECT_QUERY" | "LESSON_MENTOR";

export interface LessonContext {
  lesson_slug: string;
  phase: number;
  tags: string[];
  has_authored_content: boolean;
}

export async function sendChatQuery(
  query: string,
  queryType: QueryType = "CHAT",
): Promise<ChatQueryResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, queryType }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Chat request failed: ${text}`);
  }

  const json: ApiResponse<ChatQueryResponse> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error?.message ?? json.message ?? "Unknown error");
  }

  return json.data;
}

export async function sendLessonMentorQuery(
  query: string,
  lessonContext: LessonContext,
): Promise<ChatQueryResponse> {
  const res = await fetch("/api/lesson/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, lessonContext }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Lesson mentor request failed: ${text}`);
  }

  const json: ApiResponse<ChatQueryResponse> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error?.message ?? json.message ?? "Unknown error");
  }

  return json.data;
}

export { PLATFORM_URL };
