import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'left' | 'right' | 'up' | 'down';
type AnimPhase = 'idle' | 'sliding';
type GamePhase = 'ready' | 'playing' | 'lost';

type Tile = {
  id: string;
  value: number;
  row: number;
  col: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  removed?: boolean;
  willMerge?: boolean;
};

type GameState = {
  phase: GamePhase;
  rows: number;
  cols: number;
  cell: number;
  tiles: Tile[];
  score: number;
  best: number;
  nextTileId: number;
  rngSeed: number;
  swipeStart: { x: number; y: number } | null;
  anim: {
    phase: AnimPhase;
    elapsedMs: number;
    durationMs: number;
  };
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const GRID_ROWS = 4;
const GRID_COLS = 4;
const CELL_SIZE = 72;
const GRID_X = (SCENE_WIDTH - GRID_COLS * CELL_SIZE) / 2;
const GRID_Y = 200;
const SWIPE_THRESHOLD = 24;
const SLIDE_DURATION_MS = 160;

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

function tileColor(value: number): { bg: string; fg: string } {
  return TILE_COLORS[value] ?? { bg: '#3c3a32', fg: '#f9f6f2' };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function easeOutCubic(t: number): number {
  const x = clamp(t, 0, 1) - 1;
  return x * x * x + 1;
}

function nextRandom(seed: number): [number, number] {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return [next / 0xffffffff, next];
}

function makeTile(id: string, value: number, row: number, col: number): Tile {
  return { id, value, row, col, fromRow: row, fromCol: col, toRow: row, toCol: col };
}

function getEmptyCells(tiles: Tile[], rows: number, cols: number): { row: number; col: number }[] {
  const occupied = new Set(tiles.filter((t) => !t.removed).map((t) => `${t.row},${t.col}`));
  const empty: { row: number; col: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!occupied.has(`${r},${c}`)) empty.push({ row: r, col: c });
    }
  }
  return empty;
}

function spawnRandomTile(draft: GameState): void {
  const empty = getEmptyCells(draft.tiles, draft.rows, draft.cols);
  if (empty.length === 0) return;

  let rand: number;
  [rand, draft.rngSeed] = nextRandom(draft.rngSeed);
  const cell = empty[Math.floor(rand * empty.length)]!;

  [rand, draft.rngSeed] = nextRandom(draft.rngSeed);
  const value = rand < 0.9 ? 2 : 4;

  draft.tiles.push(makeTile(`t${draft.nextTileId++}`, value, cell.row, cell.col));
}

function makeInitialState(): GameState {
  const state: GameState = {
    phase: 'ready',
    rows: GRID_ROWS,
    cols: GRID_COLS,
    cell: CELL_SIZE,
    tiles: [],
    score: 0,
    best: 0,
    nextTileId: 1,
    rngSeed: 42,
    swipeStart: null,
    anim: { phase: 'idle', elapsedMs: 0, durationMs: SLIDE_DURATION_MS },
  };
  spawnRandomTile(state);
  spawnRandomTile(state);
  return state;
}

const { store, commitChange, storeHistory } = createGameStore<GameState>(makeInitialState(), { enableHistory: true });

function moveLine(
  tiles: Tile[],
  lineIndex: number,
  axis: 'row' | 'col',
  direction: 'negative' | 'positive',
  cols: number,
): { tiles: Tile[]; moved: boolean; scoreGain: number } {
  const lineTiles = tiles
    .filter((t) => !t.removed && (axis === 'row' ? t.row === lineIndex : t.col === lineIndex))
    .sort((a, b) => {
      const av = axis === 'row' ? a.col : a.row;
      const bv = axis === 'row' ? b.col : b.row;
      return direction === 'negative' ? av - bv : bv - av;
    });

  const limit = axis === 'row' ? cols : GRID_ROWS;
  const result: Tile[] = [];
  let moved = false;
  let scoreGain = 0;
  let target = direction === 'negative' ? 0 : limit - 1;
  const step = direction === 'negative' ? 1 : -1;

  for (let i = 0; i < lineTiles.length; i++) {
    const tile = lineTiles[i]!;
    const fromPos = axis === 'row' ? tile.col : tile.row;

    if (i + 1 < lineTiles.length && lineTiles[i + 1]!.value === tile.value) {
      const partner = lineTiles[i + 1]!;
      const partnerFrom = axis === 'row' ? partner.col : partner.row;
      const toRow = axis === 'row' ? lineIndex : target;
      const toCol = axis === 'row' ? target : lineIndex;

      if (fromPos !== target || partnerFrom !== target) moved = true;
      scoreGain += tile.value * 2;

      result.push({
        ...tile,
        fromRow: tile.row,
        fromCol: tile.col,
        toRow,
        toCol,
        willMerge: true,
      });
      result.push({
        ...partner,
        fromRow: partner.row,
        fromCol: partner.col,
        toRow,
        toCol,
        removed: true,
      });

      target += step;
      i++;
      continue;
    }

    const toRow = axis === 'row' ? lineIndex : target;
    const toCol = axis === 'row' ? target : lineIndex;
    if (fromPos !== target) moved = true;

    result.push({
      ...tile,
      fromRow: tile.row,
      fromCol: tile.col,
      toRow,
      toCol,
    });
    target += step;
  }

  const otherTiles = tiles.filter((t) => (axis === 'row' ? t.row !== lineIndex : t.col !== lineIndex));
  return { tiles: [...otherTiles, ...result], moved, scoreGain };
}

function applyMove(tiles: Tile[], direction: Direction, rows: number, cols: number): { tiles: Tile[]; moved: boolean; scoreGain: number } {
  let result = tiles.map((t) => ({ ...t }));
  let moved = false;
  let scoreGain = 0;

  if (direction === 'left') {
    for (let r = 0; r < rows; r++) {
      const line = moveLine(result, r, 'row', 'negative', cols);
      result = line.tiles;
      moved = moved || line.moved;
      scoreGain += line.scoreGain;
    }
  } else if (direction === 'right') {
    for (let r = 0; r < rows; r++) {
      const line = moveLine(result, r, 'row', 'positive', cols);
      result = line.tiles;
      moved = moved || line.moved;
      scoreGain += line.scoreGain;
    }
  } else if (direction === 'up') {
    for (let c = 0; c < cols; c++) {
      const line = moveLine(result, c, 'col', 'negative', cols);
      result = line.tiles;
      moved = moved || line.moved;
      scoreGain += line.scoreGain;
    }
  } else {
    for (let c = 0; c < cols; c++) {
      const line = moveLine(result, c, 'col', 'positive', cols);
      result = line.tiles;
      moved = moved || line.moved;
      scoreGain += line.scoreGain;
    }
  }

  return { tiles: result, moved, scoreGain };
}

function canMove(tiles: Tile[], rows: number, cols: number): boolean {
  if (getEmptyCells(tiles, rows, cols).length > 0) return true;
  for (const dir of ['left', 'right', 'up', 'down'] as Direction[]) {
    if (applyMove(tiles, dir, rows, cols).moved) return true;
  }
  return false;
}

function finalizeAnimation(draft: GameState): void {
  draft.tiles = draft.tiles
    .filter((t) => !t.removed)
    .map((t) => {
      const value = t.willMerge ? t.value * 2 : t.value;
      return makeTile(t.id, value, t.toRow, t.toCol);
    });

  draft.anim.phase = 'idle';
  draft.anim.elapsedMs = 0;

  spawnRandomTile(draft);

  if (!canMove(draft.tiles, draft.rows, draft.cols)) {
    draft.phase = 'lost';
  }
}

function restartGame(): void {
  commitChange('重开', (draft) => {
    Object.assign(draft, makeInitialState());
    draft.phase = 'playing';
  });
}

function Game() {
  useFrame((frame) => {
    const dtMs = Math.min(frame.deltaSeconds, 0.05) * 1000;
    commitChange('动画帧', (draft) => {
      if (draft.anim.phase !== 'sliding') return;
      draft.anim.elapsedMs += dtMs;
      if (draft.anim.elapsedMs < draft.anim.durationMs) return;
      finalizeAnimation(draft);
    });
  });

  const progress =
    store.anim.phase === 'idle' ? 1 : easeOutCubic(clamp(store.anim.elapsedMs / store.anim.durationMs, 0, 1));
  const boardWidth = store.cols * store.cell;
  const boardHeight = store.rows * store.cell;

  const title =
    store.phase === 'ready'
      ? '滑动屏幕开始游戏'
      : store.phase === 'lost'
        ? '游戏结束'
        : '向任意方向滑动合并数字';

  return (
    <scene
      name="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#faf8ef"
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
          if (draft.phase === 'lost' || draft.anim.phase !== 'idle') return;

          const { tiles, moved, scoreGain } = applyMove(draft.tiles, direction, draft.rows, draft.cols);
          if (!moved) return;

          draft.tiles = tiles;
          draft.score += scoreGain;
          if (draft.score > draft.best) draft.best = draft.score;
          draft.anim.phase = 'sliding';
          draft.anim.elapsedMs = 0;
        });
      }}
    >
      <text x={0} y={36} width={SCENE_WIDTH} height={32} text="2048" textAlign="center" textColor="#776e65" textSize="42" />

      <node x={GRID_X - 8} y={108} width={boardWidth + 16} height={48} shape="roundedRect(6 6 6 6)" backgroundColor="#bbada0" />
      <text x={GRID_X} y={116} width={boardWidth / 2} height={16} text="分数" textAlign="center" textColor="#eee4da" textSize="12" />
      <text
        x={GRID_X}
        y={132}
        width={boardWidth / 2}
        height={20}
        text={`${store.score}`}
        textAlign="center"
        textColor="#ffffff"
        textSize="18"
      />
      <text x={GRID_X + boardWidth / 2} y={116} width={boardWidth / 2} height={16} text="最高" textAlign="center" textColor="#eee4da" textSize="12" />
      <text
        x={GRID_X + boardWidth / 2}
        y={132}
        width={boardWidth / 2}
        height={20}
        text={`${store.best}`}
        textAlign="center"
        textColor="#ffffff"
        textSize="18"
      />

      <text x={0} y={168} width={SCENE_WIDTH} height={20} text={title} textAlign="center" textColor="#776e65" textSize="14" />

      <node x={GRID_X} y={GRID_Y} width={boardWidth} height={boardHeight} shape="roundedRect(8 8 8 8)" backgroundColor="#bbada0" />

      {Array.from({ length: store.rows * store.cols }, (_, i) => {
        const r = Math.floor(i / store.cols);
        const c = i % store.cols;
        return (
          <node
            key={`cell-${r}-${c}`}
            x={GRID_X + c * store.cell + 6}
            y={GRID_Y + r * store.cell + 6}
            width={store.cell - 12}
            height={store.cell - 12}
            shape="roundedRect(4 4 4 4)"
            backgroundColor="#cdc1b4"
          />
        );
      })}

      {store.tiles.map((tile) => {
        const row = tile.fromRow + (tile.toRow - tile.fromRow) * progress;
        const col = tile.fromCol + (tile.toCol - tile.fromCol) * progress;
        const x = GRID_X + col * store.cell + 6;
        const y = GRID_Y + row * store.cell + 6;
        const size = store.cell - 12;
        const colors = tileColor(tile.value);
        const fontSize = tile.value >= 1000 ? 20 : tile.value >= 100 ? 24 : 28;

        return (
          <group key={tile.id}>
            <node x={x} y={y} width={size} height={size} shape="roundedRect(4 4 4 4)" backgroundColor={colors.bg} />
            <text
              x={x}
              y={y + (size - fontSize) / 2 - 2}
              width={size}
              height={fontSize + 4}
              text={`${tile.value}`}
              textAlign="center"
              textColor={colors.fg}
              textSize={`${fontSize}`}
            />
          </group>
        );
      })}

      {store.phase === 'lost' && (
        <group x={GRID_X} y={GRID_Y} width={boardWidth} height={boardHeight} zIndex={10}>
          <node x={0} y={0} width={boardWidth} height={boardHeight} shape="roundedRect(8 8 8 8)" backgroundColor="rgba(238,228,218,0.73)" />
          <text x={0} y={boardHeight / 2 - 48} width={boardWidth} height={32} text="游戏结束" textAlign="center" textColor="#776e65" textSize="28" />
          <group
            x={boardWidth / 2 - 56}
            y={boardHeight / 2 + 8}
            width={112}
            height={40}
            clickable
            onClick={restartGame}
          >
            <node x={0} y={0} width={112} height={40} shape="roundedRect(6 6 6 6)" backgroundColor="#8f7a66" />
            <text x={0} y={10} width={112} height={20} text="再来一局" textAlign="center" textColor="#f9f6f2" textSize="16" />
          </group>
        </group>
      )}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
