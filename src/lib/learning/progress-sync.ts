import { bulkImportProgress } from "./api";
import type { BulkProgressEntry } from "./api";

const PROGRESS_KEY = "fayazlabs-progress";
const MIGRATED_KEY = "fayazlabs-progress-migrated";

interface LocalProgressData {
  completedLessons: string[]; // "trackSlug|moduleSlug|lessonSlug"
  lastVisited: Record<string, string>;
}

/**
 * One-time migration: reads localStorage progress data and bulk-imports
 * completed lessons to the backend API. Marks migration as done so it
 * only runs once per browser.
 *
 * The lessonId sent to the API uses the same pipe-delimited key format:
 *   "trackSlug|moduleSlug|lessonSlug"
 *
 * Call this after the user is authenticated (i.e. has a valid JWT).
 */
export async function migrateLocalProgressToApi(): Promise<number> {
  if (typeof window === "undefined") return 0;

  // already migrated
  if (localStorage.getItem(MIGRATED_KEY)) return 0;

  const raw = localStorage.getItem(PROGRESS_KEY);
  if (!raw) {
    localStorage.setItem(MIGRATED_KEY, "true");
    return 0;
  }

  let local: LocalProgressData;
  try {
    local = JSON.parse(raw);
  } catch {
    localStorage.setItem(MIGRATED_KEY, "true");
    return 0;
  }

  if (!local.completedLessons || local.completedLessons.length === 0) {
    localStorage.setItem(MIGRATED_KEY, "true");
    return 0;
  }

  const entries: BulkProgressEntry[] = local.completedLessons.map((key) => ({
    lessonId: key,
    completed: true,
    completedAt: new Date().toISOString(),
    timeSpentMinutes: 0,
  }));

  try {
    const result = await bulkImportProgress(entries);
    localStorage.setItem(MIGRATED_KEY, "true");
    return result.imported;
  } catch (err) {
    // don't mark as migrated so it retries next time
    console.error("Failed to migrate local progress to API:", err);
    return 0;
  }
}

/**
 * Check whether local progress has already been migrated.
 */
export function isProgressMigrated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MIGRATED_KEY) === "true";
}
