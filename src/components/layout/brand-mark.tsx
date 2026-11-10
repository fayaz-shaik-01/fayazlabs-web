import { cn } from "@/lib/utils";

/** Flat monogram used in the header and footer. */
export function BrandMark({ className }: Readonly<{ className?: string }>) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg bg-primary font-heading text-base font-bold text-primary-foreground",
        className
      )}
    >
      F
    </span>
  );
}
