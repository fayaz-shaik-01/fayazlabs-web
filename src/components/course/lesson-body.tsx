import { SlidePlayerSlot } from "./slide-player-slot";

/**
 * Component boundary for the lesson content.
 *
 * TODO(lesson-html): render the lesson HTML fetched from the content CDN
 * (private, not stored in this repo) once the content pipeline exists. It must
 * be sanitised before it is injected. For now this is a placeholder.
 */
export function LessonBody({ itemId, kind }: Readonly<{ itemId: string; kind: "lesson" | "lab" }>) {
  return (
    <div data-testid="lesson-body" className="space-y-6">
      <SlidePlayerSlot itemId={itemId} />
      <div className="rounded-lg border border-border bg-card/40 p-6 text-sm text-muted-foreground">
        The {kind === "lab" ? "lab instructions" : "lesson text"} for {itemId} will appear here.
      </div>
    </div>
  );
}
