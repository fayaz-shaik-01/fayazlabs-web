import { authenticatedFetch } from "@/lib/auth/authenticated-fetch";

// ── Types ────────────────────────────────────────────────────────────────

export interface NoteDto {
  id: number;
  lessonKey: string;
  noteText: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkDto {
  id: number;
  itemKey: string;
  title: string;
  href: string;
  itemType: string;
  createdAt: string;
}

export interface SaveNoteRequest {
  lessonKey: string;
  noteText: string;
}

export interface SaveBookmarkRequest {
  itemKey: string;
  title: string;
  href: string;
  itemType?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  error: { code: string; message: string } | null;
  timestamp: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────

async function unwrap<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json();
  if (!json.success || json.data === null) {
    throw new Error(json.error?.message ?? json.message ?? "Request failed");
  }
  return json.data;
}

// ── Notes API ────────────────────────────────────────────────────────────

export async function getAllNotes(): Promise<NoteDto[]> {
  const res = await authenticatedFetch("/api/v1/notes");
  return unwrap<NoteDto[]>(res);
}

export async function getNotesByLesson(
  lessonKey: string,
): Promise<NoteDto[]> {
  const res = await authenticatedFetch(`/api/v1/notes/${encodeURIComponent(lessonKey)}`);
  return unwrap<NoteDto[]>(res);
}

export async function saveNote(req: SaveNoteRequest): Promise<NoteDto> {
  const res = await authenticatedFetch("/api/v1/notes", {
    method: "POST",
    body: JSON.stringify(req),
  });
  return unwrap<NoteDto>(res);
}

export async function updateNote(
  noteId: number,
  noteText: string,
): Promise<NoteDto> {
  const res = await authenticatedFetch(`/api/v1/notes/${noteId}`, {
    method: "PUT",
    body: JSON.stringify({ noteText }),
  });
  return unwrap<NoteDto>(res);
}

export async function deleteNote(noteId: number): Promise<void> {
  const res = await authenticatedFetch(`/api/v1/notes/${noteId}`, {
    method: "DELETE",
  });
  const json: ApiResponse<null> = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message ?? "Delete failed");
  }
}

export async function bulkSaveNotes(
  notes: Record<string, string[]>,
): Promise<NoteDto[]> {
  const res = await authenticatedFetch("/api/v1/notes/bulk", {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
  return unwrap<NoteDto[]>(res);
}

// ── Bookmarks API ────────────────────────────────────────────────────────

export async function getAllBookmarks(): Promise<BookmarkDto[]> {
  const res = await authenticatedFetch("/api/v1/bookmarks");
  return unwrap<BookmarkDto[]>(res);
}

export async function saveBookmark(
  req: SaveBookmarkRequest,
): Promise<BookmarkDto> {
  const res = await authenticatedFetch("/api/v1/bookmarks", {
    method: "POST",
    body: JSON.stringify(req),
  });
  return unwrap<BookmarkDto>(res);
}

export async function deleteBookmark(itemKey: string): Promise<void> {
  const res = await authenticatedFetch(
    `/api/v1/bookmarks/${encodeURIComponent(itemKey)}`,
    { method: "DELETE" },
  );
  const json: ApiResponse<null> = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message ?? "Delete failed");
  }
}

export async function bulkSaveBookmarks(
  bookmarks: SaveBookmarkRequest[],
): Promise<BookmarkDto[]> {
  const res = await authenticatedFetch("/api/v1/bookmarks/bulk", {
    method: "POST",
    body: JSON.stringify(bookmarks),
  });
  return unwrap<BookmarkDto[]>(res);
}
