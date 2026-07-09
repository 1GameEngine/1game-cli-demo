import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'up' | 'down' | 'left' | 'right';
type AnimPhase = 'idle' | 'sliding';
type GamePhase = 'ready' | 'playing' | 'won' | 'lost';

type TileData = {
  id: string;
  value: number;
};

type DisplayTile = {
  id: string;
  value: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  hiddenAfterAnim?: boolean;
};

type GameState = {
  phase: GamePhase;
  rows: number;
  cols: number;
  cell: number;
  score: number;
  best: number;
  grid: (string | null)[][];
  tiles: Record<string, TileData>;
  displayTiles: DisplayTile[];
  pendingGrid: (string | null)[][] | null;
  pendingTiles: Record<string, TileData> | null;
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
const GRID_WIDTH = GRID_COLS * CELL_SIZE;
const GRID_HEIGHT = GRID_ROWS * CELL_SIZE;
const GRID_X = (SCENE_WIDTH - GRID_WIDTH) / 2;
const GRID_Y = 200;
const SWIPE_THRESHOLD = 24;
const ANIM_DURATION_MS = 140;

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  2: { bg: '#eee4da', text: '#776e65' },
  4: { bg: '#ede0c8', text: '#776e65' },
  8: { bg: '#f2b179', text: '#f9f6f2' },
  16: { bg: '#f59563', text: '#f9f6f2' },
  32: { bg: '#f67c5f', text: '#f9f6f2' },
  64: { bg: '#f65e3b', text: '#f9f6f2' },
  128: { bg: '#edcf72', text: '#f9f6f2' },
  256: { bg: '#edcc61', text: '#f9f6f2' },
  512: { bg: '#edc850', text: '#f9f6f2' },
  1024: { bg: '#edc53f', text: '#f9f6f2' },
  2048: { bg: '#edc22e', text: '#f9f6f2' },
};

function tileStyle(value: number): { bg: string; text: string } {
  return TILE_COLORS[value] ?? { bg: '#3c3a32', text: '#f9f6f2' };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function easeOutCubic(t: number): number {
  const x = clamp(t, 0, 1) - 1;
  return x * x * x + 1;
}

function nextRandom(seed: number): { value: number; nextSeed: number } {
  const nextSeed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return { value: nextSeed, nextSeed };
}

function createEmptyGrid(rows: number, cols: number): (string | null)[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
}

function cloneGrid(grid: (string | null)[][]): (string | null)[][] {
  return grid.map((row) => [...row]);
}

function getEmptyCells(grid: (string | null)[][]): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (!grid[row][col]) cells.push({ row, col });
    }
  }
  return cells;
}

function buildDisplayTilesFromGrid(
  grid: (string | null)[][],
  tiles: Record<string, TileData>,
): DisplayTile[] {
  const result: DisplayTile[] = [];
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const id = grid[row][col];
      if (!id) continue;
      const tile = tiles[id];
      if (!tile) continue;
      result.push({
        id,
        value: tile.value,
        fromRow: row,
        fromCol: col,
        toRow: row,
        toCol: col,
      });
    }
  }
  return result;
}

function canMove(grid: (string | null)[][], tiles: Record<string, TileData>): boolean {
  if (getEmptyCells(grid).length > 0) return true;
  const rows = grid.length;
  const cols = grid[0].length;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const id = grid[row][col];
      if (!id) continue;
      const value = tiles[id]?.value;
      if (col + 1 < cols) {
        const rightId = grid[row][col + 1];
        if (rightId && tiles[rightId]?.value === value) return true;
      }
      if (row + 1 < rows) {
        const downId = grid[row + 1][col];
        if (downId && tiles[downId]?.value === value) return true;
      }
    }
  }
  return false;
}

type LineTile = {
  id: string;
  value: number;
  fromRow: number;
  fromCol: number;
};

type MoveOutcome = {
  changed: boolean;
  scoreGain: number;
  displayTiles: DisplayTile[];
  nextGrid: (string | null)[][];
  nextTiles: Record<string, TileData>;
};

function processHorizontalLine(
  grid: (string | null)[][],
  tiles: Record<string, TileData>,
  row: number,
  cols: number[],
): {
  displayTiles: DisplayTile[];
  lineGrid: (string | null)[];
  lineTiles: Record<string, TileData>;
  scoreGain: number;
  changed: boolean;
} {
  const line: LineTile[] = [];
  for (const col of cols) {
    const id = grid[row][col];
    if (!id) continue;
    line.push({ id, value: tiles[id].value, fromRow: row, fromCol: col });
  }

  const displayTiles: DisplayTile[] = [];
  const lineGrid: (string | null)[] = Array.from({ length: cols.length }, () => null);
  const lineTiles: Record<string, TileData> = {};
  let scoreGain = 0;
  let changed = false;
  let target = 0;
  let index = 0;

  while (index < line.length) {
    const current = line[index];
    const partner = line[index + 1];

    if (partner && current.value === partner.value) {
      const mergedValue = current.value * 2;
      scoreGain += mergedValue;
      if (current.fromCol !== cols[target] || partner.fromCol !== cols[target]) changed = true;

      displayTiles.push({
        id: current.id,
        value: current.value,
        fromRow: row,
        fromCol: current.fromCol,
        toRow: row,
        toCol: cols[target],
      });
      displayTiles.push({
        id: partner.id,
        value: partner.value,
        fromRow: row,
        fromCol: partner.fromCol,
        toRow: row,
        toCol: cols[target],
        hiddenAfterAnim: true,
      });

      lineGrid[target] = current.id;
      lineTiles[current.id] = { id: current.id, value: mergedValue };
      target += 1;
      index += 2;
      continue;
    }

    if (current.fromCol !== cols[target]) changed = true;
    displayTiles.push({
      id: current.id,
      value: current.value,
      fromRow: row,
      fromCol: current.fromCol,
      toRow: row,
      toCol: cols[target],
    });
    lineGrid[target] = current.id;
    lineTiles[current.id] = { id: current.id, value: current.value };
    target += 1;
    index += 1;
  }

  return { displayTiles, lineGrid, lineTiles, scoreGain, changed };
}

function processVerticalLine(
  grid: (string | null)[][],
  tiles: Record<string, TileData>,
  col: number,
  rows: number[],
): {
  displayTiles: DisplayTile[];
  lineGrid: (string | null)[];
  lineTiles: Record<string, TileData>;
  scoreGain: number;
  changed: boolean;
} {
  const line: LineTile[] = [];
  for (const row of rows) {
    const id = grid[row][col];
    if (!id) continue;
    line.push({ id, value: tiles[id].value, fromRow: row, fromCol: col });
  }

  const displayTiles: DisplayTile[] = [];
  const lineGrid: (string | null)[] = Array.from({ length: rows.length }, () => null);
  const lineTiles: Record<string, TileData> = {};
  let scoreGain = 0;
  let changed = false;
  let target = 0;
  let index = 0;

  while (index < line.length) {
    const current = line[index];
    const partner = line[index + 1];

    if (partner && current.value === partner.value) {
      const mergedValue = current.value * 2;
      scoreGain += mergedValue;
      if (current.fromRow !== rows[target] || partner.fromRow !== rows[target]) changed = true;

      displayTiles.push({
        id: current.id,
        value: current.value,
        fromRow: current.fromRow,
        fromCol: col,
        toRow: rows[target],
        toCol: col,
      });
      displayTiles.push({
        id: partner.id,
        value: partner.value,
        fromRow: partner.fromRow,
        fromCol: col,
        toRow: rows[target],
        toCol: col,
        hiddenAfterAnim: true,
      });

      lineGrid[target] = current.id;
      lineTiles[current.id] = { id: current.id, value: mergedValue };
      target += 1;
      index += 2;
      continue;
    }

    if (current.fromRow !== rows[target]) changed = true;
    displayTiles.push({
      id: current.id,
      value: current.value,
      fromRow: current.fromRow,
      fromCol: col,
      toRow: rows[target],
      toCol: col,
    });
    lineGrid[target] = current.id;
    lineTiles[current.id] = { id: current.id, value: current.value };
    target += 1;
    index += 1;
  }

  return { displayTiles, lineGrid, lineTiles, scoreGain, changed };
}

function computeMove(
  grid: (string | null)[][],
  tiles: Record<string, TileData>,
  direction: Direction,
): MoveOutcome {
  const rows = grid.length;
  const cols = grid[0].length;
  const nextGrid = createEmptyGrid(rows, cols);
  const nextTiles: Record<string, TileData> = {};
  const displayTiles: DisplayTile[] = [];
  let scoreGain = 0;
  let changed = false;

  if (direction === 'left' || direction === 'right') {
    const colOrder = direction === 'left' ? [...Array(cols).keys()] : [...Array(cols).keys()].reverse();
    for (let row = 0; row < rows; row++) {
      const result = processHorizontalLine(grid, tiles, row, colOrder);
      displayTiles.push(...result.displayTiles);
      scoreGain += result.scoreGain;
      if (result.changed) changed = true;
      for (let i = 0; i < colOrder.length; i++) {
        const id = result.lineGrid[i];
        nextGrid[row][colOrder[i]] = id;
        if (id && result.lineTiles[id]) nextTiles[id] = result.lineTiles[id];
      }
    }
  } else {
    const rowOrder = direction === 'up' ? [...Array(rows).keys()] : [...Array(rows).keys()].reverse();
    for (let col = 0; col < cols; col++) {
      const result = processVerticalLine(grid, tiles, col, rowOrder);
      displayTiles.push(...result.displayTiles);
      scoreGain += result.scoreGain;
      if (result.changed) changed = true;
      for (let i = 0; i < rowOrder.length; i++) {
        const id = result.lineGrid[i];
        nextGrid[rowOrder[i]][col] = id;
        if (id && result.lineTiles[id]) nextTiles[id] = result.lineTiles[id];
      }
    }
  }

  if (!changed) {
    return {
      changed: false,
      scoreGain: 0,
      displayTiles: buildDisplayTilesFromGrid(grid, tiles),
      nextGrid: cloneGrid(grid),
      nextTiles: { ...tiles },
    };
  }

  return { changed: true, scoreGain, displayTiles, nextGrid, nextTiles };
}

function spawnTile(draft: GameState): void {
  const empty = getEmptyCells(draft.grid);
  if (empty.length === 0) return;
  const pick = nextRandom(draft.rngSeed);
  draft.rngSeed = pick.nextSeed;
  const index = pick.value % empty.length;
  const cell = empty[index];
  const valuePick = nextRandom(draft.rngSeed);
  draft.rngSeed = valuePick.nextSeed;
  const value = valuePick.value % 10 < 9 ? 2 : 4;
  const id = `t${draft.nextTileId}`;
  draft.nextTileId += 1;
  draft.tiles[id] = { id, value };
  draft.grid[cell.row][cell.col] = id;
}

function makeInitialState(best = 0): GameState {
  const state: GameState = {
    phase: 'ready',
    rows: GRID_ROWS,
    cols: GRID_COLS,
    cell: CELL_SIZE,
    score: 0,
    best,
    grid: createEmptyGrid(GRID_ROWS, GRID_COLS),
    tiles: {},
    displayTiles: [],
    pendingGrid: null,
    pendingTiles: null,
    nextTileId: 1,
    rngSeed: 2048,
    swipeStart: null,
    anim: { phase: 'idle', elapsedMs: 0, durationMs: ANIM_DURATION_MS },
  };
  spawnTile(state);
  spawnTile(state);
  state.displayTiles = buildDisplayTilesFromGrid(state.grid, state.tiles);
  return state;
}

const { store, commitChange, storeHistory } = createGameStore<GameState>(makeInitialState(), {
  enableHistory: true,
});

function restartGame(): void {
  commitChange('重开', (draft) => {
    const best = draft.best;
    Object.assign(draft, makeInitialState(best));
  });
}

function applyMove(draft: GameState, direction: Direction): void {
  if (draft.phase === 'lost') return;
  if (draft.anim.phase !== 'idle') return;
  if (draft.phase === 'ready') draft.phase = 'playing';

  const outcome = computeMove(draft.grid, draft.tiles, direction);
  if (!outcome.changed) {
    if (!canMove(draft.grid, draft.tiles)) draft.phase = 'lost';
    return;
  }

  draft.displayTiles = outcome.displayTiles;
  draft.pendingGrid = outcome.nextGrid;
  draft.pendingTiles = outcome.nextTiles;
  draft.score += outcome.scoreGain;
  if (draft.score > draft.best) draft.best = draft.score;
  draft.anim.phase = 'sliding';
  draft.anim.elapsedMs = 0;

  const reached2048 = Object.values(outcome.nextTiles).some((tile) => tile.value >= 2048);
  if (reached2048 && draft.phase === 'playing') draft.phase = 'won';
}

function finalizeAnimation(draft: GameState): void {
  if (draft.pendingGrid && draft.pendingTiles) {
    draft.grid = draft.pendingGrid;
    draft.tiles = draft.pendingTiles;
    draft.pendingGrid = null;
    draft.pendingTiles = null;
  }
  spawnTile(draft);
  draft.displayTiles = buildDisplayTilesFromGrid(draft.grid, draft.tiles);
  draft.anim.phase = 'idle';
  draft.anim.elapsedMs = 0;
  if (!canMove(draft.grid, draft.tiles)) draft.phase = 'lost';
}

function resolveSwipe(dx: number, dy: number): Direction | null {
  if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

function displayValueForTile(tile: DisplayTile, progress: number): number {
  if (progress >= 1 && store.pendingTiles?.[tile.id]) return store.pendingTiles[tile.id].value;
  if (progress >= 1 && store.tiles[tile.id]) return store.tiles[tile.id].value;
  return tile.value;
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
    store.anim.phase === 'idle'
      ? 1
      : easeOutCubic(clamp(store.anim.elapsedMs / store.anim.durationMs, 0, 1));

  const statusText =
    store.phase === 'ready'
      ? '点击开始 · 滑动或方向键移动'
      : store.phase === 'lost'
        ? '游戏结束 - 点击重开'
        : store.phase === 'won'
          ? '达成 2048！可继续挑战'
          : '滑动屏幕或使用方向键';

  return (
    <scene
      name="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#faf8ef"
      clickable
      onClick={() => {
        commitChange('点击', (draft) => {
          if (draft.phase === 'ready') draft.phase = 'playing';
          else if (draft.phase === 'lost') {
            const best = draft.best;
            Object.assign(draft, makeInitialState(best));
          }
        });
      }}
      onKeyDown={(event) => {
        const code = event.detail?.code;
        if (code === 'ArrowLeft') {
          commitChange('按键:左', (draft) => applyMove(draft, 'left'));
        } else if (code === 'ArrowRight') {
          commitChange('按键:右', (draft) => applyMove(draft, 'right'));
        } else if (code === 'ArrowUp') {
          commitChange('按键:上', (draft) => applyMove(draft, 'up'));
        } else if (code === 'ArrowDown') {
          commitChange('按键:下', (draft) => applyMove(draft, 'down'));
        } else if (code === 'KeyR') {
          restartGame();
        }
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
          if (!from) return;
          const direction = resolveSwipe(e.x - from.x, e.y - from.y);
          if (!direction) return;
          applyMove(draft, direction);
        });
      }}
    >
      <text x={24} y={48} width={160} height={36} text="2048" textAlign="left" textColor="#776e65" textSize="42" />

      <node
        x={SCENE_WIDTH - 168}
        y={36}
        width={72}
        height={56}
        shape="roundedRect(6 6 6 6)"
        backgroundColor="#bbada0"
      />
      <text
        x={SCENE_WIDTH - 168}
        y={44}
        width={72}
        height={16}
        text="分数"
        textAlign="center"
        textColor="#eee4da"
        textSize="12"
      />
      <text
        x={SCENE_WIDTH - 168}
        y={60}
        width={72}
        height={24}
        text={`${store.score}`}
        textAlign="center"
        textColor="#ffffff"
        textSize="20"
      />

      <node
        x={SCENE_WIDTH - 88}
        y={36}
        width={72}
        height={56}
        shape="roundedRect(6 6 6 6)"
        backgroundColor="#bbada0"
      />
      <text
        x={SCENE_WIDTH - 88}
        y={44}
        width={72}
        height={16}
        text="最高"
        textAlign="center"
        textColor="#eee4da"
        textSize="12"
      />
      <text
        x={SCENE_WIDTH - 88}
        y={60}
        width={72}
        height={24}
        text={`${store.best}`}
        textAlign="center"
        textColor="#ffffff"
        textSize="20"
      />

      <text
        x={0}
        y={108}
        width={SCENE_WIDTH}
        height={22}
        text={statusText}
        textAlign="center"
        textColor="#776e65"
        textSize="16"
      />

      <group
        x={SCENE_WIDTH - 112}
        y={148}
        width={88}
        height={36}
        clickable
        onClick={restartGame}
      >
        <node
          x={0}
          y={0}
          width={88}
          height={36}
          shape="roundedRect(6 6 6 6)"
          backgroundColor="#8f7a66"
        />
        <text
          x={0}
          y={8}
          width={88}
          height={20}
          text="新游戏"
          textAlign="center"
          textColor="#f9f6f2"
          textSize="16"
        />
      </group>

      <node
        x={GRID_X}
        y={GRID_Y}
        width={GRID_WIDTH}
        height={GRID_HEIGHT}
        shape="roundedRect(10 10 10 10)"
        backgroundColor="#bbada0"
      />

      {Array.from({ length: store.rows * store.cols }, (_, i) => {
        const row = Math.floor(i / store.cols);
        const col = i % store.cols;
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

      {store.displayTiles
        .filter((tile) => !tile.hiddenAfterAnim || progress < 1)
        .map((tile) => {
          const row = tile.fromRow + (tile.toRow - tile.fromRow) * progress;
          const col = tile.fromCol + (tile.toCol - tile.fromCol) * progress;
          const displayValue = displayValueForTile(tile, progress);
          const style = tileStyle(displayValue);
          const x = GRID_X + col * store.cell + 6;
          const y = GRID_Y + row * store.cell + 6;
          const size = store.cell - 12;
          return (
            <group key={tile.id}>
              <node
                x={x}
                y={y}
                width={size}
                height={size}
                shape="roundedRect(6 6 6 6)"
                backgroundColor={style.bg}
              />
              <text
                x={x}
                y={y + (displayValue >= 1000 ? 22 : 26)}
                width={size}
                height={28}
                text={`${displayValue}`}
                textAlign="center"
                textColor={style.text}
                textSize={displayValue >= 1000 ? '22' : '28'}
              />
            </group>
          );
        })}

      {store.phase === 'lost' ? (
        <group x={GRID_X} y={GRID_Y} width={GRID_WIDTH} height={GRID_HEIGHT} clickable onClick={restartGame}>
          <node
            x={0}
            y={0}
            width={GRID_WIDTH}
            height={GRID_HEIGHT}
            shape="roundedRect(10 10 10 10)"
            backgroundColor="#00000088"
          />
          <text
            x={0}
            y={GRID_HEIGHT / 2 - 40}
            width={GRID_WIDTH}
            height={36}
            text="游戏结束"
            textAlign="center"
            textColor="#ffffff"
            textSize="32"
          />
          <node
            x={GRID_WIDTH / 2 - 60}
            y={GRID_HEIGHT / 2 + 8}
            width={120}
            height={44}
            shape="roundedRect(8 8 8 8)"
            backgroundColor="#8f7a66"
          />
          <text
            x={GRID_WIDTH / 2 - 60}
            y={GRID_HEIGHT / 2 + 18}
            width={120}
            height={24}
            text="再来一局"
            textAlign="center"
            textColor="#f9f6f2"
            textSize="18"
          />
        </group>
      ) : null}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
