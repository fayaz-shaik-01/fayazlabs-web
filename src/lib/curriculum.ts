import tracksIndex from "../../content/learning/curriculum/tracks.json";

// ── Types ──────────────────────────────────────────────────────────────────

export type Difficulty = "beginner" | "intermediate" | "advanced";
export type LessonStatus = "published" | "draft" | "planned" | "experimental" | "archived";
export type LessonType = "build" | "learn" | "lab" | "reference";

export interface LessonStub {
  id: string;
  slug: string;
  title: string;
  order: number;
  status: LessonStatus;
  difficulty: Difficulty;
  estimatedMinutes: number;
  premium: boolean;
  lessonType: LessonType;
  hasContent: boolean;
}

export interface ModuleMeta {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  premium: boolean;
  prerequisites: string[];
  lessons: LessonStub[];
}

export interface TrackMeta {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  difficulty: Difficulty;
  premium: boolean;
  tags: string[];
  modules: ModuleMeta[];
}

export interface TrackIndexEntry {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  difficulty: Difficulty;
  premium: boolean;
  tags: string[];
  manifestFile: string;
}

export interface TracksIndex {
  version: string;
  lastUpdated: string;
  tracks: TrackIndexEntry[];
}

// Future-ready types (defined but unused)
export type UserTier = "anonymous" | "free" | "premium" | "enterprise";

export interface EntitlementCheck {
  tier: UserTier;
  mentorQueriesRemaining: number;
  canAccessPremium: boolean;
}

// ── Manifest loading ──────────────────────────────────────────────────────

// Static imports for all track manifests — enables tree-shaking and SSG
import gateRa2027 from "../../content/learning/curriculum/gate-ra-2027.json";
import sdetEngineering from "../../content/learning/curriculum/sdet-engineering.json";

const trackManifestMap: Record<string, TrackMeta> = {
  "gate-ra-2027.json": gateRa2027 as unknown as TrackMeta,
  "sdet-engineering.json": sdetEngineering as unknown as TrackMeta,
};

const index = tracksIndex as unknown as TracksIndex;

// ── Data accessors ────────────────────────────────────────────────────────

export function getTracksIndex(): TracksIndex {
  return index;
}

export function getTrackEntries(): TrackIndexEntry[] {
  return [...index.tracks].sort((a, b) => a.order - b.order);
}

export function getTrack(slug: string): TrackMeta | undefined {
  const entry = index.tracks.find((t) => t.slug === slug);
  if (!entry) return undefined;
  return trackManifestMap[entry.manifestFile];
}

export function getAllTracks(): TrackMeta[] {
  return getTrackEntries()
    .map((entry) => trackManifestMap[entry.manifestFile])
    .filter((t): t is TrackMeta => t !== undefined);
}

export function getModule(trackSlug: string, moduleSlug: string): ModuleMeta | undefined {
  const track = getTrack(trackSlug);
  if (!track) return undefined;
  return track.modules.find((m) => m.slug === moduleSlug);
}

export function getLessonStub(
  trackSlug: string,
  moduleSlug: string,
  lessonSlug: string
): LessonStub | undefined {
  const mod = getModule(trackSlug, moduleSlug);
  if (!mod) return undefined;
  return mod.lessons.find((l) => l.slug === lessonSlug);
}

export function getAllLessonStubs(): (LessonStub & {
  trackSlug: string;
  trackTitle: string;
  moduleSlug: string;
  moduleTitle: string;
})[] {
  return getAllTracks().flatMap((track) =>
    track.modules.flatMap((mod) =>
      mod.lessons.map((lesson) => ({
        ...lesson,
        trackSlug: track.slug,
        trackTitle: track.title,
        moduleSlug: mod.slug,
        moduleTitle: mod.title,
      }))
    )
  );
}

// ── Navigation helpers ────────────────────────────────────────────────────

export interface LessonNavItem {
  trackSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  title: string;
  status: LessonStatus;
  hasContent: boolean;
}

export function getOrderedLessons(trackSlug: string): LessonNavItem[] {
  const track = getTrack(trackSlug);
  if (!track) return [];
  return track.modules
    .sort((a, b) => a.order - b.order)
    .flatMap((mod) =>
      mod.lessons
        .sort((a, b) => a.order - b.order)
        .map((lesson) => ({
          trackSlug,
          moduleSlug: mod.slug,
          lessonSlug: lesson.slug,
          title: lesson.title,
          status: lesson.status,
          hasContent: lesson.hasContent,
        }))
    );
}

export function getPrevNextLesson(
  trackSlug: string,
  moduleSlug: string,
  lessonSlug: string
): { prev: LessonNavItem | null; next: LessonNavItem | null } {
  const ordered = getOrderedLessons(trackSlug);
  const idx = ordered.findIndex(
    (l) => l.moduleSlug === moduleSlug && l.lessonSlug === lessonSlug
  );
  return {
    prev: idx > 0 ? ordered[idx - 1] : null,
    next: idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null,
  };
}

// ── Stats helpers (dynamic, never hardcoded) ──────────────────────────────

export function getTrackStats(track: TrackMeta) {
  const allLessons = track.modules.flatMap((m) => m.lessons);
  const published = allLessons.filter((l) => l.hasContent);
  const totalMinutes = allLessons.reduce((acc, l) => acc + l.estimatedMinutes, 0);
  return {
    totalLessons: allLessons.length,
    publishedLessons: published.length,
    totalModules: track.modules.length,
    estimatedHours: Math.round(totalMinutes / 60),
    estimatedMinutes: totalMinutes,
  };
}

export function getModuleStats(mod: ModuleMeta) {
  const published = mod.lessons.filter((l) => l.hasContent);
  const totalMinutes = mod.lessons.reduce((acc, l) => acc + l.estimatedMinutes, 0);
  return {
    totalLessons: mod.lessons.length,
    publishedLessons: published.length,
    estimatedMinutes: totalMinutes,
    estimatedHours: Math.round(totalMinutes / 60),
  };
}

export function getGlobalStats() {
  const tracks = getAllTracks();
  const allLessons = tracks.flatMap((t) => t.modules.flatMap((m) => m.lessons));
  const published = allLessons.filter((l) => l.hasContent);
  const totalMinutes = allLessons.reduce((acc, l) => acc + l.estimatedMinutes, 0);
  return {
    totalTracks: tracks.length,
    totalModules: tracks.reduce((acc, t) => acc + t.modules.length, 0),
    totalLessons: allLessons.length,
    publishedLessons: published.length,
    estimatedHours: Math.round(totalMinutes / 60),
  };
}

// ── Search / filter ───────────────────────────────────────────────────────

export function searchLessons(
  query: string,
  filters?: {
    difficulty?: Difficulty;
    status?: LessonStatus;
    trackSlug?: string;
    lessonType?: LessonType;
  }
) {
  let results = getAllLessonStubs();

  if (filters?.difficulty) {
    results = results.filter((l) => l.difficulty === filters.difficulty);
  }
  if (filters?.status) {
    results = results.filter((l) => l.status === filters.status);
  }
  if (filters?.trackSlug) {
    results = results.filter((l) => l.trackSlug === filters.trackSlug);
  }
  if (filters?.lessonType) {
    results = results.filter((l) => l.lessonType === filters.lessonType);
  }
  if (query.trim()) {
    const q = query.toLowerCase();
    results = results.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.trackTitle.toLowerCase().includes(q) ||
        l.moduleTitle.toLowerCase().includes(q)
    );
  }

  return results;
}

// ── Path helpers ──────────────────────────────────────────────────────────

export function getLessonPath(trackSlug: string, moduleSlug: string, lessonSlug: string): string {
  return `/learning/${trackSlug}/${moduleSlug}/${lessonSlug}`;
}

export function getModulePath(trackSlug: string, moduleSlug: string): string {
  return `/learning/${trackSlug}/${moduleSlug}`;
}

export function getTrackPath(trackSlug: string): string {
  return `/learning/${trackSlug}`;
}

// ── Static params generation (for Next.js generateStaticParams) ───────────

export function generateTrackParams() {
  return getTrackEntries().map((t) => ({ track: t.slug }));
}

export function generateModuleParams() {
  return getAllTracks().flatMap((track) =>
    track.modules.map((mod) => ({
      track: track.slug,
      module: mod.slug,
    }))
  );
}

export function generateLessonParams() {
  return getAllTracks().flatMap((track) =>
    track.modules.flatMap((mod) =>
      mod.lessons.map((lesson) => ({
        track: track.slug,
        module: mod.slug,
        lesson: lesson.slug,
      }))
    )
  );
}
