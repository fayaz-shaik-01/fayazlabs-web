import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PLATFORM_URL } from "@/lib/tax/api";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tax-token")?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  try {
    const { id } = await params;
    const res = await fetch(`${PLATFORM_URL}/api/tax/documents/${id}/upload/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: "Confirm failed", error: { code: "SERVICE_UNAVAILABLE", message: "Service unavailable" }, timestamp: new Date().toISOString() },
      { status: 503 },
    );
  }
}
