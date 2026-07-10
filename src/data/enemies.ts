/**
 * Enemy spawn sequences for stages 1–10.
 * Source: Famicom ROM EntityTypeTable $E4EC + StageEnemyCountTable $E578
 * Types: 0=basic, 1=fast, 2=power, 3=armor
 * Order: emit slot counts in sequence (already expanded to 20).
 */
export const ENEMY_TYPE_TABLE: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], // 1: B×18 F×2
  [3, 3, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 2: A×2 F×4 B×14
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 3, 3], // 3: B×14 F×4 A×2
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 3, 3, 3], // 4: P×10 F×5 B×2 A×3
  [2, 2, 2, 2, 2, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1], // 5: P×5 A×2 B×8 F×5
  [2, 2, 2, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3], // 6: P×7 F×2 B×9 A×2
  [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0], // 7: B×3 F×4 P×6 B×7
  [2, 2, 2, 2, 2, 2, 2, 3, 3, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], // 8: P×7 A×2 F×4 B×7
  [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3], // 9: B×6 F×4 P×7 A×3
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 3, 3], // 10: B×12 F×2 P×4 A×2
];

/** SpawnDelayBase ≈ 0xBE - stage×4 (stage is 1-based). */
export function spawnDelayBase(stageIndex0: number): number {
  const stage = stageIndex0 + 1;
  return Math.max(20, 0xbe - stage * 4);
}
