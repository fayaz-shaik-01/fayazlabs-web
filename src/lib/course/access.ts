import type { CatalogItem, Feature } from "./types";

export type LockReason = "none" | "login" | "upgrade";

export interface LockState {
  locked: boolean;
  /** Why it is locked: sign in first, or the plan lacks the feature. */
  reason: LockReason;
}

/** True when the feature is open to everybody (no login, no plan). */
export function isPublicFeature(feature: Feature): boolean {
  return feature === "free";
}

/**
 * Decide whether an item is locked for a user.
 * `features` is the list from GET /me/access (empty for anonymous users).
 */
export function getLockState(
  item: Pick<CatalogItem, "feature">,
  features: readonly string[],
  isAuthenticated: boolean,
): LockState {
  if (isPublicFeature(item.feature)) return { locked: false, reason: "none" };
  if (features.includes(item.feature)) return { locked: false, reason: "none" };
  return { locked: true, reason: isAuthenticated ? "upgrade" : "login" };
}
