import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/learning";

const config: Record<Difficulty, { label: string; className: string }> = {
  beginner: {
    label: "Beginner",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  intermediate: {
    label: "Intermediate",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  advanced: {
    label: "Advanced",
    className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
};

interface DifficultyBadgeProps {
  readonly difficulty: Difficulty;
  readonly className?: string;
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const { label, className: badgeClass } = config[difficulty];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider",
        badgeClass,
        className
      )}
    >
      {label}
    </span>
  );
}
