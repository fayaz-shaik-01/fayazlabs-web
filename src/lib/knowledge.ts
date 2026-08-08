// ── Knowledge Object Types ─────────────────────────────────────────────────
// The atomic, addressable, reusable units of knowledge that power
// the knowledge graph, search, practice, flashcards, and AI context.

export type KnowledgeObjectType =
  | "concept"
  | "definition"
  | "formula"
  | "algorithm"
  | "theorem"
  | "example"
  | "problem"
  | "flashcard"
  | "application"
  | "project";

export type ExamRelevance = "high" | "medium" | "low" | "none";

export interface KnowledgeObject {
  id: string;
  type: KnowledgeObjectType;
  title: string;
  content?: string;
  latex?: string;
  plainEnglish?: string;
  prerequisites: string[];
  usedIn: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  examRelevance?: {
    gate?: ExamRelevance;
    sebi?: ExamRelevance;
  };
  // Source location
  track: string;
  module: string;
  lesson: string;
}

export interface KnowledgeEdge {
  source: string; // KO id
  target: string; // KO id
  relationship: "prerequisite" | "usedIn" | "related" | "application";
}

export interface KnowledgeGraph {
  version: string;
  generatedAt: string;
  objects: Record<string, KnowledgeObject>;
  edges: KnowledgeEdge[];
  // Derived indices for fast lookup
  byType: Record<KnowledgeObjectType, string[]>;
  byTrack: Record<string, string[]>;
  byModule: Record<string, string[]>;
  byLesson: Record<string, string[]>;
}

// ── Flashcard Types ────────────────────────────────────────────────────────

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  koId?: string; // link to Knowledge Object
  track: string;
  module: string;
  lesson: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
}

export interface FlashcardDeck {
  version: string;
  generatedAt: string;
  cards: Flashcard[];
  byTrack: Record<string, string[]>;
  byModule: Record<string, string[]>;
}

// ── Practice Problem Types ─────────────────────────────────────────────────

export type ProblemType = "mcq" | "numerical" | "short-answer" | "true-false";

export interface PracticeProblem {
  id: string;
  type: ProblemType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  koIds: string[]; // linked Knowledge Objects
  track: string;
  module: string;
  lesson: string;
  tags: string[];
  examRelevance?: {
    gate?: ExamRelevance;
    sebi?: ExamRelevance;
  };
  marks?: number;
  negativeMarks?: number;
  estimatedSeconds?: number;
}

export interface PracticeBank {
  version: string;
  generatedAt: string;
  problems: PracticeProblem[];
  byTrack: Record<string, string[]>;
  byModule: Record<string, string[]>;
  byDifficulty: Record<string, string[]>;
}

// ── Formula Index ──────────────────────────────────────────────────────────

export interface FormulaEntry {
  id: string;
  name: string;
  latex: string;
  plainEnglish: string;
  category: string;
  koId: string;
  track: string;
  module: string;
  lesson: string;
  tags: string[];
}

export interface FormulaIndex {
  version: string;
  generatedAt: string;
  formulas: FormulaEntry[];
  byCategory: Record<string, string[]>;
  byTrack: Record<string, string[]>;
}

// ── Search Index ───────────────────────────────────────────────────────────

export interface SearchEntry {
  id: string;
  type: "lesson" | "formula" | "definition" | "concept" | "problem";
  title: string;
  snippet: string;
  track: string;
  module: string;
  lesson: string;
  url: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface SearchIndex {
  version: string;
  generatedAt: string;
  entries: SearchEntry[];
}

// ── Progress / Spaced Repetition Types (localStorage) ──────────────────────

export interface LessonProgress {
  completed: boolean;
  sectionsRead: string[];
  quizScores: { sectionId: string; score: number; maxScore: number; timestamp: number }[];
  lastVisited: number;
  timeSpentSeconds: number;
}

export interface FlashcardProgress {
  cardId: string;
  box: number; // Leitner box 1-5
  nextReview: number; // timestamp
  lastReviewed: number;
  correctCount: number;
  incorrectCount: number;
}

export interface UserProgress {
  version: string;
  lessons: Record<string, LessonProgress>;
  flashcards: Record<string, FlashcardProgress>;
  streaks: {
    current: number;
    longest: number;
    lastStudyDate: string; // YYYY-MM-DD
  };
  bookmarks: string[]; // lesson slugs or KO ids
  studyLog: { date: string; minutesStudied: number }[];
}

// ── Leitner SR intervals (in days) ─────────────────────────────────────────

export const LEITNER_INTERVALS: Record<number, number> = {
  1: 1,   // Box 1: review tomorrow
  2: 3,   // Box 2: review in 3 days
  3: 7,   // Box 3: review in 1 week
  4: 14,  // Box 4: review in 2 weeks
  5: 30,  // Box 5: review in 1 month
};

export const MAX_BOX = 5;

export function getNextReviewDate(box: number): number {
  const days = LEITNER_INTERVALS[Math.min(box, MAX_BOX)] ?? 1;
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

export function promoteCard(progress: FlashcardProgress): FlashcardProgress {
  const newBox = Math.min(progress.box + 1, MAX_BOX);
  return {
    ...progress,
    box: newBox,
    nextReview: getNextReviewDate(newBox),
    lastReviewed: Date.now(),
    correctCount: progress.correctCount + 1,
  };
}

export function demoteCard(progress: FlashcardProgress): FlashcardProgress {
  return {
    ...progress,
    box: 1,
    nextReview: getNextReviewDate(1),
    lastReviewed: Date.now(),
    incorrectCount: progress.incorrectCount + 1,
  };
}

// ── Default user progress ──────────────────────────────────────────────────

export function createDefaultProgress(): UserProgress {
  return {
    version: "1.0.0",
    lessons: {},
    flashcards: {},
    streaks: { current: 0, longest: 0, lastStudyDate: "" },
    bookmarks: [],
    studyLog: [],
  };
}
