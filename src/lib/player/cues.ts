import type { Caption } from "./format";

/**
 * Index of the caption active at audio time `t`, or -1 before the first one.
 * A caption stays active until the next one starts (no flicker in the gaps),
 * and only the last caption ends at its own `end`.
 */
export function activeCueIndex(cues: readonly Caption[], t: number): number {
  let lo = 0;
  let hi = cues.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid].start <= t) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  if (found === cues.length - 1 && found >= 0 && t > cues[found].end + 0.5) return -1;
  return found;
}

/** Fraction 0..1 of the slide played, clamped. Driven only by the audio clock. */
export function slideProgress(currentTime: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return Math.min(1, Math.max(0, currentTime / duration));
}

export const SPEEDS = [0.85, 1, 1.25, 1.5, 1.75] as const;
export const THINK_SECONDS = 6;

/** Remaining think time for a quiz, from a monotonic clock (ms). */
export function thinkRemaining(startedAtMs: number, nowMs: number, total = THINK_SECONDS): number {
  return Math.max(0, total - (nowMs - startedAtMs) / 1000);
}
