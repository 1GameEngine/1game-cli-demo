import { For, Index, Show } from 'solid-js';
import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'left' | 'right' | 'up' | 'down';
type AnimPhase = 'idle' | 'slide' | 'spawn';
type Phase = 'ready' | 'playing' | 'won' | 'lost';

type DisplayTile = {
  id: string;
  value: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  isNew: boolean;
  isMerged: boolean;
};

type GameState = {
  phase: Phase;
  score: number;
  best: number;
  grid: number[][];
  displayTiles: DisplayTile[];
  anim: {
    phase: AnimPhase;
    elapsedMs: number;
    durationMs: number;
  };
  nextId: number;
  swipeStart: { x: number; y: number } | null;
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const GRID_SIZE = 4;
const CELL = 72;
const GAP = 8;
const BOARD_PAD = 10;
const BOARD_SIZE = BOARD_PAD * 2 + GRID_SIZE * CELL + (GRID_SIZE - 1) * GAP;
const BOARD_X = Math.round((SCENE_WIDTH - BOARD_SIZE) / 2);
const BOARD_Y = 168;
const SLIDE_MS = 120;
const SPAWN_MS = 90;
const SWIPE_THRESHOLD = 24;

const TILE_COLORS: Record<number, { bg: string; fg: string }> = {
  2: { bg: '#eee4da', fg: '#776e65' },
  4: { bg: '#ede0c8', fg: '#776e65' },
  8: { bg: '#f2b179', fg: '#f9f6f2' },
  16: { bg: '#f59563', fg: '#f9f6f2' },
  32: { bg: '#f67c5f', fg: '#f9f6f2' },
  64: { bg: '#f65e3b', fg: '#f9f6f2' },
  128: { bg: '#edcf72', fg: '#f9f6f2' },
  256: { bg: '#edcc61', fg: '#f9f6f2' },
  512: { bg: '#edc850', fg: '#f9f6f2' },
  1024: { bg: '#edc53f', fg: '#f9f6f2' },
  2048: { bg: '#edc22e', fg: '#f9f6f2' },
};

function emptyGrid(): number[][] {
  return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => 0));
}

function cloneGrid(grid: number[][]): number[][] {
  return grid.map((row) => row.slice());
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutCubic(t: number): number {
  const x = clamp01(t) - 1;
  return x * x * x + 1;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function cellToX(col: number): number {
  return BOARD_X + BOARD_PAD + col * (CELL + GAP);
}

function cellToY(row: number): number {
  return BOARD_Y + BOARD_PAD + row * (CELL + GAP);
}

function tileColor(value: number): { bg: string; fg: string } {
  return TILE_COLORS[value] ?? { bg: '#3c3a32', fg: '#f9f6f2' };
}

function tileFontSize(value: number): string {
  if (value >= 1024) return '22';
  if (value >= 128) return '26';
  return '30';
}

function allocId(draft: GameState): string {
  const id = `t${draft.nextId}`;
  draft.nextId += 1;
  return id;
}

function emptyCells(grid: number[][]): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = [];
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      if (grid[r]![c] === 0) cells.push({ row: r, col: c });
    }
  }
  return cells;
}

function spawnRandom(draft: GameState, count = 1): void {
  for (let n = 0; n < count; n += 1) {
    const cells = emptyCells(draft.grid);
    if (cells.length === 0) return;
    const pick = cells[Math.floor(Math.random() * cells.length)]!;
    draft.grid[pick.row]![pick.col] = Math.random() < 0.9 ? 2 : 4;
  }
}

function buildDisplayFromGrid(draft: GameState, opts?: { markNew?: boolean }): void {
  const tiles: DisplayTile[] = [];
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      const value = draft.grid[r]![c]!;
      if (value === 0) continue;
      tiles.push({
        id: allocId(draft),
        value,
        fromRow: r,
        fromCol: c,
        toRow: r,
        toCol: c,
        isNew: Boolean(opts?.markNew),
        isMerged: false,
      });
    }
  }
  draft.displayTiles = tiles;
}

function canMove(grid: number[][]): boolean {
  if (emptyCells(grid).length > 0) return true;
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      const v = grid[r]![c]!;
      if (c + 1 < GRID_SIZE && grid[r]![c + 1] === v) return true;
      if (r + 1 < GRID_SIZE && grid[r + 1]![c] === v) return true;
    }
  }
  return false;
}

function has2048(grid: number[][]): boolean {
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      if (grid[r]![c]! >= 2048) return true;
    }
  }
  return false;
}

type LineResult = {
  values: number[];
  scoreGain: number;
  fromIndex: number[];
  mergedAt: boolean[];
  moved: boolean;
};

function slideLine(line: number[]): LineResult {
  const indexed = line
    .map((value, index) => ({ value, index }))
    .filter((item) => item.value !== 0);

  const values: number[] = [];
  const fromIndex: number[] = [];
  const mergedAt: boolean[] = [];
  let scoreGain = 0;
  let i = 0;

  while (i < indexed.length) {
    const current = indexed[i]!;
    const next = indexed[i + 1];
    if (next && next.value === current.value) {
      const merged = current.value * 2;
      values.push(merged);
      fromIndex.push(current.index);
      mergedAt.push(true);
      scoreGain += merged;
      i += 2;
    } else {
      values.push(current.value);
      fromIndex.push(current.index);
      mergedAt.push(false);
      i += 1;
    }
  }

  while (values.length < GRID_SIZE) {
    values.push(0);
    fromIndex.push(-1);
    mergedAt.push(false);
  }

  const moved = values.some((value, index) => value !== line[index]);
  return { values, scoreGain, fromIndex, mergedAt, moved };
}

function getLine(
  grid: number[][],
  direction: Direction,
  index: number,
): { values: number[]; coords: Array<{ row: number; col: number }> } {
  const values: number[] = [];
  const coords: Array<{ row: number; col: number }> = [];

  for (let i = 0; i < GRID_SIZE; i += 1) {
    let row = 0;
    let col = 0;
    if (direction === 'left') {
      row = index;
      col = i;
    } else if (direction === 'right') {
      row = index;
      col = GRID_SIZE - 1 - i;
    } else if (direction === 'up') {
      row = i;
      col = index;
    } else {
      row = GRID_SIZE - 1 - i;
      col = index;
    }
    values.push(grid[row]![col]!);
    coords.push({ row, col });
  }

  return { values, coords };
}

function applyMove(draft: GameState, direction: Direction): boolean {
  const nextGrid = emptyGrid();
  const displayTiles: DisplayTile[] = [];
  let scoreGain = 0;
  let moved = false;

  for (let lineIndex = 0; lineIndex < GRID_SIZE; lineIndex += 1) {
    const { values, coords } = getLine(draft.grid, direction, lineIndex);
    const result = slideLine(values);
    if (result.moved) moved = true;
    scoreGain += result.scoreGain;

    for (let i = 0; i < GRID_SIZE; i += 1) {
      const value = result.values[i]!;
      const target = coords[i]!;
      nextGrid[target.row]![target.col] = value;
      if (value === 0) continue;

      const fromPos = result.fromIndex[i]!;
      const from = coords[fromPos]!;
      displayTiles.push({
        id: allocId(draft),
        value,
        fromRow: from.row,
        fromCol: from.col,
        toRow: target.row,
        toCol: target.col,
        isNew: false,
        isMerged: result.mergedAt[i]!,
      });
    }
  }

  if (!moved) return false;

  draft.grid = nextGrid;
  draft.score += scoreGain;
  if (draft.score > draft.best) draft.best = draft.score;
  draft.displayTiles = displayTiles;
  draft.anim.phase = 'slide';
  draft.anim.elapsedMs = 0;
  draft.anim.durationMs = SLIDE_MS;
  return true;
}

function finishSpawn(draft: GameState): void {
  for (const tile of draft.displayTiles) {
    tile.isNew = false;
    tile.isMerged = false;
  }
  draft.anim.phase = 'idle';
  draft.anim.elapsedMs = 0;

  if (has2048(draft.grid) && draft.phase === 'playing') {
    draft.phase = 'won';
    return;
  }
  if (!canMove(draft.grid)) {
    draft.phase = 'lost';
  }
}

function makeInitialState(best = 0): GameState {
  const state: GameState = {
    phase: 'ready',
    score: 0,
    best,
    grid: emptyGrid(),
    displayTiles: [],
    anim: {
      phase: 'idle',
      elapsedMs: 0,
      durationMs: SLIDE_MS,
    },
    nextId: 1,
    swipeStart: null,
  };
  spawnRandom(state, 2);
  buildDisplayFromGrid(state);
  for (const tile of state.displayTiles) tile.isNew = false;
  return state;
}

const { store, commitChange, bindStore } = createGameStore<GameState>(makeInitialState());

function beginMove(direction: Direction): void {
  commitChange(`移动:${direction}`, (draft) => {
    if (draft.phase === 'ready') draft.phase = 'playing';
    if (draft.phase !== 'playing') return;
    if (draft.anim.phase !== 'idle') return;
    applyMove(draft, direction);
  });
}

function startOrRestart(): void {
  commitChange('开始或重开', (draft) => {
    if (draft.phase === 'ready') {
      draft.phase = 'playing';
      return;
    }
    if (draft.phase === 'won' || draft.phase === 'lost') {
      Object.assign(draft, makeInitialState(draft.best));
      draft.phase = 'playing';
    }
  });
}

function Game() {
  useFrame((frame) => {
    const dtMs = Math.min(frame.deltaSeconds, 0.05) * 1000;
    commitChange('动画帧推进', (draft) => {
      if (draft.anim.phase === 'idle') return;
      draft.anim.elapsedMs += dtMs;
      if (draft.anim.elapsedMs < draft.anim.durationMs) return;

      if (draft.anim.phase === 'slide') {
        // Capture occupied cells before spawn for isNew flags
        const occupied = new Set<string>();
        for (let r = 0; r < GRID_SIZE; r += 1) {
          for (let c = 0; c < GRID_SIZE; c += 1) {
            if (draft.grid[r]![c]! !== 0) occupied.add(`${r},${c}`);
          }
        }
        spawnRandom(draft, 1);
        const tiles: DisplayTile[] = [];
        for (let r = 0; r < GRID_SIZE; r += 1) {
          for (let c = 0; c < GRID_SIZE; c += 1) {
            const value = draft.grid[r]![c]!;
            if (value === 0) continue;
            const key = `${r},${c}`;
            tiles.push({
              id: allocId(draft),
              value,
              fromRow: r,
              fromCol: c,
              toRow: r,
              toCol: c,
              isNew: !occupied.has(key),
              isMerged: false,
            });
          }
        }
        draft.displayTiles = tiles;
        draft.anim.phase = 'spawn';
        draft.anim.elapsedMs = 0;
        draft.anim.durationMs = SPAWN_MS;
        return;
      }

      if (draft.anim.phase === 'spawn') {
        finishSpawn(draft);
      }
    });
  });

  const normalized =
    store.anim.phase === 'idle' ? 1 : clamp01(store.anim.elapsedMs / store.anim.durationMs);
  const progress = store.anim.phase === 'slide' ? easeOutCubic(normalized) : 1;
  const spawnScale =
    store.anim.phase === 'spawn' ? lerp(0.35, 1, easeOutCubic(normalized)) : 1;

  const statusText =
    store.phase === 'ready'
      ? '点击开始 · 方向键或滑动'
      : store.phase === 'won'
        ? '达成 2048！点击继续'
        : store.phase === 'lost'
          ? '没有步数了 · 点击重开'
          : '合并相同数字';

  return (
    <scene
      name="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#faf8ef"
      onKeyDown={(event) => {
        const code = event.detail?.code;
        if (code === 'ArrowLeft') beginMove('left');
        if (code === 'ArrowRight') beginMove('right');
        if (code === 'ArrowUp') beginMove('up');
        if (code === 'ArrowDown') beginMove('down');
        if (code === 'KeyR' || code === 'Space') startOrRestart();
      }}
    >
      <node
        x={0}
        y={0}
        width={SCENE_WIDTH}
        height={SCENE_HEIGHT}
        backgroundColor="#faf8ef"
        clickable
        onClick={() => startOrRestart()}
        onPointerDown={(e) => {
          commitChange('滑动:开始', (draft) => {
            draft.swipeStart = { x: e.x, y: e.y };
          });
        }}
        onPointerUp={(e) => {
          commitChange('滑动:结束', (draft) => {
            const from = draft.swipeStart;
            draft.swipeStart = null;
            if (!from) return;
            const dx = e.x - from.x;
            const dy = e.y - from.y;
            if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
            const direction: Direction =
              Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
            if (draft.phase === 'ready') draft.phase = 'playing';
            if (draft.phase !== 'playing') return;
            if (draft.anim.phase !== 'idle') return;
            applyMove(draft, direction);
          });
        }}
      />

      <text
        x={0}
        y={28}
        width={SCENE_WIDTH}
        height={42}
        text="2048"
        textAlign="center"
        textColor="#776e65"
        textSize="40"
      />
      <text
        x={24}
        y={78}
        width={SCENE_WIDTH - 48}
        height={22}
        text={statusText}
        textAlign="center"
        textColor="#8f7a66"
        textSize="14"
      />

      <HudBox stableKey="hud-score" x={BOARD_X} y={110} label="SCORE" value={store.score} />
      <HudBox
        stableKey="hud-best"
        x={BOARD_X + 156}
        y={110}
        label="BEST"
        value={store.best}
      />

      <node
        x={BOARD_X}
        y={BOARD_Y}
        width={BOARD_SIZE}
        height={BOARD_SIZE}
        shape="roundedRect(12 12 12 12)"
        backgroundColor="#bbada0"
      />

      <Index each={store.grid}>
        {(row, r) => (
          <Index each={row()}>
            {(_cell, c) => (
              <node
                key={`slot-${r}-${c}`}
                x={cellToX(c)}
                y={cellToY(r)}
                width={CELL}
                height={CELL}
                shape="roundedRect(8 8 8 8)"
                backgroundColor="#cdc1b4"
              />
            )}
          </Index>
        )}
      </Index>

      <For each={store.displayTiles}>
        {(tile) => {
          const row = lerp(tile.fromRow, tile.toRow, progress);
          const col = lerp(tile.fromCol, tile.toCol, progress);
          const scale = tile.isNew ? spawnScale : tile.isMerged && store.anim.phase === 'slide' && progress > 0.85 ? 1.08 : 1;
          const size = CELL * scale;
          const x = cellToX(col) + (CELL - size) / 2;
          const y = cellToY(row) + (CELL - size) / 2;
          const colors = tileColor(tile.value);
          return (
            <group key={tile.id} x={x} y={y} width={size} height={size}>
              <node
                x={0}
                y={0}
                width={size}
                height={size}
                shape="roundedRect(8 8 8 8)"
                backgroundColor={colors.bg}
              />
              <text
                x={0}
                y={(size - 28) / 2}
                width={size}
                height={28}
                text={`${tile.value}`}
                textAlign="center"
                textColor={colors.fg}
                textSize={tileFontSize(tile.value)}
              />
            </group>
          );
        }}
      </For>

      <Show when={store.phase === 'won' || store.phase === 'lost'}>
        <node
          x={BOARD_X}
          y={BOARD_Y}
          width={BOARD_SIZE}
          height={BOARD_SIZE}
          shape="roundedRect(12 12 12 12)"
          backgroundColor="#faf8efcc"
          zIndex={20}
        />
        <text
          x={BOARD_X}
          y={BOARD_Y + BOARD_SIZE / 2 - 24}
          width={BOARD_SIZE}
          height={32}
          text={store.phase === 'won' ? '你赢了！' : '游戏结束'}
          textAlign="center"
          textColor="#776e65"
          textSize="28"
          zIndex={21}
        />
        <text
          x={BOARD_X}
          y={BOARD_Y + BOARD_SIZE / 2 + 12}
          width={BOARD_SIZE}
          height={22}
          text="点击重开"
          textAlign="center"
          textColor="#8f7a66"
          textSize="16"
          zIndex={21}
        />
      </Show>
    </scene>
  );
}

function HudBox(props: { stableKey: string; x: number; y: number; label: string; value: number }) {
  return (
    <group key={props.stableKey} x={props.x} y={props.y} width={140} height={48}>
      <node
        x={0}
        y={0}
        width={140}
        height={48}
        shape="roundedRect(8 8 8 8)"
        backgroundColor="#bbada0"
      />
      <text
        x={0}
        y={4}
        width={140}
        height={16}
        text={props.label}
        textAlign="center"
        textColor="#eee4da"
        textSize="12"
      />
      <text
        x={0}
        y={20}
        width={140}
        height={24}
        text={`${props.value}`}
        textAlign="center"
        textColor="#ffffff"
        textSize="20"
      />
    </group>
  );
}

renderGame(() => <Game />, { bindStore });
