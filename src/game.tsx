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
  hasWon: boolean;
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
const SLIDE_MS = 160;
const SPAWN_MS = 110;
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

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutCubic(t: number): number {
  const x = clamp01(t) - 1;
  return x * x * x + 1;
}

/** 滑动用：起步不那么猛，落点更顺 */
function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
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

type LineSource = { index: number; value: number };
type LineCell = { value: number; sources: LineSource[]; merged: boolean };
type LineResult = {
  values: number[];
  scoreGain: number;
  cells: LineCell[];
  moved: boolean;
};

function slideLine(line: number[]): LineResult {
  const indexed = line
    .map((value, index) => ({ value, index }))
    .filter((item) => item.value !== 0);

  const cells: LineCell[] = [];
  let scoreGain = 0;
  let i = 0;

  while (i < indexed.length) {
    const current = indexed[i]!;
    const next = indexed[i + 1];
    if (next && next.value === current.value) {
      const merged = current.value * 2;
      cells.push({
        value: merged,
        sources: [
          { index: current.index, value: current.value },
          { index: next.index, value: next.value },
        ],
        merged: true,
      });
      scoreGain += merged;
      i += 2;
    } else {
      cells.push({
        value: current.value,
        sources: [{ index: current.index, value: current.value }],
        merged: false,
      });
      i += 1;
    }
  }

  while (cells.length < GRID_SIZE) {
    cells.push({ value: 0, sources: [], merged: false });
  }

  const values = cells.map((cell) => cell.value);
  const moved = values.some((value, index) => value !== line[index]);
  return { values, scoreGain, cells, moved };
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
  // 复用落稳方块 id，避免每步整表换 key 导致闪断
  const idByPos = new Map<string, string>();
  for (const tile of draft.displayTiles) {
    idByPos.set(`${tile.toRow},${tile.toCol}`, tile.id);
  }

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
      const cell = result.cells[i]!;
      const target = coords[i]!;
      nextGrid[target.row]![target.col] = cell.value;
      if (cell.value === 0) continue;

      for (const source of cell.sources) {
        const from = coords[source.index]!;
        const fromKey = `${from.row},${from.col}`;
        const id = idByPos.get(fromKey) ?? allocId(draft);
        idByPos.delete(fromKey);
        displayTiles.push({
          id,
          value: source.value,
          fromRow: from.row,
          fromCol: from.col,
          toRow: target.row,
          toCol: target.col,
          isNew: false,
          isMerged: cell.merged,
        });
      }
    }
  }

  if (!moved) return false;

  draft.grid = nextGrid;
  draft.score += scoreGain;
  if (draft.score > draft.best) draft.best = draft.score;
  // 移动中的方块后绘，减少滑过时被挡住
  displayTiles.sort((a, b) => {
    const aMove = a.fromRow !== a.toRow || a.fromCol !== a.toCol ? 1 : 0;
    const bMove = b.fromRow !== b.toRow || b.fromCol !== b.toCol ? 1 : 0;
    return aMove - bMove;
  });
  draft.displayTiles = displayTiles;
  draft.anim.phase = 'slide';
  draft.anim.elapsedMs = 0;
  draft.anim.durationMs = SLIDE_MS;
  return true;
}

/** slide 结束：就地收束合并 + 只追加新生方块，不整表换 id */
function beginSpawnPhase(draft: GameState): void {
  const byTarget = new Map<string, DisplayTile[]>();
  for (const tile of draft.displayTiles) {
    const key = `${tile.toRow},${tile.toCol}`;
    const list = byTarget.get(key) ?? [];
    list.push(tile);
    byTarget.set(key, list);
  }

  const settled: DisplayTile[] = [];
  const occupied = new Set<string>();

  for (const [key, group] of byTarget) {
    const [rowText, colText] = key.split(',');
    const row = Number(rowText);
    const col = Number(colText);
    occupied.add(key);

    if (group.length === 1) {
      const tile = group[0]!;
      settled.push({
        id: tile.id,
        value: draft.grid[row]![col]!,
        fromRow: row,
        fromCol: col,
        toRow: row,
        toCol: col,
        isNew: false,
        isMerged: false,
      });
      continue;
    }

    // 合并：保留第一个 id，值切到合成分，做一次弹出
    const survivor = group[0]!;
    settled.push({
      id: survivor.id,
      value: draft.grid[row]![col]!,
      fromRow: row,
      fromCol: col,
      toRow: row,
      toCol: col,
      isNew: false,
      isMerged: true,
    });
  }

  spawnRandom(draft, 1);

  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      const value = draft.grid[r]![c]!;
      if (value === 0) continue;
      const key = `${r},${c}`;
      if (occupied.has(key)) continue;
      settled.push({
        id: allocId(draft),
        value,
        fromRow: r,
        fromCol: c,
        toRow: r,
        toCol: c,
        isNew: true,
        isMerged: false,
      });
    }
  }

  draft.displayTiles = settled;
  draft.anim.phase = 'spawn';
  draft.anim.elapsedMs = 0;
  draft.anim.durationMs = SPAWN_MS;
}

function finishSpawn(draft: GameState): void {
  for (const tile of draft.displayTiles) {
    tile.isNew = false;
    tile.isMerged = false;
  }
  draft.anim.phase = 'idle';
  draft.anim.elapsedMs = 0;

  if (!draft.hasWon && has2048(draft.grid)) {
    draft.hasWon = true;
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
    hasWon: false,
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
    if (draft.phase === 'won') draft.phase = 'playing';
    if (draft.phase !== 'playing') return;
    if (draft.anim.phase !== 'idle') return;
    applyMove(draft, direction);
  });
}

function startOrRestart(): void {
  commitChange('开始继续或重开', (draft) => {
    if (draft.phase === 'ready' || draft.phase === 'won') {
      draft.phase = 'playing';
      return;
    }
    if (draft.phase === 'lost') {
      Object.assign(draft, makeInitialState(draft.best));
      draft.phase = 'playing';
    }
  });
}

function restartGame(): void {
  commitChange('重开', (draft) => {
    Object.assign(draft, makeInitialState(draft.best));
    draft.phase = 'playing';
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
        beginSpawnPhase(draft);
        return;
      }

      if (draft.anim.phase === 'spawn') {
        finishSpawn(draft);
      }
    });
  });

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
        if (code === 'KeyR') restartGame();
        if (code === 'Space') startOrRestart();
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
            if (draft.phase === 'ready' || draft.phase === 'won') draft.phase = 'playing';
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
        text={
          store.phase === 'ready'
            ? '点击开始 · 方向键或滑动'
            : store.phase === 'won'
              ? '达成 2048！点击继续 · R 重开'
              : store.phase === 'lost'
                ? '没有步数了 · 点击重开'
                : store.hasWon
                  ? '继续合并 · R 可重开'
                  : '合并相同数字'
        }
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

      <For each={store.displayTiles}>{(tile) => <TileView tile={tile} />}</For>

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
          text={store.phase === 'won' ? '点击继续' : '点击重开'}
          textAlign="center"
          textColor="#8f7a66"
          textSize="16"
          zIndex={21}
        />
      </Show>
    </scene>
  );
}

function slideProgress(): number {
  if (store.anim.phase !== 'slide') return 1;
  return easeInOutCubic(clamp01(store.anim.elapsedMs / Math.max(store.anim.durationMs, 1)));
}

function spawnProgress(): number {
  if (store.anim.phase !== 'spawn') return 1;
  return easeOutCubic(clamp01(store.anim.elapsedMs / Math.max(store.anim.durationMs, 1)));
}

function tileVisualSize(tile: DisplayTile): number {
  if (tile.isNew && store.anim.phase === 'spawn') {
    return CELL * lerp(0.2, 1, spawnProgress());
  }
  // 合并弹出放在 spawn 阶段，避免与滑动抢同一段时间轴
  if (tile.isMerged && store.anim.phase === 'spawn') {
    const p = spawnProgress();
    const bump = p < 0.5 ? lerp(1, 1.12, p * 2) : lerp(1.12, 1, (p - 0.5) * 2);
    return CELL * bump;
  }
  return CELL;
}

function tileZIndex(tile: DisplayTile): number {
  const moving =
    store.anim.phase === 'slide' && (tile.fromRow !== tile.toRow || tile.fromCol !== tile.toCol);
  if (moving) return 5;
  if (tile.isNew) return 4;
  if (tile.isMerged) return 4;
  return 3;
}

function TileView(props: { tile: DisplayTile }) {
  return (
    <group
      key={props.tile.id}
      x={
        cellToX(lerp(props.tile.fromCol, props.tile.toCol, slideProgress())) +
        (CELL - tileVisualSize(props.tile)) / 2
      }
      y={
        cellToY(lerp(props.tile.fromRow, props.tile.toRow, slideProgress())) +
        (CELL - tileVisualSize(props.tile)) / 2
      }
      width={tileVisualSize(props.tile)}
      height={tileVisualSize(props.tile)}
      zIndex={tileZIndex(props.tile)}
    >
      <node
        x={0}
        y={0}
        width={tileVisualSize(props.tile)}
        height={tileVisualSize(props.tile)}
        shape="roundedRect(8 8 8 8)"
        backgroundColor={tileColor(props.tile.value).bg}
      />
      <text
        x={0}
        y={(tileVisualSize(props.tile) - 28) / 2}
        width={tileVisualSize(props.tile)}
        height={28}
        text={`${props.tile.value}`}
        textAlign="center"
        textColor={tileColor(props.tile.value).fg}
        textSize={tileFontSize(props.tile.value)}
      />
    </group>
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
