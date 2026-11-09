export const LOOKAHEAD = 2;

/** Slide indexes whose audio should be held in memory while `current` plays. */
export function windowFor(current: number, total: number, lookahead = LOOKAHEAD): number[] {
  const out: number[] = [];
  for (let i = current; i <= Math.min(total - 1, current + lookahead); i++) out.push(i);
  return out;
}

/** What to start loading and what to release when moving to `current`. */
export function diffWindow(held: Iterable<number>, current: number, total: number, lookahead = LOOKAHEAD) {
  const want = new Set(windowFor(current, total, lookahead));
  const have = new Set(held);
  return {
    load: [...want].filter((i) => !have.has(i)),
    release: [...have].filter((i) => !want.has(i)),
  };
}
