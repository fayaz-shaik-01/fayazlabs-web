import { NextRequest, NextResponse } from "next/server";
import { PLATFORM_URL } from "@/lib/api";
import type { LessonContext } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, lessonContext } = body as {
      query: string;
      lessonContext: LessonContext;
    };

    if (!query?.trim()) {
      return NextResponse.json(
        { success: false, data: null, message: "Query is required", error: { code: "VALIDATION", message: "Query is required" }, timestamp: new Date().toISOString() },
        { status: 400 },
      );
    }

    if (!lessonContext?.lesson_slug) {
      return NextResponse.json(
        { success: false, data: null, message: "lessonContext.lesson_slug is required", error: { code: "VALIDATION", message: "lessonContext.lesson_slug is required" }, timestamp: new Date().toISOString() },
        { status: 400 },
      );
    }

    const upstream = `${PLATFORM_URL}/api/lesson/query`;

    const res = await fetch(upstream, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        mode: "LESSON_MENTOR",
        lessonContext,
        metadata: {},
      }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Failed to reach AI service",
        error: { code: "SERVICE_UNAVAILABLE", message: "AI Mentor is currently unavailable. Please try again later." },
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
