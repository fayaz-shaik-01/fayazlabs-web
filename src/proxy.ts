import { NextRequest, NextResponse } from "next/server";

const AUTHENTICATED_PATHS = [
  "/tax/dashboard",
  "/tax/documents",
  "/tax/insights",
  "/tax/chat",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = AUTHENTICATED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("tax-token")?.value;
  if (!token) {
    const loginUrl = new URL("/tax/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/tax/dashboard/:path*",
    "/tax/documents/:path*",
    "/tax/insights/:path*",
    "/tax/chat/:path*",
  ],
};
