import { NextRequest, NextResponse } from "next/server";
import { PLATFORM_URL } from "@/lib/tax/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const upstream = await fetch(`${PLATFORM_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();

    if (!upstream.ok || !data.success) {
      return NextResponse.json(data, { status: upstream.status });
    }

    const { token, refreshToken, expiresIn } = data.data as {
      token: string;
      refreshToken: string;
      expiresIn: number;
    };

    const res = NextResponse.json(data, { status: 200 });
    res.cookies.set("tax-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expiresIn,
      path: "/",
    });
    res.cookies.set("tax-refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json(
      { success: false, data: null, message: "Login failed", error: { code: "SERVICE_UNAVAILABLE", message: "Auth service unavailable" }, timestamp: new Date().toISOString() },
      { status: 503 },
    );
  }
}
