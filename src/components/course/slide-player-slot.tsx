"use client";

import dynamic from "next/dynamic";
import type { ContentSession } from "@/lib/player/session";

const SlidePlayer = dynamic(() => import("./slide-player").then((m) => m.SlidePlayer), {
  ssr: false,
  loading: () => <div className="aspect-video w-full animate-pulse rounded-lg bg-muted" aria-busy="true" />,
});

/** Boundary the lesson page mounts; the player itself is loaded on demand. */
export function SlidePlayerSlot({ itemId, session, modes }: Readonly<{ itemId: string; session: ContentSession; modes?: { lecture?: boolean; conversation?: boolean } }>) {
  return (
    <div data-testid="slide-player-slot" data-item-id={itemId}>
      {session.loader ? (
        <SlidePlayer itemId={itemId} session={session} modes={modes} />
      ) : (
        <div className="aspect-video w-full animate-pulse rounded-lg bg-muted" aria-busy="true" />
      )}
    </div>
  );
}
