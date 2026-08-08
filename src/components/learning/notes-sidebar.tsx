"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  StickyNote,
  Bookmark,
  BookmarkCheck,
  X,
  Plus,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/use-local-storage";
import * as notesApi from "@/lib/notes/api";
import { migrateLocalNotesToApi, migrateLocalBookmarksToApi } from "@/lib/notes/notes-sync";

// ── Types ────────────────────────────────────────────────────────────────

interface Note {
  id: string;
  text: string;
  createdAt: string;
}

interface LessonNotes {
  [lessonKey: string]: Note[];
}

interface BookmarkEntry {
  key: string;
  title: string;
  href: string;
  type: "lesson" | "formula" | "problem";
  addedAt: string;
}

// ── Auth helper (check if JWT exists) ────────────────────────────────────

function hasAuthToken(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("fayazlabs_auth");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed.accessToken;
  } catch {
    return false;
  }
}

// ── Background sync: migrate + merge API data ───────────────────────────

function useNotesBookmarksSync(
  setAllNotes: (fn: (prev: LessonNotes) => LessonNotes) => void,
  setBookmarks: (fn: (prev: BookmarkEntry[]) => BookmarkEntry[]) => void,
) {
  const didSync = useRef(false);

  useEffect(() => {
    if (didSync.current || !hasAuthToken()) return;
    didSync.current = true;

    // 1. One-time migration of localStorage → API
    migrateLocalNotesToApi().catch(() => {});
    migrateLocalBookmarksToApi().catch(() => {});

    // 2. Fetch API notes and merge into localStorage
    notesApi.getAllNotes().then((apiNotes) => {
      if (apiNotes.length > 0) {
        setAllNotes((prev) => {
          const merged = { ...prev };
          for (const n of apiNotes) {
            const existing = merged[n.lessonKey] ?? [];
            const alreadyHas = existing.some(
              (e) => e.text === n.noteText && e.id === String(n.id),
            );
            if (!alreadyHas) {
              merged[n.lessonKey] = [
                ...existing.filter((e) => e.id !== String(n.id)),
                { id: String(n.id), text: n.noteText, createdAt: n.createdAt },
              ];
            }
          }
          return merged;
        });
      }
    }).catch(() => {});

    // 3. Fetch API bookmarks and merge into localStorage
    notesApi.getAllBookmarks().then((apiBookmarks) => {
      if (apiBookmarks.length > 0) {
        setBookmarks((prev) => {
          const keys = new Set(prev.map((b) => b.key));
          const newEntries: BookmarkEntry[] = apiBookmarks
            .filter((b) => !keys.has(b.itemKey))
            .map((b) => ({
              key: b.itemKey,
              title: b.title,
              href: b.href,
              type: (b.itemType as BookmarkEntry["type"]) ?? "lesson",
              addedAt: b.createdAt,
            }));
          return newEntries.length > 0 ? [...prev, ...newEntries] : prev;
        });
      }
    }).catch(() => {});
  }, [setAllNotes, setBookmarks]);
}

// ── Notes Sidebar ────────────────────────────────────────────────────────

export function NotesSidebar({ lessonKey, lessonTitle }: { lessonKey: string; lessonTitle: string }) {
  const [open, setOpen] = useState(false);
  const [allNotes, setAllNotes] = useLocalStorage<LessonNotes>("fayazlabs-notes", {});
  const [bookmarks, setBookmarks] = useLocalStorage<BookmarkEntry[]>("fayazlabs-bookmarks", []);
  const [draft, setDraft] = useState("");
  useNotesBookmarksSync(setAllNotes, setBookmarks);

  const notes = allNotes[lessonKey] ?? [];
  const isBookmarked = bookmarks.some((b) => b.key === lessonKey);

  const addNote = useCallback(() => {
    if (!draft.trim()) return;
    const note: Note = { id: crypto.randomUUID(), text: draft.trim(), createdAt: new Date().toISOString() };
    setAllNotes((prev) => ({ ...prev, [lessonKey]: [...(prev[lessonKey] ?? []), note] }));
    setDraft("");

    // Fire-and-forget API call when authenticated
    if (hasAuthToken()) {
      notesApi.saveNote({ lessonKey, noteText: draft.trim() }).catch((err) => {
        console.error("Failed to sync note to API:", err);
      });
    }
  }, [draft, lessonKey, setAllNotes]);

  const deleteNote = useCallback((noteId: string) => {
    setAllNotes((prev) => ({
      ...prev,
      [lessonKey]: (prev[lessonKey] ?? []).filter((n) => n.id !== noteId),
    }));

    // Fire-and-forget API call when authenticated
    if (hasAuthToken()) {
      const numericId = Number(noteId);
      if (!Number.isNaN(numericId)) {
        notesApi.deleteNote(numericId).catch((err) => {
          console.error("Failed to delete note from API:", err);
        });
      }
    }
  }, [lessonKey, setAllNotes]);

  const toggleBookmark = useCallback(() => {
    const removing = bookmarks.some((b) => b.key === lessonKey);
    setBookmarks((prev) => {
      if (prev.some((b) => b.key === lessonKey)) {
        return prev.filter((b) => b.key !== lessonKey);
      }
      return [...prev, {
        key: lessonKey,
        title: lessonTitle,
        href: `/learning/${lessonKey.replace(/\|/g, "/")}`,
        type: "lesson" as const,
        addedAt: new Date().toISOString(),
      }];
    });

    // Fire-and-forget API call when authenticated
    if (hasAuthToken()) {
      if (removing) {
        notesApi.deleteBookmark(lessonKey).catch((err) => {
          console.error("Failed to delete bookmark from API:", err);
        });
      } else {
        notesApi.saveBookmark({
          itemKey: lessonKey,
          title: lessonTitle,
          href: `/learning/${lessonKey.replace(/\|/g, "/")}`,
          itemType: "lesson",
        }).catch((err) => {
          console.error("Failed to sync bookmark to API:", err);
        });
      }
    }
  }, [lessonKey, lessonTitle, bookmarks, setBookmarks]);

  return (
    <>
      {/* Toggle buttons */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "h-10 w-10 rounded-lg border flex items-center justify-center transition-all shadow-md",
            open ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"
          )}
          title="Notes"
          aria-label="Open notes panel"
        >
          <StickyNote className="h-4 w-4" />
          {notes.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[0.5rem] text-primary-foreground flex items-center justify-center font-bold">
              {notes.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={toggleBookmark}
          className={cn(
            "h-10 w-10 rounded-lg border flex items-center justify-center transition-all shadow-md",
            isBookmarked ? "border-lab-amber bg-lab-amber/10 text-lab-amber" : "border-border bg-card text-muted-foreground hover:text-foreground"
          )}
          title={isBookmarked ? "Remove bookmark" : "Bookmark this lesson"}
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this lesson"}
        >
          {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        </button>
      </div>

      {/* Sidebar panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
            className="fixed right-0 top-14 bottom-0 w-80 z-40 bg-card border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Notes</h3>
                <span className="text-[0.6rem] text-muted-foreground">({notes.length})</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Close notes panel">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Notes list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notes.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No notes yet. Add your first note below.
                </p>
              )}
              {notes.map((note) => (
                <div key={note.id} className="group rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{note.text}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[0.6rem] text-muted-foreground">
                      {new Date(note.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add note input */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) addNote(); }}
                  placeholder="Add a note... (⌘+Enter to save)"
                  className="flex-1 min-h-[60px] max-h-[120px] resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="button"
                onClick={addNote}
                disabled={!draft.trim()}
                className="mt-2 w-full flex items-center justify-center gap-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-30 transition-all"
              >
                <Plus className="h-3 w-3" /> Add Note
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Bookmarks Page component ─────────────────────────────────────────────

export function BookmarksList() {
  const [bookmarks, setBookmarks] = useLocalStorage<BookmarkEntry[]>("fayazlabs-bookmarks", []);

  const removeBookmark = useCallback((key: string) => {
    setBookmarks((prev) => prev.filter((b) => b.key !== key));

    // Fire-and-forget API call when authenticated
    if (hasAuthToken()) {
      notesApi.deleteBookmark(key).catch((err) => {
        console.error("Failed to delete bookmark from API:", err);
      });
    }
  }, [setBookmarks]);

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-16">
        <Bookmark className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No bookmarks yet.</p>
        <p className="text-muted-foreground text-xs mt-1">Click the bookmark icon on any lesson to save it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {bookmarks.map((b) => (
        <div key={b.key} className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-all">
          <BookmarkCheck className="h-4 w-4 text-lab-amber flex-shrink-0" />
          <a href={b.href} className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">{b.title}</p>
            <p className="text-[0.6rem] text-muted-foreground">{b.type} &middot; {new Date(b.addedAt).toLocaleDateString()}</p>
          </a>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <button type="button" onClick={() => removeBookmark(b.key)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all" aria-label="Remove bookmark">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
