import { cn } from "@/lib/utils";
import type { LessonStatus } from "@/lib/curriculum";

const config: Record<LessonStatus, { label: string; className: string }> = {
  published: {
    label: "Published",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  draft: {
    label: "Draft",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  planned: {
    label: "Planned",
    className: "bg-white/5 text-muted-foreground border-white/10",
  },
  experimental: {
    label: "Experimental",
    className: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  archived: {
    label: "Archived",
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
};

interface TrackStatusBadgeProps {
  readonly status: LessonStatus;
  readonly className?: string;
}

export function TrackStatusBadge({ status, className }: TrackStatusBadgeProps) {
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
