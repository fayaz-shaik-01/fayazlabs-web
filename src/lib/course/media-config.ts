/**
 * Where published content lives. In production the media origin defaults to
 * the CDN so a missing env var can never cause 404s; "/course-media" is only
 * used in development and in mock mode.
 *
 * Vercel env vars (both optional now):
 *   NEXT_PUBLIC_MEDIA_ORIGIN  e.g. https://media.fayazlabs.com
 *   NEXT_PUBLIC_CATALOG_URL   e.g. https://media.fayazlabs.com/catalog.json
 */
export const DEFAULT_MEDIA_ORIGIN = "https://media.fayazlabs.com";
export const DEV_MEDIA_BASE = "/course-media";

export interface MediaEnv {
  origin?: string;
  catalogUrl?: string;
  mock?: boolean;
  production?: boolean;
}

const trim = (s: string) => s.replace(/\/+$/, "");

export function resolveMediaBase(env: MediaEnv): string {
  if (env.origin) return trim(env.origin);
  if (env.mock || !env.production) return DEV_MEDIA_BASE;
  return DEFAULT_MEDIA_ORIGIN;
}

/** The catalog URL, or null when the local fixture should be used (dev, tests, mock). */
export function resolveCatalogUrl(env: MediaEnv): string | null {
  if (env.catalogUrl) return env.catalogUrl;
  if (env.mock || !env.production) return null;
  return `${resolveMediaBase(env)}/catalog.json`;
}

/** Reads the env with static references so Next can inline NEXT_PUBLIC_* values. */
export function currentMediaEnv(): MediaEnv {
  return {
    origin: process.env.NEXT_PUBLIC_MEDIA_ORIGIN,
    catalogUrl: process.env.NEXT_PUBLIC_CATALOG_URL,
    mock: process.env.NEXT_PUBLIC_API_MOCK === "1",
    production: process.env.NODE_ENV === "production",
  };
}
