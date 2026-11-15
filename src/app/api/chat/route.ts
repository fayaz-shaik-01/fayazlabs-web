import { NextRequest, NextResponse } from "next/server";
import { PLATFORM_URL } from "@/lib/api";
import { errorResponse, getBearerToken, unauthorized } from "@/lib/ai-proxy";

const ENDPOINT_MAP: Record<string, string> = {
  CHAT: "/api/chat/query",
  NOTEBOOK_QA: "/api/notebook/ask",
  ARCHITECTURE_EXPLAIN: "/api/architecture/explain",
  PROJECT_QUERY: "/api/projects/query",
  LESSON_MENTOR: "/api/lesson/query",
};

export async function POST(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) return unauthorized();

  try {
    const body = await request.json();
    const { query, queryType = "CHAT", lessonContext } = body as {
      query: string;
      queryType?: string;
      lessonContext?: { lesson_slug?: string };
    };

    if (!query?.trim()) return errorResponse(400, "VALIDATION", "Query is required");

    const endpoint = ENDPOINT_MAP[queryType] ?? ENDPOINT_MAP.CHAT;
    const upstream = `${PLATFORM_URL}${endpoint}`;

    let payload: Record<string, unknown> = { query, queryType, contentFilters: [], metadata: {} };
    if (queryType === "LESSON_MENTOR") {
      if (!lessonContext?.lesson_slug) {
        return errorResponse(400, "VALIDATION", "lessonContext.lesson_slug is required");
      }
      payload = { query, mode: "LESSON_MENTOR", lessonContext, metadata: {} };
    }

    const res = await fetch(upstream, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return errorResponse(503, "SERVICE_UNAVAILABLE", "AI service is currently unavailable. Please try again later.");
  }
}
