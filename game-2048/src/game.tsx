import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'left' | 'right' | 'up' | 'down';
type AnimPhase = 'idle' | 'sliding';
type GamePhase = 'playing' | 'won' | 'lost';

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
  remove: boolean;
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
  nextTileId: number;
  rng: number;
  pendingSpawn: boolean;
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const GRID_SIZE = 4;
const CELL_SIZE = 68;
const GRID_X = (SCENE_WIDTH - GRID_SIZE * CELL_SIZE) / 2;
const GRID_Y = 200;
const ANIM_DURATION_MS = 150;
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function easeOutCubic(t: number): number {
  const x = clamp(t, 0, 1) - 1;
  return x * x * x + 1;
}

function nextRng(seed: number): number {
  return (seed * 1103515245 + 12345) & 0x7fffffff;
}

function tileColor(value: number): { bg: string; fg: string } {
  return TILE_COLORS[value] ?? { bg: '#3c3a32', fg: '#f9f6f2' };
}

function tileFontSize(value: number): number {
  if (value < 100) return 28;
  if (value < 1000) return 24;
  if (value < 10000) return 20;
  return 16;
}

function createTile(id: string, value: number, row: number, col: number): Tile {
  return { id, value, row, col };
}

function spawnRandomTile(draft: GameState): void {
  const empty: { row: number; col: number }[] = [];
  for (let row = 0; row < draft.size; row++) {
    for (let col = 0; col < draft.size; col++) {
      if (!draft.tiles.some((tile) => tile.row === row && tile.col === col)) {
        empty.push({ row, col });
      }
    }
  }
  if (empty.length === 0) return;

  draft.rng = nextRng(draft.rng);
  const pick = draft.rng % empty.length;
  draft.rng = nextRng(draft.rng);
  const value = draft.rng % 10 === 0 ? 4 : 2;

  const spot = empty[pick]!;
  draft.tiles.push(createTile(`t${draft.nextTileId++}`, value, spot.row, spot.col));
}

function initBoard(draft: GameState): void {
  draft.phase = 'playing';
  draft.score = 0;
  draft.tiles = [];
  draft.displayTiles = [];
  draft.anim = { phase: 'idle', elapsedMs: 0, durationMs: ANIM_DURATION_MS };
  draft.pendingSpawn = false;
  draft.rng = 2048;
  spawnRandomTile(draft);
  spawnRandomTile(draft);
}

function tileAt(tiles: Tile[], row: number, col: number): Tile | undefined {
  return tiles.find((tile) => tile.row === row && tile.col === col);
}

function canMove(tiles: Tile[], size: number): boolean {
  if (tiles.length < size * size) return true;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const tile = tileAt(tiles, row, col);
      if (!tile) continue;
      const right = tileAt(tiles, row, col + 1);
      const down = tileAt(tiles, row + 1, col);
      if ((right && right.value === tile.value) || (down && down.value === tile.value)) return true;
    }
  }
  return false;
}

function sortTiles(tiles: Tile[], direction: Direction): Tile[] {
  return [...tiles].sort((a, b) => {
    if (direction === 'left') return a.row !== b.row ? a.row - b.row : a.col - b.col;
    if (direction === 'right') return a.row !== b.row ? a.row - b.row : b.col - a.col;
    if (direction === 'up') return a.col !== b.col ? a.col - b.col : a.row - b.row;
    return a.col !== b.col ? a.col - b.col : b.row - a.row;
  });
}

function moveTiles(draft: GameState, direction: Direction): boolean {
  if (draft.anim.phase !== 'idle' || draft.phase === 'lost') return false;

  const size = draft.size;
  const vectors: Record<Direction, { dr: number; dc: number }> = {
    left: { dr: 0, dc: -1 },
    right: { dr: 0, dc: 1 },
    up: { dr: -1, dc: 0 },
    down: { dr: 1, dc: 0 },
  };
  const vector = vectors[direction];
  const sorted = sortTiles(draft.tiles, direction);

  const displayTiles: DisplayTile[] = [];
  const nextTiles: Tile[] = [];
  const mergedThisTurn = new Set<string>();
  const occupied = new Map<string, Tile>();

  let moved = false;

  for (const tile of sorted) {
    let targetRow = tile.row;
    let targetCol = tile.col;
    let merged = false;

    while (true) {
      const nextRow = targetRow + vector.dr;
      const nextCol = targetCol + vector.dc;
      if (nextRow < 0 || nextRow >= size || nextCol < 0 || nextCol >= size) break;

      const occupant = occupied.get(`${nextRow},${nextCol}`);
      if (!occupant) {
        targetRow = nextRow;
        targetCol = nextCol;
        continue;
      }
      if (occupant.value === tile.value && !mergedThisTurn.has(occupant.id)) {
        targetRow = nextRow;
        targetCol = nextCol;
        merged = true;
        mergedThisTurn.add(occupant.id);
        occupant.value *= 2;
        draft.score += occupant.value;
        if (occupant.value >= 2048 && draft.phase === 'playing') draft.phase = 'won';
        break;
      }
      break;
    }

    if (targetRow !== tile.row || targetCol !== tile.col) moved = true;

    displayTiles.push({
      id: tile.id,
      value: tile.value,
      fromRow: tile.row,
      fromCol: tile.col,
      toRow: targetRow,
      toCol: targetCol,
      remove: merged,
    });

    if (!merged) {
      const updated = createTile(tile.id, tile.value, targetRow, targetCol);
      occupied.set(`${targetRow},${targetCol}`, updated);
      nextTiles.push(updated);
    }
  }

  if (!moved) return false;

  draft.displayTiles = displayTiles;
  draft.tiles = nextTiles;
  draft.anim.phase = 'sliding';
  draft.anim.elapsedMs = 0;
  draft.pendingSpawn = true;
  draft.best = Math.max(draft.best, draft.score);
  return true;
}

function finalizeAnimation(draft: GameState): void {
  if (draft.pendingSpawn) {
    spawnRandomTile(draft);
    draft.pendingSpawn = false;
  }

  draft.displayTiles = draft.tiles.map((tile) => ({
    id: tile.id,
    value: tile.value,
    fromRow: tile.row,
    fromCol: tile.col,
    toRow: tile.row,
    toCol: tile.col,
    remove: false,
  }));

  if (!canMove(draft.tiles, draft.size)) draft.phase = 'lost';

  draft.anim.phase = 'idle';
  draft.anim.elapsedMs = 0;
}

const { store, commitChange, storeHistory } = createGameStore<GameState>(
  {
    phase: 'playing',
    score: 0,
    best: 0,
    size: GRID_SIZE,
    cell: CELL_SIZE,
    tiles: [],
    displayTiles: [],
    anim: { phase: 'idle', elapsedMs: 0, durationMs: ANIM_DURATION_MS },
    swipeStart: null,
    nextTileId: 1,
    rng: 2048,
    pendingSpawn: false,
  },
  { enableHistory: true },
);

commitChange('初始化', (draft) => {
  initBoard(draft);
});

function beginMove(direction: Direction): void {
  commitChange(`移动:${direction}`, (draft) => {
    moveTiles(draft, direction);
  });
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

  const boardSize = store.size * store.cell;
  const progress =
    store.anim.phase === 'idle' ? 1 : easeOutCubic(clamp(store.anim.elapsedMs / store.anim.durationMs, 0, 1));

  const visibleTiles =
    store.anim.phase === 'sliding'
      ? store.displayTiles.filter((tile) => !tile.remove || progress < 1)
      : store.tiles.map((tile) => ({
          id: tile.id,
          value: tile.value,
          fromRow: tile.row,
          fromCol: tile.col,
          toRow: tile.row,
          toCol: tile.col,
          remove: false,
        }));

  const statusText =
    store.phase === 'won' ? '达成 2048！继续滑动' : store.phase === 'lost' ? '游戏结束' : '滑动方块合并';

  return (
    <scene
      name="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#faf8ef"
      clickable
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

          const dx = event.x - from.x;
          const dy = event.y - from.y;
          if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

          const direction: Direction =
            Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
          moveTiles(draft, direction);
        });
      }}
      onKeyDown={(event) => {
        const code = event.detail?.code;
        if (code === 'ArrowLeft') beginMove('left');
        if (code === 'ArrowRight') beginMove('right');
        if (code === 'ArrowUp') beginMove('up');
        if (code === 'ArrowDown') beginMove('down');
      }}
    >
      <text x={0} y={36} width={SCENE_WIDTH} height={36} text="2048" textAlign="center" textColor="#776e65" textSize="32" />

      <node x={24} y={88} width={148} height={64} shape="roundedRect(6 6 6 6)" backgroundColor="#bbada0">
        <text x={0} y={10} width={148} height={18} text="分数" textAlign="center" textColor="#eee4da" textSize="12" />
        <text x={0} y={30} width={148} height={28} text={`${store.score}`} textAlign="center" textColor="#ffffff" textSize="22" />
      </node>

      <node x={188} y={88} width={148} height={64} shape="roundedRect(6 6 6 6)" backgroundColor="#bbada0">
        <text x={0} y={10} width={148} height={18} text="最高" textAlign="center" textColor="#eee4da" textSize="12" />
        <text x={0} y={30} width={148} height={28} text={`${store.best}`} textAlign="center" textColor="#ffffff" textSize="22" />
      </node>

      <group
        x={24}
        y={160}
        width={120}
        height={32}
        clickable
        onClick={() => {
          commitChange('新游戏', (draft) => {
            initBoard(draft);
          });
        }}
      >
        <node x={0} y={0} width={120} height={32} shape="roundedRect(6 6 6 6)" backgroundColor="#8f7a66" />
        <text x={0} y={7} width={120} height={20} text="新游戏" textAlign="center" textColor="#f9f6f2" textSize="14" />
      </group>

      <text x={0} y={168} width={SCENE_WIDTH} height={20} text={statusText} textAlign="center" textColor="#776e65" textSize="14" />

      <node x={GRID_X} y={GRID_Y} width={boardSize} height={boardSize} shape="roundedRect(8 8 8 8)" backgroundColor="#bbada0" />

      {Array.from({ length: store.size * store.size }, (_, index) => {
        const row = Math.floor(index / store.size);
        const col = index % store.size;
        const x = GRID_X + col * store.cell + 6;
        const y = GRID_Y + row * store.cell + 6;
        return (
          <node
            key={`cell-${row}-${col}`}
            x={x}
            y={y}
            width={store.cell - 12}
            height={store.cell - 12}
            shape="roundedRect(4 4 4 4)"
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
        const displayValue = store.anim.phase === 'sliding' ? tile.value : tile.value;
        const colors = tileColor(displayValue);
        const alpha = tile.remove ? 1 - progress : 1;
        const fontSize = tileFontSize(displayValue);

        return (
          <group key={tile.id}>
            <node
              x={x}
              y={y}
              width={size}
              height={size}
              shape="roundedRect(4 4 4 4)"
              backgroundColor={colors.bg}
              opacity={alpha}
            />
            <text
              x={x}
              y={y + (size - fontSize) / 2 - 2}
              width={size}
              height={fontSize + 4}
              text={`${displayValue}`}
              textAlign="center"
              textColor={colors.fg}
              textSize={`${fontSize}`}
              opacity={alpha}
            />
          </group>
        );
      })}

      {store.phase === 'lost' && (
        <node x={GRID_X} y={GRID_Y} width={boardSize} height={boardSize} shape="roundedRect(8 8 8 8)" backgroundColor="#eee4da" opacity={0.72}>
          <text x={0} y={boardSize / 2 - 20} width={boardSize} height={40} text="游戏结束" textAlign="center" textColor="#776e65" textSize="28" />
        </node>
      )}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
