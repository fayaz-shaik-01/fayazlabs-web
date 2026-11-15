import { NextResponse } from "next/server";

/** Pull the bearer token out of an incoming request, or null if there isn't a usable one. */
export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const m = /^Bearer\s+([A-Za-z0-9\-._~+/]+=*)$/i.exec(header.trim());
  return m ? m[1] : null;
}

/** The standard error envelope used by the platform and these proxies. */
export function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    { success: false, data: null, message, error: { code, message }, timestamp: new Date().toISOString() },
    { status },
  );
}

export const unauthorized = () => errorResponse(401, "UNAUTHORIZED", "Sign in to use the AI assistant");
