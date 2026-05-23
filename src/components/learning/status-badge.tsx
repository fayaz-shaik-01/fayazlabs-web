import { cn } from "@/lib/utils";
import type { LessonStatus } from "@/lib/learning";

const config: Record<LessonStatus, { label: string; className: string }> = {
  planned: {
    label: "Planned",
    className: "bg-white/5 text-muted-foreground border-white/10",
  },
  learning: {
    label: "In Progress",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  revised: {
    label: "Revised",
    className: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  premium: {
    label: "Premium",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
};

interface StatusBadgeProps {
  readonly status: LessonStatus;
  readonly className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, className: badgeClass } = config[status];
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
