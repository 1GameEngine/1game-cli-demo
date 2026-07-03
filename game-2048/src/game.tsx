import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'up' | 'down' | 'left' | 'right';
type AnimPhase = 'idle' | 'sliding';
type GamePhase = 'ready' | 'playing' | 'won' | 'lost';

type Tile = {
  id: string;
  value: number;
  row: number;
  col: number;
};

type DisplayTile = {
  id: string;
  value: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  hidden: boolean;
};

type GameState = {
  phase: GamePhase;
  score: number;
  best: number;
  size: number;
  cell: number;
  tiles: Tile[];
  displayTiles: DisplayTile[];
  anim: { phase: AnimPhase; elapsedMs: number; durationMs: number };
  swipeStart: { x: number; y: number } | null;
  rngSeed: number;
  nextTileId: number;
  keepPlaying: boolean;
  needsSpawn: boolean;
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const GRID_SIZE = 4;
const CELL_SIZE = 72;
const GRID_X = (SCENE_WIDTH - GRID_SIZE * CELL_SIZE) / 2;
const GRID_Y = 200;
const ANIM_DURATION_MS = 140;
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

const DIRECTION_VECTORS: Record<Direction, { dr: number; dc: number }> = {
  up: { dr: -1, dc: 0 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  right: { dr: 0, dc: 1 },
};

const { store, commitChange, storeHistory } = createGameStore<GameState>(
  {
    phase: 'ready',
    score: 0,
    best: 0,
    size: GRID_SIZE,
    cell: CELL_SIZE,
    tiles: [],
    displayTiles: [],
    anim: { phase: 'idle', elapsedMs: 0, durationMs: ANIM_DURATION_MS },
    swipeStart: null,
    rngSeed: 0x2048,
    nextTileId: 1,
    keepPlaying: false,
    needsSpawn: false,
  },
  { enableHistory: true },
);

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function easeOutCubic(t: number): number {
  const x = clamp01(t) - 1;
  return x * x * x + 1;
}

function nextRandom(seed: number): { value: number; seed: number } {
  const newSeed = (seed * 1664525 + 1013904223) >>> 0;
  return { value: newSeed / 0xffffffff, seed: newSeed };
}

function tileColor(value: number): { bg: string; fg: string } {
  return TILE_COLORS[value] ?? { bg: '#3c3a32', fg: '#f9f6f2' };
}

function textSizeFor(value: number): string {
  if (value >= 1000) return '20';
  if (value >= 100) return '24';
  return '28';
}

function sortTilesForDirection(tiles: Tile[], direction: Direction): Tile[] {
  const copy = [...tiles];
  if (direction === 'left') return copy.sort((a, b) => a.col - b.col);
  if (direction === 'right') return copy.sort((a, b) => b.col - a.col);
  if (direction === 'up') return copy.sort((a, b) => a.row - b.row);
  return copy.sort((a, b) => b.row - a.row);
}

function getEmptyCells(tiles: Tile[], size: number): { row: number; col: number }[] {
  const occupied = new Set(tiles.map((t) => `${t.row},${t.col}`));
  const empty: { row: number; col: number }[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!occupied.has(`${row},${col}`)) empty.push({ row, col });
    }
  }
  return empty;
}

function spawnTile(draft: GameState): void {
  const empty = getEmptyCells(draft.tiles, draft.size);
  if (empty.length === 0) return;

  const pick = nextRandom(draft.rngSeed);
  draft.rngSeed = pick.seed;
  const index = Math.floor(pick.value * empty.length);
  const cell = empty[index];

  const valuePick = nextRandom(draft.rngSeed);
  draft.rngSeed = valuePick.seed;
  const value = valuePick.value < 0.9 ? 2 : 4;

  const id = `t${draft.nextTileId}`;
  draft.nextTileId += 1;
  draft.tiles.push({ id, value, row: cell.row, col: cell.col });
}

function hasMoves(tiles: Tile[], size: number): boolean {
  if (getEmptyCells(tiles, size).length > 0) return true;
  for (const tile of tiles) {
    const neighbors = [
      { row: tile.row - 1, col: tile.col },
      { row: tile.row + 1, col: tile.col },
      { row: tile.row, col: tile.col - 1 },
      { row: tile.row, col: tile.col + 1 },
    ];
    for (const n of neighbors) {
      const other = tiles.find((t) => t.row === n.row && t.col === n.col);
      if (other && other.value === tile.value) return true;
    }
  }
  return false;
}

function hasWon(tiles: Tile[]): boolean {
  return tiles.some((t) => t.value >= 2048);
}

type MoveResult = {
  moved: boolean;
  scoreGain: number;
  tiles: Tile[];
  displayTiles: DisplayTile[];
};

function computeMove(tiles: Tile[], direction: Direction, size: number): MoveResult {
  type Cell = { tile: Tile; merged: boolean } | null;
  const grid: Cell[][] = Array.from({ length: size }, () => Array<Cell>(size).fill(null));
  const displayTiles: DisplayTile[] = [];
  const consumed = new Set<string>();
  let scoreGain = 0;
  let moved = false;

  const ordered = sortTilesForDirection(tiles, direction);
  const { dr, dc } = DIRECTION_VECTORS[direction];

  for (const tile of ordered) {
    if (consumed.has(tile.id)) continue;

    let row = tile.row;
    let col = tile.col;
    let merged = false;

    while (true) {
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (nextRow < 0 || nextRow >= size || nextCol < 0 || nextCol >= size) break;

      const cell = grid[nextRow][nextCol];
      if (!cell) {
        row = nextRow;
        col = nextCol;
        continue;
      }

      if (cell.tile.value === tile.value && !cell.merged) {
        row = nextRow;
        col = nextCol;
        merged = true;
      }
      break;
    }

    if (merged) {
      const target = grid[row][col]!;
      scoreGain += tile.value * 2;
      displayTiles.push({
        id: tile.id,
        value: tile.value,
        fromRow: tile.row,
        fromCol: tile.col,
        toRow: row,
        toCol: col,
        hidden: true,
      });
      displayTiles.push({
        id: target.tile.id,
        value: target.tile.value,
        fromRow: target.tile.row,
        fromCol: target.tile.col,
        toRow: row,
        toCol: col,
        hidden: false,
      });
      target.tile.value *= 2;
      target.tile.row = row;
      target.tile.col = col;
      target.merged = true;
      consumed.add(tile.id);
      moved = true;
      continue;
    }

    if (row !== tile.row || col !== tile.col) {
      moved = true;
      displayTiles.push({
        id: tile.id,
        value: tile.value,
        fromRow: tile.row,
        fromCol: tile.col,
        toRow: row,
        toCol: col,
        hidden: false,
      });
    }

    const placed: Tile = { id: tile.id, value: tile.value, row, col };
    grid[row][col] = { tile: placed, merged: false };
  }

  const nextTiles: Tile[] = [];
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const cell = grid[r][c];
      if (cell) nextTiles.push({ ...cell.tile });
    }
  }

  return { moved, scoreGain, tiles: nextTiles, displayTiles };
}

function resetBoard(draft: GameState): void {
  draft.phase = 'playing';
  draft.score = 0;
  draft.tiles = [];
  draft.displayTiles = [];
  draft.anim.phase = 'idle';
  draft.anim.elapsedMs = 0;
  draft.keepPlaying = false;
  draft.needsSpawn = false;
  draft.rngSeed = 0x2048;
  draft.nextTileId = 1;
  spawnTile(draft);
  spawnTile(draft);
}

function applyMove(draft: GameState, direction: Direction): boolean {
  const result = computeMove(draft.tiles, direction, draft.size);
  if (!result.moved) return false;

  draft.tiles = result.tiles;
  draft.displayTiles = result.displayTiles;
  draft.score += result.scoreGain;
  if (draft.score > draft.best) draft.best = draft.score;
  draft.anim.phase = 'sliding';
  draft.anim.elapsedMs = 0;
  draft.needsSpawn = true;
  return true;
}

function finalizeAnimation(draft: GameState): void {
  draft.anim.phase = 'idle';
  draft.anim.elapsedMs = 0;

  if (draft.needsSpawn) {
    spawnTile(draft);
    draft.needsSpawn = false;
  }

  draft.displayTiles = draft.tiles.map((tile) => ({
    id: tile.id,
    value: tile.value,
    fromRow: tile.row,
    fromCol: tile.col,
    toRow: tile.row,
    toCol: tile.col,
    hidden: false,
  }));

  if (!draft.keepPlaying && hasWon(draft.tiles)) {
    draft.phase = 'won';
    return;
  }

  if (!hasMoves(draft.tiles, draft.size)) {
    draft.phase = 'lost';
  }
}

function tryMove(direction: Direction): void {
  commitChange(`移动:${direction}`, (draft) => {
    if (draft.anim.phase !== 'idle') return;
    if (draft.phase === 'lost') return;
    if (draft.phase === 'ready') resetBoard(draft);
    applyMove(draft, direction);
  });
}

function detectSwipeDirection(dx: number, dy: number): Direction | null {
  if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

function Game() {
  useFrame((frame) => {
    const dtMs = Math.min(frame.deltaSeconds, 0.05) * 1000;
    commitChange('动画帧推进', (draft) => {
      if (draft.anim.phase !== 'sliding') return;
      draft.anim.elapsedMs += dtMs;
      if (draft.anim.elapsedMs < draft.anim.durationMs) return;
      finalizeAnimation(draft);
    });
  });

  const progress =
    store.anim.phase === 'idle' ? 1 : easeOutCubic(clamp01(store.anim.elapsedMs / store.anim.durationMs));
  const boardSize = store.size * store.cell;
  const statusText =
    store.phase === 'ready'
      ? '滑动开始游戏'
      : store.phase === 'won'
        ? '达成 2048！点击继续'
        : store.phase === 'lost'
          ? '游戏结束 - 点击重开'
          : '向任意方向滑动合并方块';

  const visibleTiles = store.displayTiles.filter((tile) => !tile.hidden);

  return (
    <scene
      name="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#faf8ef"
      clickable
      onClick={() => {
        commitChange('点击', (draft) => {
          if (draft.phase === 'ready') {
            resetBoard(draft);
            return;
          }
          if (draft.phase === 'lost') {
            resetBoard(draft);
            return;
          }
          if (draft.phase === 'won') {
            draft.keepPlaying = true;
            draft.phase = 'playing';
          }
        });
      }}
      onPointerDown={(e) => {
        commitChange('滑动:开始', (draft) => {
          draft.swipeStart = { x: e.x, y: e.y };
        });
      }}
      onPointerUp={(e) => {
        commitChange('滑动:结束', (draft) => {
          const from = draft.swipeStart;
          draft.swipeStart = null;
          if (!from || draft.anim.phase !== 'idle') return;

          const direction = detectSwipeDirection(e.x - from.x, e.y - from.y);
          if (!direction) return;

          if (draft.phase === 'ready') resetBoard(draft);
          if (draft.phase === 'lost') return;
          draft.phase = 'playing';
          applyMove(draft, direction);
        });
      }}
      onKeyDown={(event) => {
        const code = event.detail?.code;
        if (code === 'ArrowLeft') tryMove('left');
        if (code === 'ArrowRight') tryMove('right');
        if (code === 'ArrowUp') tryMove('up');
        if (code === 'ArrowDown') tryMove('down');
      }}
    >
      <text x={24} y={36} width={120} height={22} text="2048" textSize="28" textColor="#776e65" />
      <text x={24} y={64} width={160} height={18} text={`分数 ${store.score}`} textSize="16" textColor="#776e65" />
      <text
        x={SCENE_WIDTH - 140}
        y={64}
        width={116}
        height={18}
        text={`最高 ${store.best}`}
        textAlign="right"
        textSize="16"
        textColor="#776e65"
      />
      <text
        x={0}
        y={96}
        width={SCENE_WIDTH}
        height={20}
        text={statusText}
        textAlign="center"
        textSize="14"
        textColor="#8f7a66"
      />

      <node
        x={GRID_X - 8}
        y={GRID_Y - 8}
        width={boardSize + 16}
        height={boardSize + 16}
        shape="roundedRect(10 10 10 10)"
        backgroundColor="#bbada0"
      />

      {Array.from({ length: store.size * store.size }, (_, index) => {
        const row = Math.floor(index / store.size);
        const col = index % store.size;
        return (
          <node
            key={`cell-${row}-${col}`}
            x={GRID_X + col * store.cell + 6}
            y={GRID_Y + row * store.cell + 6}
            width={store.cell - 12}
            height={store.cell - 12}
            shape="roundedRect(6 6 6 6)"
            backgroundColor="#cdc1b4"
          />
        );
      })}

      {visibleTiles.map((tile) => {
        const row = tile.fromRow + (tile.toRow - tile.fromRow) * progress;
        const col = tile.fromCol + (tile.toCol - tile.fromCol) * progress;
        const x = GRID_X + col * store.cell + 6;
        const y = GRID_Y + row * store.cell + 6;
        const size = store.cell - 12;
        const colors = tileColor(tile.value);
        return (
          <group key={tile.id}>
            <node
              x={x}
              y={y}
              width={size}
              height={size}
              shape="roundedRect(6 6 6 6)"
              backgroundColor={colors.bg}
            />
            <text
              x={x}
              y={y + size / 2 - 14}
              width={size}
              height={28}
              text={`${tile.value}`}
              textAlign="center"
              textColor={colors.fg}
              textSize={textSizeFor(tile.value)}
            />
          </group>
        );
      })}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
