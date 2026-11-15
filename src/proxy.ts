import { NextRequest, NextResponse } from "next/server";
import { getFeatureFlags, type FeatureName } from "@/lib/features";

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
  ],
};
