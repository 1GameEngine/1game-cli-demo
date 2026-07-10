export function nextSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

export function nextRandom(seed: number, maxExclusive: number): { value: number; seed: number } {
  const updated = nextSeed(seed);
  return { value: maxExclusive > 0 ? updated % maxExclusive : 0, seed: updated };
}

export function chance(seed: number, numerator: number, denominator: number): { hit: boolean; seed: number } {
  const r = nextRandom(seed, denominator);
  return { hit: r.value < numerator, seed: r.seed };
}
