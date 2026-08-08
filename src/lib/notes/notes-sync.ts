import * as notesApi from "./api";
import type { SaveBookmarkRequest } from "./api";

const NOTES_KEY = "fayazlabs-notes";
const BOOKMARKS_KEY = "fayazlabs-bookmarks";
const NOTES_MIGRATED_KEY = "fayazlabs-notes-migrated";
const BOOKMARKS_MIGRATED_KEY = "fayazlabs-bookmarks-migrated";

interface LocalNote {
  id: string;
  text: string;
  createdAt: string;
}

interface LessonNotes {
  [lessonKey: string]: LocalNote[];
}

interface LocalBookmark {
  key: string;
  title: string;
  href: string;
  type: "lesson" | "formula" | "problem";
  addedAt: string;
}

/**
 * One-time migration: reads localStorage notes and bulk-imports to backend.
 * Marks migration as done so it only runs once per browser.
 */
export async function migrateLocalNotesToApi(): Promise<number> {
  if (typeof window === "undefined") return 0;
  if (localStorage.getItem(NOTES_MIGRATED_KEY)) return 0;

  const raw = localStorage.getItem(NOTES_KEY);
  if (!raw) {
    localStorage.setItem(NOTES_MIGRATED_KEY, "true");
    return 0;
  }

  let local: LessonNotes;
  try {
    local = JSON.parse(raw);
  } catch {
    localStorage.setItem(NOTES_MIGRATED_KEY, "true");
    return 0;
  }

  const notesMap: Record<string, string[]> = {};
  let count = 0;
  for (const [lessonKey, notes] of Object.entries(local)) {
    if (notes && notes.length > 0) {
      notesMap[lessonKey] = notes.map((n) => n.text);
      count += notes.length;
    }
  }

  if (count === 0) {
    localStorage.setItem(NOTES_MIGRATED_KEY, "true");
    return 0;
  }

  try {
    await notesApi.bulkSaveNotes(notesMap);
    localStorage.setItem(NOTES_MIGRATED_KEY, "true");
    return count;
  } catch (err) {
    console.error("Failed to migrate local notes to API:", err);
    return 0;
  }
}

/**
 * One-time migration: reads localStorage bookmarks and bulk-imports to backend.
 */
export async function migrateLocalBookmarksToApi(): Promise<number> {
  if (typeof window === "undefined") return 0;
  if (localStorage.getItem(BOOKMARKS_MIGRATED_KEY)) return 0;

  const raw = localStorage.getItem(BOOKMARKS_KEY);
  if (!raw) {
    localStorage.setItem(BOOKMARKS_MIGRATED_KEY, "true");
    return 0;
  }

  let local: LocalBookmark[];
  try {
    local = JSON.parse(raw);
  } catch {
    localStorage.setItem(BOOKMARKS_MIGRATED_KEY, "true");
    return 0;
  }

  if (!local || local.length === 0) {
    localStorage.setItem(BOOKMARKS_MIGRATED_KEY, "true");
    return 0;
  }

  const requests: SaveBookmarkRequest[] = local.map((b) => ({
    itemKey: b.key,
    title: b.title,
    href: b.href,
    itemType: b.type,
  }));

  try {
    await notesApi.bulkSaveBookmarks(requests);
    localStorage.setItem(BOOKMARKS_MIGRATED_KEY, "true");
    return local.length;
  } catch (err) {
    console.error("Failed to migrate local bookmarks to API:", err);
    return 0;
  }
}
