import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PLATFORM_URL } from "@/lib/tax/api";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("tax-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

  try {
    const res = await fetch(`${PLATFORM_URL}/api/tax/chat/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ success: false, data: null, message: "Service unavailable", error: { code: "SERVICE_UNAVAILABLE", message: "Service unavailable" }, timestamp: new Date().toISOString() }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tax-token")?.value;
  if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

  try {
    const body = await request.json();
    const res = await fetch(`${PLATFORM_URL}/api/tax/chat/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ success: false, data: null, message: "Service unavailable", error: { code: "SERVICE_UNAVAILABLE", message: "Service unavailable" }, timestamp: new Date().toISOString() }, { status: 503 });
  }
}
