import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'left' | 'right' | 'up' | 'down';
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
  hiddenAfter?: boolean;
};

type GameState = {
  phase: GamePhase;
  size: number;
  cell: number;
  tiles: Tile[];
  displayTiles: DisplayTile[];
  anim: { phase: AnimPhase; elapsedMs: number; durationMs: number };
  pendingSpawn: boolean;
  score: number;
  rngSeed: number;
  rngCursor: number;
  nextTileId: number;
  swipeStart: { x: number; y: number } | null;
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const GRID_SIZE = 4;
const CELL = 72;
const GRID_X = (SCENE_WIDTH - GRID_SIZE * CELL) / 2;
const GRID_Y = 196;
const SLIDE_MS = 140;
const SWIPE_THRESHOLD = 24;
const RNG_SEED = 2048;

const TILE_COLORS: Record<number, [string, string]> = {
  2: ['#eee4da', '#776e65'],
  4: ['#ede0c8', '#776e65'],
  8: ['#f2b179', '#f9f6f2'],
  16: ['#f59563', '#f9f6f2'],
  32: ['#f67c5f', '#f9f6f2'],
  64: ['#f65e3b', '#f9f6f2'],
  128: ['#edcf72', '#f9f6f2'],
  256: ['#edcc61', '#f9f6f2'],
  512: ['#edc850', '#f9f6f2'],
  1024: ['#edc53f', '#f9f6f2'],
  2048: ['#edc22e', '#f9f6f2'],
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function easeOutCubic(t: number): number {
  const x = clamp(t, 0, 1) - 1;
  return x * x * x + 1;
}

function nextRandom(seed: number, cursor: number): { value: number; cursor: number } {
  const mixed = (seed ^ (cursor * 1103515245 + 12345)) >>> 0;
  const next = (mixed * 1664525 + 1013904223) >>> 0;
  return { value: next / 0x100000000, cursor: cursor + 1 };
}

function tileColors(value: number): [string, string] {
  return TILE_COLORS[value] ?? ['#3c3a32', '#f9f6f2'];
}

function tileFontSize(value: number): number {
  if (value >= 1000) return 20;
  if (value >= 100) return 24;
  return 28;
}

function makeInitialState(): GameState {
  return {
    phase: 'ready',
    size: GRID_SIZE,
    cell: CELL,
    tiles: [],
    displayTiles: [],
    anim: { phase: 'idle', elapsedMs: 0, durationMs: SLIDE_MS },
    pendingSpawn: false,
    score: 0,
    rngSeed: RNG_SEED,
    rngCursor: 0,
    nextTileId: 1,
    swipeStart: null,
  };
}

function tilesToDisplay(tiles: Tile[]): DisplayTile[] {
  return tiles.map((tile) => ({
    id: tile.id,
    value: tile.value,
    fromRow: tile.row,
    fromCol: tile.col,
    toRow: tile.row,
    toCol: tile.col,
  }));
}

function getEmptyCells(tiles: Tile[], size: number): { row: number; col: number }[] {
  const occupied = new Set(tiles.map((t) => `${t.row},${t.col}`));
  const empty: { row: number; col: number }[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!occupied.has(`${row},${col}`)) empty.push({ row, col });
    }
  }
  return empty;
}

function spawnTile(draft: GameState): void {
  const empty = getEmptyCells(draft.tiles, draft.size);
  if (empty.length === 0) return;

  const pick = nextRandom(draft.rngSeed, draft.rngCursor);
  draft.rngCursor = pick.cursor;
  const cell = empty[Math.floor(pick.value * empty.length)]!;

  const valuePick = nextRandom(draft.rngSeed, draft.rngCursor);
  draft.rngCursor = valuePick.cursor;
  const value = valuePick.value < 0.9 ? 2 : 4;

  const tile: Tile = {
    id: `t-${draft.nextTileId}`,
    value,
    row: cell.row,
    col: cell.col,
  };
  draft.nextTileId += 1;
  draft.tiles.push(tile);
}

function setupNewGame(draft: GameState): void {
  Object.assign(draft, makeInitialState());
  draft.phase = 'playing';
  spawnTile(draft);
  spawnTile(draft);
  draft.displayTiles = tilesToDisplay(draft.tiles);
}

function hasValidMove(tiles: Tile[], size: number): boolean {
  if (tiles.length < size * size) return true;
  const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  for (const tile of tiles) grid[tile.row]![tile.col] = tile.value;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const value = grid[row]![col]!;
      if (col + 1 < size && grid[row]![col + 1] === value) return true;
      if (row + 1 < size && grid[row + 1]![col] === value) return true;
    }
  }
  return false;
}

function sortTilesForDirection(tiles: Tile[], direction: Direction): Tile[] {
  const copy = [...tiles];
  if (direction === 'left') copy.sort((a, b) => a.col - b.col);
  if (direction === 'right') copy.sort((a, b) => b.col - a.col);
  if (direction === 'up') copy.sort((a, b) => a.row - b.row);
  if (direction === 'down') copy.sort((a, b) => b.row - a.row);
  return copy;
}

function moveVector(direction: Direction): { dr: number; dc: number } {
  if (direction === 'left') return { dr: 0, dc: -1 };
  if (direction === 'right') return { dr: 0, dc: 1 };
  if (direction === 'up') return { dr: -1, dc: 0 };
  return { dr: 1, dc: 0 };
}

function computeMove(
  tiles: Tile[],
  direction: Direction,
  size: number,
): { moved: boolean; scoreGain: number; displayTiles: DisplayTile[]; nextTiles: Tile[] } {
  const { dr, dc } = moveVector(direction);
  const grid: (Tile | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const removedIds = new Set<string>();
  const mergedTargets = new Set<string>();
  const displayTiles: DisplayTile[] = [];
  let scoreGain = 0;
  let moved = false;

  for (const tile of sortTilesForDirection(tiles, direction)) {
    if (removedIds.has(tile.id)) continue;

    const fromRow = tile.row;
    const fromCol = tile.col;
    let destRow = fromRow;
    let destCol = fromCol;

    while (true) {
      const nextRow = destRow + dr;
      const nextCol = destCol + dc;
      if (nextRow < 0 || nextRow >= size || nextCol < 0 || nextCol >= size) break;

      const neighbor = grid[nextRow]![nextCol];
      if (!neighbor) {
        destRow = nextRow;
        destCol = nextCol;
      } else if (neighbor.value === tile.value && !mergedTargets.has(neighbor.id)) {
        destRow = nextRow;
        destCol = nextCol;
        break;
      } else {
        break;
      }
    }

    if (destRow === fromRow && destCol === fromCol) {
      grid[fromRow]![fromCol] = tile;
      continue;
    }

    moved = true;
    const target = grid[destRow]![destCol];

    if (target && target.value === tile.value) {
      removedIds.add(tile.id);
      mergedTargets.add(target.id);
      target.value *= 2;
      scoreGain += target.value;

      displayTiles.push({
        id: tile.id,
        value: tile.value,
        fromRow,
        fromCol,
        toRow: destRow,
        toCol: destCol,
        hiddenAfter: true,
      });
      displayTiles.push({
        id: target.id,
        value: target.value / 2,
        fromRow: target.row,
        fromCol: target.col,
        toRow: destRow,
        toCol: destCol,
      });
      grid[destRow]![destCol] = target;
    } else {
      grid[fromRow]![fromCol] = null;
      tile.row = destRow;
      tile.col = destCol;
      grid[destRow]![destCol] = tile;
      displayTiles.push({
        id: tile.id,
        value: tile.value,
        fromRow,
        fromCol,
        toRow: destRow,
        toCol: destCol,
      });
    }
  }

  for (const tile of tiles) {
    if (!displayTiles.some((d) => d.id === tile.id)) {
      displayTiles.push({
        id: tile.id,
        value: tile.value,
        fromRow: tile.row,
        fromCol: tile.col,
        toRow: tile.row,
        toCol: tile.col,
      });
    }
  }

  const nextTiles: Tile[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const tile = grid[row]![col];
      if (tile && !removedIds.has(tile.id)) nextTiles.push(tile);
    }
  }

  return { moved, scoreGain, displayTiles, nextTiles };
}

function tryMove(draft: GameState, direction: Direction): void {
  if (draft.phase === 'ready') setupNewGame(draft);
  if (draft.phase !== 'playing' || draft.anim.phase !== 'idle') return;

  const result = computeMove(draft.tiles, direction, draft.size);
  if (!result.moved) return;

  draft.score += result.scoreGain;
  draft.tiles = result.nextTiles;
  draft.displayTiles = result.displayTiles;
  draft.pendingSpawn = true;
  draft.anim.phase = 'sliding';
  draft.anim.elapsedMs = 0;
}

function beginMove(direction: Direction): void {
  commitChange(`移动:${direction}`, (draft) => {
    tryMove(draft, direction);
  });
}

function finishSliding(draft: GameState): void {
  if (draft.pendingSpawn) {
    spawnTile(draft);
    draft.pendingSpawn = false;
  }

  draft.displayTiles = tilesToDisplay(draft.tiles);
  draft.anim.phase = 'idle';
  draft.anim.elapsedMs = 0;

  if (draft.tiles.some((tile) => tile.value >= 2048) && draft.phase === 'playing') {
    draft.phase = 'won';
  } else if (!hasValidMove(draft.tiles, draft.size)) {
    draft.phase = 'lost';
  }
}

function detectSwipe(dx: number, dy: number): Direction | null {
  if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

const { store, commitChange, storeHistory } = createGameStore<GameState>(makeInitialState(), {
  enableHistory: true,
});

function Game() {
  useFrame((frame) => {
    const dtMs = Math.min(frame.deltaSeconds, 0.05) * 1000;
    commitChange('动画帧推进', (draft) => {
      if (draft.anim.phase !== 'sliding') return;
      draft.anim.elapsedMs += dtMs;
      if (draft.anim.elapsedMs < draft.anim.durationMs) return;
      finishSliding(draft);
    });
  });

  const progress =
    store.anim.phase === 'idle' ? 1 : easeOutCubic(store.anim.elapsedMs / store.anim.durationMs);
  const boardWidth = store.size * store.cell;
  const boardHeight = store.size * store.cell;

  const statusText =
    store.phase === 'ready'
      ? '滑动或点击开始'
      : store.phase === 'won'
        ? '达成 2048！点击重来'
        : store.phase === 'lost'
          ? '无路可走，点击重来'
          : '向上滑动合并方块';

  return (
    <scene
      name="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#faf8ef"
      clickable
      onClick={() => {
        commitChange('开始或重来', (draft) => {
          if (draft.phase === 'ready') setupNewGame(draft);
          else if (draft.phase === 'won' || draft.phase === 'lost') setupNewGame(draft);
        });
      }}
      onPointerDown={(event) => {
        commitChange('滑动:开始', (draft) => {
          draft.swipeStart = { x: event.x, y: event.y };
        });
      }}
      onPointerUp={(event) => {
        commitChange('滑动:结束', (draft) => {
          const from = draft.swipeStart;
          draft.swipeStart = null;
          if (!from) return;
          const direction = detectSwipe(event.x - from.x, event.y - from.y);
          if (!direction) return;
          tryMove(draft, direction);
        });
      }}
      onKeyDown={(event) => {
        if (event.detail?.code === 'ArrowLeft') beginMove('left');
        if (event.detail?.code === 'ArrowRight') beginMove('right');
        if (event.detail?.code === 'ArrowUp') beginMove('up');
        if (event.detail?.code === 'ArrowDown') beginMove('down');
      }}
    >
      <text
        x={24}
        y={48}
        width={160}
        height={36}
        text="2048"
        textAlign="left"
        textColor="#776e65"
        textSize="42"
      />
      <text
        x={24}
        y={88}
        width={200}
        height={22}
        text={statusText}
        textAlign="left"
        textColor="#8f7a66"
        textSize="14"
      />

      <node
        x={SCENE_WIDTH - 108}
        y={52}
        width={84}
        height={56}
        shape="roundedRect(8 8 8 8)"
        backgroundColor="#bbada0"
      />
      <text
        x={SCENE_WIDTH - 108}
        y={58}
        width={84}
        height={18}
        text="分数"
        textAlign="center"
        textColor="#eee4da"
        textSize="12"
      />
      <text
        x={SCENE_WIDTH - 108}
        y={76}
        width={84}
        height={28}
        text={`${store.score}`}
        textAlign="center"
        textColor="#ffffff"
        textSize="22"
      />

      <node
        x={GRID_X - 8}
        y={GRID_Y - 8}
        width={boardWidth + 16}
        height={boardHeight + 16}
        shape="roundedRect(10 10 10 10)"
        backgroundColor="#bbada0"
      />

      {Array.from({ length: store.size * store.size }, (_, index) => {
        const row = Math.floor(index / store.size);
        const col = index % store.size;
        return (
          <node
            key={`cell-${row}-${col}`}
            x={GRID_X + col * store.cell + 4}
            y={GRID_Y + row * store.cell + 4}
            width={store.cell - 8}
            height={store.cell - 8}
            shape="roundedRect(6 6 6 6)"
            backgroundColor="#cdc1b4"
          />
        );
      })}

      {store.displayTiles.map((tile) => {
        if (tile.hiddenAfter && progress >= 1) return null;
        const row = tile.fromRow + (tile.toRow - tile.fromRow) * progress;
        const col = tile.fromCol + (tile.toCol - tile.fromCol) * progress;
        const x = GRID_X + col * store.cell + 4;
        const y = GRID_Y + row * store.cell + 4;
        const size = store.cell - 8;
        const [bg, fg] = tileColors(tile.value);
        const fontSize = tileFontSize(tile.value);
        const alpha = tile.hiddenAfter && progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;
        if (alpha <= 0) return null;

        return (
          <group key={tile.id}>
            <node
              x={x}
              y={y}
              width={size}
              height={size}
              alpha={alpha}
              shape="roundedRect(6 6 6 6)"
              backgroundColor={bg}
            />
            <text
              x={x}
              y={y + (size - fontSize) / 2 - 2}
              width={size}
              height={fontSize + 4}
              alpha={alpha}
              text={`${tile.value}`}
              textAlign="center"
              textColor={fg}
              textSize={`${fontSize}`}
            />
          </group>
        );
      })}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
