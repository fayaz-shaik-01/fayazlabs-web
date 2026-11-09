/**
 * Security headers, including the Content-Security-Policy.
 * Lives here (not in vercel.json) so the CSP can depend on env vars:
 *  - NEXT_PUBLIC_MEDIA_ORIGIN: CDN/bucket origin for media; added to
 *    media-src and connect-src when set.
 *  - NEXT_PUBLIC_PLATFORM_URL: backend origin; added to connect-src.
 * Razorpay hosts are needed for checkout (script, XHR, and its checkout iframe).
 */

import { DEFAULT_MEDIA_ORIGIN } from "./course/media-config";

export function toOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? u.origin : null;
  } catch {
    return null;
  }
}

export function buildCsp(env: {
  mediaOrigin?: string;
  platformUrl?: string;
} = {
  mediaOrigin: process.env.NEXT_PUBLIC_MEDIA_ORIGIN,
  platformUrl: process.env.NEXT_PUBLIC_PLATFORM_URL,
}): string {
  // The CDN origin is always allowed (it is the default media origin), plus any override.
  const medias = [...new Set([toOrigin(DEFAULT_MEDIA_ORIGIN), toOrigin(env.mediaOrigin)].filter((o): o is string => !!o))];
  const platform = toOrigin(env.platformUrl);

  const connect = [
    "'self'",
    "https://*.vercel-insights.com",
    "https://va.vercel-scripts.com",
    "https://vercel.live",
    "https://accounts.google.com",
    "https://*.fayazlabs.com",
    "https://api.razorpay.com",
    ...(platform ? [platform] : []),
    ...medias,
  ];

  const directives: string[] = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vercel.live https://accounts.google.com https://checkout.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    // blob: is how the player plays audio it has fetched and decrypted in memory.
    `media-src 'self' blob: ${medias.join(" ")}`,
    `connect-src ${connect.join(" ")}`,
    "frame-src https://accounts.google.com https://api.razorpay.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  return directives.join("; ");
}

export function securityHeaders(): { key: string; value: string }[] {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-XSS-Protection", value: "1; mode=block" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
    { key: "Content-Security-Policy", value: buildCsp() },
  ];
}
