import curriculumData from "../../content/learning/curriculum.json";
import learningPathsData from "../../content/learning/learning-paths.json";
import featuredData from "../../content/learning/featured.json";

// ── Types ──────────────────────────────────────────────────────────────────

export type LessonStatus = "planned" | "learning" | "completed" | "revised" | "premium";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type LessonType = "build" | "learn";

export interface LessonMeta {
  id: string;
  title: string;
  slug: string;
  order: number;
  difficulty: Difficulty;
  estimatedMinutes: number;
  status: LessonStatus;
  premium: boolean;
  prerequisites: string[];
  tags: string[];
  type: LessonType;
  languages: string[];
  phaseId?: number;
}

export interface Phase {
  id: number;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  estimatedHours: number;
  icon: string;
  lessons: LessonMeta[];
}

export interface CurriculumData {
  version: string;
  lastUpdated: string;
  phases: Phase[];
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: Difficulty;
  estimatedHours: number;
  phaseIds: number[];
  featuredLessonSlugs?: string[];
  premium: boolean;
  tags: string[];
}

export interface HighlightedTopic {
  title: string;
  description: string;
  icon: string;
  lessonSlugs: string[];
  category: string;
}

export interface FeaturedData {
  featuredLessons: string[];
  featuredPhases: number[];
  highlightedTopics: HighlightedTopic[];
}

// Future monetization types (defined but unused for now)
export type UserTier = "anonymous" | "free" | "premium";

export interface EntitlementCheck {
  tier: UserTier;
  mentorQueriesRemaining: number;
  canAccessPremium: boolean;
}

// ── Data accessors ─────────────────────────────────────────────────────────

const curriculum = curriculumData as unknown as CurriculumData;
const learningPaths = learningPathsData as unknown as { paths: LearningPath[] };
const featured = featuredData as unknown as FeaturedData;

export function getCurriculum(): CurriculumData {
  return curriculum;
}

export function getPhases(): Phase[] {
  return curriculum.phases;
}

export function getPhase(id: number): Phase | undefined {
  return curriculum.phases.find((p) => p.id === id);
}

export function getPhaseBySlug(slug: string): Phase | undefined {
  return curriculum.phases.find((p) => p.slug === slug);
}

export function getLessonMeta(slug: string): (LessonMeta & { phaseId: number }) | undefined {
  for (const phase of curriculum.phases) {
    const lesson = phase.lessons.find((l) => l.slug === slug);
    if (lesson) {
      return { ...lesson, phaseId: phase.id };
    }
  }
  return undefined;
}

export function getAllLessonMetas(): (LessonMeta & { phaseId: number })[] {
  return curriculum.phases.flatMap((phase) =>
    phase.lessons.map((lesson) => ({ ...lesson, phaseId: phase.id }))
  );
}

export function getLearningPaths(): LearningPath[] {
  return learningPaths.paths;
}

export function getLearningPath(id: string): LearningPath | undefined {
  return learningPaths.paths.find((p) => p.id === id);
}

export function getFeaturedData(): FeaturedData {
  return featured;
}

export function getFeaturedLessonMetas(): (LessonMeta & { phaseId: number })[] {
  return featured.featuredLessons
    .map((slug) => getLessonMeta(slug))
    .filter((l): l is LessonMeta & { phaseId: number } => l !== undefined);
}

export function getHighlightedTopics(): HighlightedTopic[] {
  return featured.highlightedTopics;
}

// ── Stats helpers ──────────────────────────────────────────────────────────

export function getTotalLessonCount(): number {
  return curriculum.phases.reduce((acc, p) => acc + p.lessons.length, 0);
}

export function getTotalHours(): number {
  return curriculum.phases.reduce((acc, p) => acc + p.estimatedHours, 0);
}

export function getAuthoredLessonCount(authoredSlugs: string[]): number {
  return authoredSlugs.length;
}

export function getPhaseStats(phase: Phase) {
  const total = phase.lessons.length;
  const completed = phase.lessons.filter((l) => l.status === "completed").length;
  const inProgress = phase.lessons.filter((l) => l.status === "learning").length;
  return {
    total,
    completed,
    inProgress,
    planned: total - completed - inProgress,
    completionPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

// ── Search / filter ────────────────────────────────────────────────────────

export function searchLessons(
  query: string,
  filters?: { difficulty?: Difficulty; status?: LessonStatus; phaseId?: number }
): (LessonMeta & { phaseId: number })[] {
  let results = getAllLessonMetas();

  if (filters?.difficulty) {
    results = results.filter((l) => l.difficulty === filters.difficulty);
  }
  if (filters?.status) {
    results = results.filter((l) => l.status === filters.status);
  }
  if (filters?.phaseId !== undefined) {
    results = results.filter((l) => l.phaseId === filters.phaseId);
  }
  if (query.trim()) {
    const q = query.toLowerCase();
    results = results.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return results;
}
