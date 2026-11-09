import type { Feature } from "@/lib/course/types";
import { ApiError } from "./errors";
import type { Subscription } from "./types";

export interface AccessState {
  status: "loading" | "ready" | "error";
  features: string[];
  subscription: Subscription | null;
}

export const LOADING_ACCESS: AccessState = { status: "loading", features: [], subscription: null };
/** Anonymous visitors hold no features; free (L0) content is public anyway. */
export const ANONYMOUS_ACCESS: AccessState = { status: "ready", features: [], subscription: null };

/**
 * Turn a GET /me/access call into an AccessState.
 *  - ok: the server's features and subscription
 *  - 404 / network failure (backend without the new endpoint): free only
 *  - revoked / refresh-invalid: anonymous (the client already cleared auth)
 */
export async function resolveAccess(
  fetchAccess: () => Promise<{ subscription: Subscription | null; features: Feature[] | string[] }>,
): Promise<AccessState> {
  try {
    const res = await fetchAccess();
    return { status: "ready", features: [...res.features], subscription: res.subscription };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return ANONYMOUS_ACCESS;
    return { status: "error", features: ["free"], subscription: null };
  }
}
