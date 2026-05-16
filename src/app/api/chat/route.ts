import { NextRequest, NextResponse } from "next/server";
import { PLATFORM_URL } from "@/lib/api";

const ENDPOINT_MAP: Record<string, string> = {
  CHAT: "/api/chat/query",
  NOTEBOOK_QA: "/api/notebook/ask",
  ARCHITECTURE_EXPLAIN: "/api/architecture/explain",
  PROJECT_QUERY: "/api/projects/query",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, queryType = "CHAT" } = body as {
      query: string;
      queryType?: string;
    };

    if (!query?.trim()) {
      return NextResponse.json(
        { success: false, data: null, message: "Query is required", error: { code: "VALIDATION", message: "Query is required" }, timestamp: new Date().toISOString() },
        { status: 400 },
      );
    }

    const endpoint = ENDPOINT_MAP[queryType] ?? ENDPOINT_MAP.CHAT;
    const upstream = `${PLATFORM_URL}${endpoint}`;

    const res = await fetch(upstream, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, queryType, contentFilters: [], metadata: {} }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Failed to reach AI service",
        error: { code: "SERVICE_UNAVAILABLE", message: "AI service is currently unavailable. Please try again later." },
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
