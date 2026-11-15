/**
 * URL checks for anything that comes from outside the page: the ?next= redirect,
 * links in chat answers, source slugs. Everything here fails closed.
 */

/** Absolute links in chat answers may only point at these hosts (https only). */
export const ALLOWED_LINK_HOSTS: readonly string[] = [
  "fayazlabs.com",
  "www.fayazlabs.com",
  "github.com",
  "www.linkedin.com",
];

const CONTROL_OR_BACKSLASH = /[\\\u0000-\u001f\u007f]/;

/**
 * An on-site path: starts with a single "/", never "//" or "/\", and no control
 * characters (browsers strip tabs/newlines, so "/\t/evil.com" would become "//evil.com").
 */
export function isInternalPath(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//") && !CONTROL_OR_BACKSLASH.test(href);
}

/** An https URL on an allow-listed host, or null. Returns the normalised URL. */
export function safeExternalHref(href: string, allowedHosts: readonly string[] = ALLOWED_LINK_HOSTS): string | null {
  if (CONTROL_OR_BACKSLASH.test(href)) return null;
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  return allowedHosts.includes(url.hostname) ? url.href : null;
}

/** A link from chat output: internal path or allow-listed https URL. `external` says whether to open a new tab. */
export function safeChatHref(href: string): { href: string; external: boolean } | null {
  if (isInternalPath(href)) return { href, external: false };
  const ext = safeExternalHref(href);
  return ext ? { href: ext, external: true } : null;
}

const SLUG = /^[a-z0-9/_-]+$/;

/** Turn a source slug into an on-site href, or null if the slug isn't a plain path. */
export function sourceHref(slug: string): string | null {
  if (!SLUG.test(slug)) return null;
  const path = slug.replace(/^\/+/, "");
  return path ? `/${path}` : null;
}

/**
 * Where to go after sign-in. Same-origin only: anything that doesn't resolve to
 * `origin` (including "//evil.com" and "/\evil.com") falls back to "/".
 */
export function safeNextPath(next: string | null | undefined, origin: string, fallback = "/"): string {
  if (!next || CONTROL_OR_BACKSLASH.test(next) || !next.startsWith("/") || next.startsWith("//")) return fallback;
  try {
    const url = new URL(next, origin);
    if (url.origin !== origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
