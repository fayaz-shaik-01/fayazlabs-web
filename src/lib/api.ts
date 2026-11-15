import { getAccessToken } from "@/lib/auth/token-store";
import { refreshTokens } from "@/lib/course-api/client";

const PLATFORM_URL = process.env.PLATFORM_URL ?? process.env.NEXT_PUBLIC_PLATFORM_URL ?? "http://localhost:8080";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  metadata?: QueryMetadata;
  timestamp: number;
  /** Assistant replies type out over this many ms (set once, when the reply arrives). */
  revealMs?: number;
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
  track?: string;
  module?: string;
}

/** Thrown when the visitor isn't signed in (or the session can't be refreshed). The UI shows a sign-in prompt. */
export class AuthRequiredError extends Error {
  constructor(message = "Sign in to use the AI assistant") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

/** POST to one of our AI proxy routes with the caller's access token. Refreshes once on a 401. */
async function postAi(path: string, payload: unknown, failure: string): Promise<ChatQueryResponse> {
  const send = (token: string) =>
    fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

  const token = getAccessToken();
  if (!token) throw new AuthRequiredError();

  let res = await send(token);
  if (res.status === 401) {
    try {
      res = await send((await refreshTokens()).accessToken);
    } catch {
      throw new AuthRequiredError();
    }
    if (res.status === 401) throw new AuthRequiredError();
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`${failure}: ${text}`);
  }

  const json: ApiResponse<ChatQueryResponse> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error?.message ?? json.message ?? "Unknown error");
  }

  return json.data;
}

export function sendChatQuery(query: string, queryType: QueryType = "CHAT"): Promise<ChatQueryResponse> {
  return postAi("/api/chat", { query, queryType }, "Chat request failed");
}

export function sendLessonMentorQuery(query: string, lessonContext: LessonContext): Promise<ChatQueryResponse> {
  return postAi("/api/lesson/query", { query, lessonContext }, "Lesson mentor request failed");
}

export { PLATFORM_URL };
