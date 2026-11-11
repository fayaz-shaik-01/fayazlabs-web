import { cn } from "@/lib/utils";

/** Diamond monogram used in the header and footer. */
export function BrandMark({ className }: Readonly<{ className?: string }>) {
  return (
    <span aria-hidden="true" className={cn("inline-flex size-6 items-center justify-center text-primary", className)}>
      <svg viewBox="0 0 24 24" className="size-full" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
        <path d="M12 2.5 21.5 12 12 21.5 2.5 12z" fill="currentColor" fillOpacity="0.18" />
        <path d="M12 8 16 12 12 16 8 12z" fill="currentColor" />
      </svg>
    </span>
  );
}
