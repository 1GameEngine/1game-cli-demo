/** Deterministic LCG helpers for gameplay RNG. */

export function nextSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

/** Returns [nextSeed, unit float in [0, 1)). */
export function nextRng(seed: number): [number, number] {
  const next = nextSeed(seed);
  return [next, next / 0x100000000];
}

export function nextInt(seed: number, maxExclusive: number): [number, number] {
  const [next, unit] = nextRng(seed);
  return [next, Math.floor(unit * maxExclusive)];
}
