import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  readonly label?: string;
  readonly title: string;
  readonly description?: string;
  readonly align?: "left" | "center";
  readonly className?: string;
}

/** Mono eyebrow, display heading and an optional lead paragraph. */
export function SectionHeader({
  label,
  title,
  description,
  align = "left",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-2",
        align === "center" && "items-center text-center",
        className
      )}
    >
      {label && <span className="eyebrow">{label}</span>}
      <h2 className="text-heading-xl text-foreground">{title}</h2>
      {description && (
        <p
          className={cn(
            "mt-1 max-w-2xl text-body-lg text-muted-foreground",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
