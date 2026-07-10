/** Π-shaped brick wall around eagle — from Famicom ROM layout (vgrichina/battlecity). */
export type EagleWallCell = { row: number; col: number; bits: number };

export const EAGLE_WALL_CELLS: EagleWallCell[] = [
  { row: 11, col: 5, bits: 0b1000 },
  { row: 11, col: 6, bits: 0b1100 },
  { row: 11, col: 7, bits: 0b0100 },
  { row: 12, col: 5, bits: 0b1010 },
  { row: 12, col: 7, bits: 0b0101 },
];
