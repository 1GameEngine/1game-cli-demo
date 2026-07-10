import { Tile, GW, GH, FX, FY, META } from '../data/constants';
import { EAGLE_WALL_CELLS } from '../data/eagleWall';
import { LEVEL_MAPS } from './levels';

export function brickInitBits(t: number): number {
  if (t === Tile.PB0) return 0b1010; // R
  if (t === Tile.PB1) return 0b1100; // B
  if (t === Tile.PB2) return 0b0101; // L
  if (t === Tile.PB3) return 0b0011; // T
  if (t === Tile.BRICK) return 0b1111;
  return 0;
}

export function cloneLevelMap(stageIndex: number): { grid: number[][]; brickBits: number[][] } {
  const src = LEVEL_MAPS[stageIndex] ?? LEVEL_MAPS[0];
  const grid = src.map((row) => row.slice());
  const brickBits = grid.map((row) => row.map((t) => brickInitBits(t)));

  for (let r = 0; r < GH; r += 1) {
    for (let c = 0; c < GW; c += 1) {
      const t = grid[r][c];
      if (t >= Tile.PB0 && t < Tile.BRICK) grid[r][c] = Tile.BRICK;
    }
  }

  applyEagleWall(grid, brickBits, false);
  return { grid, brickBits };
}

export function applyEagleWall(grid: number[][], brickBits: number[][], steel: boolean): void {
  for (const w of EAGLE_WALL_CELLS) {
    if (steel) {
      grid[w.row][w.col] = Tile.STEEL;
      brickBits[w.row][w.col] = 0;
    } else if (w.bits === 0) {
      grid[w.row][w.col] = Tile.EMPTY;
      brickBits[w.row][w.col] = 0;
    } else {
      grid[w.row][w.col] = Tile.BRICK;
      brickBits[w.row][w.col] = w.bits;
    }
  }
}

export function passable8(grid: number[][], brickBits: number[][], px: number, py: number): boolean {
  const col = Math.floor((px - FX) / META);
  const row = Math.floor((py - FY) / META);
  if (col < 0 || col >= GW || row < 0 || row >= GH) return false;
  const t = grid[row][col];
  if (t === Tile.EMPTY || t >= 13 || t === Tile.ICE || t === Tile.FOREST) return true;

  if (t <= Tile.BRICK) {
    const qx = Math.floor((((px - FX) % META) + META) % META / 8);
    const qy = Math.floor((((py - FY) % META) + META) % META / 8);
    return !(brickBits[row][col] & (1 << (qy * 2 + qx)));
  }

  if (t >= Tile.PS0 && t <= Tile.PS3) {
    const STEEL_BLOCK = [0b1010, 0b1100, 0b0101, 0b0011];
    const qx = Math.floor((((px - FX) % META) + META) % META / 8);
    const qy = Math.floor((((py - FY) % META) + META) % META / 8);
    const qbit = 1 << (qy * 2 + qx);
    return !(STEEL_BLOCK[t - Tile.PS0] & qbit);
  }

  return false; // steel full, water
}

export function destroyBrick(
  grid: number[][],
  brickBits: number[][],
  row: number,
  col: number,
  bx: number,
  by: number,
  double: boolean,
): void {
  const localX = bx - (FX + col * META);
  const localY = by - (FY + row * META);
  const qx = localX >= 8 ? 1 : 0;
  const qy = localY >= 8 ? 1 : 0;
  let mask = 1 << (qy * 2 + qx);

  if (double) {
    // Super tank: also clear adjacent quadrant along shot depth
    mask |= 1 << (((qy ^ 1) * 2 + qx));
    mask |= 1 << ((qy * 2 + (qx ^ 1)));
  }

  brickBits[row][col] &= ~mask;
  const bits = brickBits[row][col];
  if (bits === 0) grid[row][col] = Tile.EMPTY;
  else if ((bits & 0b1010) === bits) grid[row][col] = Tile.PB0;
  else if ((bits & 0b1100) === bits) grid[row][col] = Tile.PB1;
  else if ((bits & 0b0101) === bits) grid[row][col] = Tile.PB2;
  else if ((bits & 0b0011) === bits) grid[row][col] = Tile.PB3;
  else grid[row][col] = Tile.BRICK;
}
