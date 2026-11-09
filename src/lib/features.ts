/**
 * Feature flags for the routes that are not part of the thin personal shell.
 *
 * Everything defaults to OFF. Turn one on with NEXT_PUBLIC_FEATURE_<NAME>=1
 * (or "true"). The variables are read with static `process.env.X` references
 * so Next.js can inline them for client components too.
 */

export type FeatureName =
  | "flashcards"
  | "practice"
  | "formulas"
  | "exam"
  | "knowledgeGraph"
  | "dashboard"
  | "tax";

export function parseFlag(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

export function getFeatureFlags(
  env: Record<string, string | undefined> = {
    flashcards: process.env.NEXT_PUBLIC_FEATURE_FLASHCARDS,
    practice: process.env.NEXT_PUBLIC_FEATURE_PRACTICE,
    formulas: process.env.NEXT_PUBLIC_FEATURE_FORMULAS,
    exam: process.env.NEXT_PUBLIC_FEATURE_EXAM,
    knowledgeGraph: process.env.NEXT_PUBLIC_FEATURE_KNOWLEDGE_GRAPH,
    dashboard: process.env.NEXT_PUBLIC_FEATURE_DASHBOARD,
    tax: process.env.NEXT_PUBLIC_FEATURE_TAX,
  },
): Record<FeatureName, boolean> {
  return {
    flashcards: parseFlag(env.flashcards),
    practice: parseFlag(env.practice),
    formulas: parseFlag(env.formulas),
    exam: parseFlag(env.exam),
    knowledgeGraph: parseFlag(env.knowledgeGraph),
    dashboard: parseFlag(env.dashboard),
    tax: parseFlag(env.tax),
  };
}

export function isFeatureEnabled(name: FeatureName): boolean {
  return getFeatureFlags()[name];
}
