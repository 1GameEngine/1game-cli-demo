/** Odd-r offset hex grid helpers for bubble shooter. */

export const SCENE_WIDTH = 360;
export const SCENE_HEIGHT = 640;
export const COLS = 8;
export const ROWS = 12;
export const BUBBLE_DIAMETER = 36;
export const BUBBLE_RADIUS = BUBBLE_DIAMETER / 2;
export const ROW_HEIGHT = BUBBLE_DIAMETER * 0.8660254037844386; // √3/2
export const BOARD_LEFT = (SCENE_WIDTH - (COLS * BUBBLE_DIAMETER + BUBBLE_DIAMETER / 2)) / 2 + BUBBLE_RADIUS;
export const BOARD_TOP = 64;
export const DANGER_Y = 500;
export const CANNON_X = SCENE_WIDTH / 2;
export const CANNON_Y = 548;

export type ColorId = 0 | 1 | 2 | 3 | 4;
export type Cell = { color: ColorId } | null;

export const COLOR_HEX: Record<ColorId, string> = {
  0: '#ef4444',
  1: '#3b82f6',
  2: '#22c55e',
  3: '#eab308',
  4: '#a855f7',
};

export function cellIndex(col: number, row: number): number {
  return row * COLS + col;
}

export function cellCoords(index: number): { col: number; row: number } {
  return { col: index % COLS, row: Math.floor(index / COLS) };
}

export function inBounds(col: number, row: number): boolean {
  return col >= 0 && col < COLS && row >= 0 && row < ROWS;
}

export function isOddRow(row: number): boolean {
  return (row & 1) === 1;
}

/** Pixel center of a cell in scene coordinates. */
export function cellCenter(col: number, row: number): { x: number; y: number } {
  const offset = isOddRow(row) ? BUBBLE_RADIUS : 0;
  return {
    x: BOARD_LEFT + col * BUBBLE_DIAMETER + offset,
    y: BOARD_TOP + row * ROW_HEIGHT,
  };
}

/**
 * Odd-r hex neighbors (flat-top style used by bubble shooters).
 * Even rows: (col-1,row-1), (col,row-1), (col-1,row), (col+1,row), (col-1,row+1), (col,row+1)
 * Odd rows:  (col,row-1), (col+1,row-1), (col-1,row), (col+1,row), (col,row+1), (col+1,row+1)
 */
export function neighbors(col: number, row: number): Array<{ col: number; row: number }> {
  const deltas = isOddRow(row)
    ? [
        [0, -1],
        [1, -1],
        [-1, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ]
    : [
        [-1, -1],
        [0, -1],
        [-1, 0],
        [1, 0],
        [-1, 1],
        [0, 1],
      ];

  const result: Array<{ col: number; row: number }> = [];
  for (const [dc, dr] of deltas) {
    const nc = col + dc;
    const nr = row + dr;
    if (inBounds(nc, nr)) result.push({ col: nc, row: nr });
  }
  return result;
}

export function createEmptyGrid(): Cell[] {
  return Array.from({ length: ROWS * COLS }, () => null);
}

export function occupiedCount(grid: Cell[]): number {
  let n = 0;
  for (const cell of grid) if (cell) n += 1;
  return n;
}

export function existingColors(grid: Cell[]): ColorId[] {
  const seen = new Set<ColorId>();
  for (const cell of grid) {
    if (cell) seen.add(cell.color);
  }
  return [...seen].sort((a, b) => a - b) as ColorId[];
}

/** Find nearest empty cell to a pixel position; prefer cells adjacent to occupied or top row. */
export function findAttachCell(grid: Cell[], x: number, y: number): number | null {
  let bestIndex: number | null = null;
  let bestDist = Infinity;

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const i = cellIndex(col, row);
      if (grid[i]) continue;

      const center = cellCenter(col, row);
      const dx = center.x - x;
      const dy = center.y - y;
      const dist = dx * dx + dy * dy;

      const touchesTop = row === 0;
      const touchesOccupied = neighbors(col, row).some((n) => grid[cellIndex(n.col, n.row)]);
      if (!touchesTop && !touchesOccupied) continue;

      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    }
  }

  return bestIndex;
}

/** Fallback: any nearest empty cell regardless of adjacency. */
export function findNearestEmpty(grid: Cell[], x: number, y: number): number | null {
  let bestIndex: number | null = null;
  let bestDist = Infinity;
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const i = cellIndex(col, row);
      if (grid[i]) continue;
      const center = cellCenter(col, row);
      const dx = center.x - x;
      const dy = center.y - y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    }
  }
  return bestIndex;
}
