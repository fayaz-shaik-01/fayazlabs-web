import type { ReactNode } from "react";

const SKIP = new Set(["kind", "title", "subtitle"]);

function render(v: unknown, depth: number): ReactNode {
  if (v == null || depth > 3) return null;
  if (typeof v === "string" || typeof v === "number") return <span>{String(v)}</span>;
  if (Array.isArray(v)) {
    return (
      <ul className="list-disc space-y-1 pl-5">
        {v.map((x, i) => (
          <li key={i}>{render(x, depth + 1)}</li>
        ))}
      </ul>
    );
  }
  if (typeof v === "object") {
    return (
      <div className="space-y-1">
        {Object.entries(v as Record<string, unknown>).map(([k, x]) => (
          <div key={k}>{render(x, depth + 1)}</div>
        ))}
      </div>
    );
  }
  return null;
}

/**
 * Shows a slide's visible fields. The slide kinds (title, bullets, compare,
 * callout, flow, code, cards, table, quiz) share one generic renderer: title,
 * subtitle, then every other field as text or lists. Per-kind layouts can
 * replace this later without touching the player.
 */
export function SlideContent({ content }: Readonly<{ content: Record<string, unknown> }>) {
  const title = typeof content.title === "string" ? content.title : null;
  const subtitle = typeof content.subtitle === "string" ? content.subtitle : null;
  const rest = Object.entries(content).filter(([k]) => !SKIP.has(k));
  return (
    <div data-testid="slide-content">
      {title && <h3 className="text-xl font-semibold sm:text-2xl">{title}</h3>}
      {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      {rest.length > 0 && (
        <div className="mt-3 space-y-2 text-sm sm:text-base">
          {rest.map(([k, v]) => (
            <div key={k}>{render(v, 0)}</div>
          ))}
        </div>
      )}
    </div>
  );
}
