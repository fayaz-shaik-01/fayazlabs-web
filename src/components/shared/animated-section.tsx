import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  /** Kept for API compatibility; sections no longer animate on scroll. */
  readonly delay?: number;
}

/** Page section with the standard top offset (for the fixed header) and gutters. */
export function AnimatedSection({ children, className }: AnimatedSectionProps) {
  return (
    <section className={cn("pt-28 pb-20 sm:pt-32 sm:pb-24", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  );
}
