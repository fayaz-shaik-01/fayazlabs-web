import { NextRequest, NextResponse } from "next/server";
import { getFeatureFlags, type FeatureName } from "@/lib/features";

const AUTHENTICATED_PATHS = [
  "/tax/dashboard",
  "/tax/documents",
  "/tax/insights",
  "/tax/chat",
];

// Route prefixes behind a feature flag. The route layouts also call
// notFound(), but the loading UI streams a 200 before that runs, so we answer
// with a real 404 here.
const FLAGGED_PREFIXES: [string, FeatureName][] = [
  ["/flashcards", "flashcards"],
  ["/practice", "practice"],
  ["/formulas", "formulas"],
  ["/exam", "exam"],
  ["/knowledge-graph", "knowledgeGraph"],
  ["/dashboard", "dashboard"],
  ["/tax", "tax"],
];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const flags = getFeatureFlags();
  for (const [prefix, feature] of FLAGGED_PREFIXES) {
    if (!flags[feature] && matchesPrefix(pathname, prefix)) {
      return NextResponse.rewrite(new URL("/__feature-disabled", request.url), { status: 404 });
    }
  }

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
    "/flashcards/:path*",
    "/practice/:path*",
    "/formulas/:path*",
    "/exam/:path*",
    "/knowledge-graph/:path*",
    "/dashboard/:path*",
    "/tax/:path*",
  ],
};
