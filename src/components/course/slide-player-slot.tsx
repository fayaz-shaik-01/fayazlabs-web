/**
 * Component boundary for the slide player.
 *
 * TODO(slide-player): mount the real slide player here. It will take the
 * content grant for `itemId` (POST /content/grant), load the slides from the
 * CDN/bucket, and handle audio when the user has `audio.paid`. Keep this
 * component's props stable so the lesson page does not change.
 */
export function SlidePlayerSlot({ itemId }: Readonly<{ itemId: string }>) {
  return (
    <div
      data-testid="slide-player-slot"
      data-item-id={itemId}
      className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground"
    >
      Slide player goes here
    </div>
  );
}
