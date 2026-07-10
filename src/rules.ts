import {
  type Cell,
  type ColorId,
  COLS,
  ROWS,
  cellCenter,
  cellCoords,
  cellIndex,
  createEmptyGrid,
  existingColors,
  findAttachCell,
  findNearestEmpty,
  neighbors,
  occupiedCount,
} from './grid';
import { nextInt, nextRng } from './rng';

export const INITIAL_FILL_ROWS = 5;
export const SHOTS_PER_DROP = 5;
export const POP_DURATION_MS = 180;
export const FALL_DURATION_MS = 280;
export const PROJECTILE_SPEED = 420;
export const AIM_MIN = (-75 * Math.PI) / 180;
export const AIM_MAX = (75 * Math.PI) / 180;
export const AIM_STEP = (3 * Math.PI) / 180;
export const COLLISION_DIST = 36 * 0.92;

export type Phase = 'ready' | 'playing' | 'won' | 'lost';
export type AnimPhase = 'idle' | 'flying' | 'popping' | 'falling';

export type Projectile = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: ColorId;
};

export type FallItem = {
  index: number;
  x: number;
  y: number;
  color: ColorId;
};

export type AnimState = {
  phase: AnimPhase;
  elapsedMs: number;
  durationMs: number;
  popIndices: number[];
  fallItems: FallItem[];
};

export type GameState = {
  phase: Phase;
  score: number;
  bestScore: number;
  shotsUntilDrop: number;
  aimAngle: number;
  currentColor: ColorId;
  nextColor: ColorId;
  grid: Cell[];
  projectile: Projectile | null;
  anim: AnimState;
  pointerAiming: boolean;
  rngSeed: number;
};

function emptyAnim(): AnimState {
  return {
    phase: 'idle',
    elapsedMs: 0,
    durationMs: 0,
    popIndices: [],
    fallItems: [],
  };
}

export function findCluster(grid: Cell[], startIndex: number): number[] {
  const start = grid[startIndex];
  if (!start) return [];

  const color = start.color;
  const visited = new Set<number>([startIndex]);
  const stack = [startIndex];
  const cluster = [startIndex];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const { col, row } = cellCoords(current);
    for (const n of neighbors(col, row)) {
      const ni = cellIndex(n.col, n.row);
      if (visited.has(ni)) continue;
      const cell = grid[ni];
      if (!cell || cell.color !== color) continue;
      visited.add(ni);
      stack.push(ni);
      cluster.push(ni);
    }
  }

  return cluster;
}

/** Bubbles not connected to the ceiling (row 0). */
export function findFloating(grid: Cell[]): number[] {
  const visited = new Set<number>();
  const stack: number[] = [];

  for (let col = 0; col < COLS; col += 1) {
    const i = cellIndex(col, 0);
    if (grid[i]) {
      visited.add(i);
      stack.push(i);
    }
  }

  while (stack.length > 0) {
    const current = stack.pop()!;
    const { col, row } = cellCoords(current);
    for (const n of neighbors(col, row)) {
      const ni = cellIndex(n.col, n.row);
      if (visited.has(ni) || !grid[ni]) continue;
      visited.add(ni);
      stack.push(ni);
    }
  }

  const floating: number[] = [];
  for (let i = 0; i < grid.length; i += 1) {
    if (grid[i] && !visited.has(i)) floating.push(i);
  }
  return floating;
}

export function pickColor(seed: number, colors: ColorId[]): [number, ColorId] {
  if (colors.length === 0) {
    const [next, value] = nextInt(seed, 5);
    return [next, value as ColorId];
  }
  const [next, value] = nextInt(seed, colors.length);
  return [next, colors[value]!];
}

export function buildInitialGrid(seed: number): { grid: Cell[]; seed: number } {
  const grid = createEmptyGrid();
  let current = seed;

  for (let row = 0; row < INITIAL_FILL_ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      // Leave occasional gaps on lower fill rows for interesting openings.
      if (row >= 3) {
        const [next, unit] = nextRng(current);
        current = next;
        if (unit < 0.18) continue;
      }
      const [next, color] = nextInt(current, 5);
      current = next;
      grid[cellIndex(col, row)] = { color: color as ColorId };
    }
  }

  return { grid, seed: current };
}

export function checkLose(grid: Cell[]): boolean {
  for (let i = 0; i < grid.length; i += 1) {
    if (!grid[i]) continue;
    const { y } = cellCenter(cellCoords(i).col, cellCoords(i).row);
    if (y + 18 >= 500) return true;
  }
  return false;
}

export function checkWin(grid: Cell[]): boolean {
  return occupiedCount(grid) === 0;
}

export function applyCeilingDrop(draft: GameState): void {
  // Shift everything down one row (from bottom to top to avoid overwrite).
  for (let row = ROWS - 1; row >= 1; row -= 1) {
    for (let col = 0; col < COLS; col += 1) {
      draft.grid[cellIndex(col, row)] = draft.grid[cellIndex(col, row - 1)];
    }
  }

  for (let col = 0; col < COLS; col += 1) {
    const colors = existingColors(draft.grid);
    const palette = colors.length > 0 ? colors : ([0, 1, 2, 3, 4] as ColorId[]);
    const [next, color] = pickColor(draft.rngSeed, palette);
    draft.rngSeed = next;
    draft.grid[cellIndex(col, 0)] = { color };
  }

  draft.shotsUntilDrop = SHOTS_PER_DROP;

  if (checkLose(draft.grid)) {
    draft.phase = 'lost';
    draft.bestScore = Math.max(draft.bestScore, draft.score);
  }
}

function scorePop(count: number): number {
  return count * 10 + Math.max(0, count - 3) * 5;
}

function scoreFall(count: number): number {
  return count * 20;
}

export function resolveAfterAttach(draft: GameState, attachIndex: number): void {
  const cluster = findCluster(draft.grid, attachIndex);
  if (cluster.length >= 3) {
    draft.anim.phase = 'popping';
    draft.anim.elapsedMs = 0;
    draft.anim.durationMs = POP_DURATION_MS;
    draft.anim.popIndices = cluster;
    draft.anim.fallItems = [];
    return;
  }

  finishAttachSideEffects(draft);
}

export function finalizePopping(draft: GameState): void {
  const popped = draft.anim.popIndices;
  draft.score += scorePop(popped.length);
  for (const i of popped) draft.grid[i] = null;
  draft.anim.popIndices = [];

  const floating = findFloating(draft.grid);
  if (floating.length > 0) {
    draft.anim.phase = 'falling';
    draft.anim.elapsedMs = 0;
    draft.anim.durationMs = FALL_DURATION_MS;
    draft.anim.fallItems = floating.map((index) => {
      const { col, row } = cellCoords(index);
      const center = cellCenter(col, row);
      return {
        index,
        x: center.x,
        y: center.y,
        color: draft.grid[index]!.color,
      };
    });
    for (const item of draft.anim.fallItems) draft.grid[item.index] = null;
    return;
  }

  finishAttachSideEffects(draft);
}

export function finalizeFalling(draft: GameState): void {
  draft.score += scoreFall(draft.anim.fallItems.length);
  draft.anim.fallItems = [];
  finishAttachSideEffects(draft);
}

function refillBalls(draft: GameState): void {
  const colors = existingColors(draft.grid);
  if (colors.length === 0) return;

  const [seed1, current] = pickColor(draft.rngSeed, colors);
  const [seed2, next] = pickColor(seed1, colors);
  draft.rngSeed = seed2;
  draft.currentColor = current;
  draft.nextColor = next;
}

function finishAttachSideEffects(draft: GameState): void {
  draft.anim = emptyAnim();
  draft.projectile = null;

  if (checkWin(draft.grid)) {
    draft.phase = 'won';
    draft.bestScore = Math.max(draft.bestScore, draft.score);
    return;
  }

  if (checkLose(draft.grid)) {
    draft.phase = 'lost';
    draft.bestScore = Math.max(draft.bestScore, draft.score);
    return;
  }

  draft.shotsUntilDrop -= 1;
  if (draft.shotsUntilDrop <= 0) {
    applyCeilingDrop(draft);
    if (draft.phase === 'lost') return;
    if (checkWin(draft.grid)) {
      draft.phase = 'won';
      draft.bestScore = Math.max(draft.bestScore, draft.score);
      return;
    }
  }

  // Promote next color into current, then pick a new next from remaining colors.
  const colors = existingColors(draft.grid);
  if (colors.length === 0) {
    draft.phase = 'won';
    draft.bestScore = Math.max(draft.bestScore, draft.score);
    return;
  }

  draft.currentColor = colors.includes(draft.nextColor) ? draft.nextColor : colors[0]!;
  const [seed, next] = pickColor(draft.rngSeed, colors);
  draft.rngSeed = seed;
  draft.nextColor = next;
}

export function attachProjectile(draft: GameState): void {
  const projectile = draft.projectile;
  if (!projectile) return;

  let attachIndex = findAttachCell(draft.grid, projectile.x, projectile.y);
  if (attachIndex === null) {
    attachIndex = findNearestEmpty(draft.grid, projectile.x, projectile.y);
  }

  if (attachIndex === null) {
    // Board full — treat as loss.
    draft.projectile = null;
    draft.anim = emptyAnim();
    draft.phase = 'lost';
    draft.bestScore = Math.max(draft.bestScore, draft.score);
    return;
  }

  draft.grid[attachIndex] = { color: projectile.color };
  draft.projectile = null;
  resolveAfterAttach(draft, attachIndex);
}

export function makeInitialState(bestScore = 0, seed = 0x51a7e5): GameState {
  const built = buildInitialGrid(seed);
  const colors = existingColors(built.grid);
  let rngSeed = built.seed;
  const [s1, currentColor] = pickColor(rngSeed, colors);
  const [s2, nextColor] = pickColor(s1, colors);
  rngSeed = s2;

  return {
    phase: 'ready',
    score: 0,
    bestScore,
    shotsUntilDrop: SHOTS_PER_DROP,
    aimAngle: 0,
    currentColor,
    nextColor,
    grid: built.grid,
    projectile: null,
    anim: emptyAnim(),
    pointerAiming: false,
    rngSeed,
  };
}

export function clampAim(angle: number): number {
  return Math.max(AIM_MIN, Math.min(AIM_MAX, angle));
}
