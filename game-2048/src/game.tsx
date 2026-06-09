import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'up' | 'down' | 'left' | 'right';
type Phase = 'ready' | 'playing' | 'won' | 'lost';

type Tile = {
  id: number;
  value: number;
};

type Grid = (Tile | null)[][];

type DisplayTile = {
  id: number;
  value: number;
  fromCol: number;
  fromRow: number;
  toCol: number;
  toRow: number;
  isNew: boolean;
  vanishing: boolean;
  merged: boolean;
};

type GameState = {
  phase: Phase;
  grid: Grid;
  score: number;
  best: number;
  nextTileId: number;
  rng: number;
  animating: boolean;
  animProgress: number;
  displayTiles: DisplayTile[];
  swipeStart: { x: number; y: number } | null;
  wonAcknowledged: boolean;
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const GRID_SIZE = 4;
const CELL_SIZE = 68;
const CELL_GAP = 10;
const GRID_X = (SCENE_WIDTH - GRID_SIZE * CELL_SIZE - (GRID_SIZE + 1) * CELL_GAP) / 2;
const GRID_Y = 200;
const ANIM_DURATION = 0.14;

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

function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => null));
}

function nextRandom(seed: number): { value: number; seed: number } {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return { value: next / 0xffffffff, seed: next };
}

function cellX(col: number): number {
  return GRID_X + CELL_GAP + col * (CELL_SIZE + CELL_GAP);
}

function cellY(row: number): number {
  return GRID_Y + CELL_GAP + row * (CELL_SIZE + CELL_GAP);
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function getLinePositions(dir: Direction, index: number): { row: number; col: number }[] {
  const positions: { row: number; col: number }[] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    if (dir === 'left' || dir === 'right') {
      positions.push({ row: index, col: dir === 'left' ? i : GRID_SIZE - 1 - i });
    } else {
      positions.push({ row: dir === 'up' ? i : GRID_SIZE - 1 - i, col: index });
    }
  }
  return positions;
}

type MoveResult = {
  grid: Grid;
  moved: boolean;
  scoreGain: number;
  displayTiles: DisplayTile[];
  reached2048: boolean;
};

type LineEntry = { tile: Tile; fromRow: number; fromCol: number };

function processLine(entries: LineEntry[], positions: { row: number; col: number }[]): {
  tiles: (Tile | null)[];
  animations: DisplayTile[];
  scoreGain: number;
  reached2048: boolean;
  moved: boolean;
} {
  const animations: DisplayTile[] = [];
  let scoreGain = 0;
  let reached2048 = false;
  let moved = false;
  const output: (Tile | null)[] = [];
  let i = 0;

  while (i < entries.length) {
    const current = entries[i];
    const next = i + 1 < entries.length ? entries[i + 1] : null;

    if (next && next.tile.value === current.tile.value) {
      const mergedValue = current.tile.value * 2;
      const targetPos = positions[output.length];
      const mergedTile: Tile = { id: current.tile.id, value: mergedValue };
      output.push(mergedTile);

      animations.push({
        id: current.tile.id,
        value: mergedValue,
        fromCol: current.fromCol,
        fromRow: current.fromRow,
        toCol: targetPos.col,
        toRow: targetPos.row,
        isNew: false,
        vanishing: false,
        merged: true,
      });
      animations.push({
        id: next.tile.id,
        value: next.tile.value,
        fromCol: next.fromCol,
        fromRow: next.fromRow,
        toCol: targetPos.col,
        toRow: targetPos.row,
        isNew: false,
        vanishing: true,
        merged: false,
      });

      if (current.fromRow !== targetPos.row || current.fromCol !== targetPos.col) moved = true;
      if (next.fromRow !== targetPos.row || next.fromCol !== targetPos.col) moved = true;
      scoreGain += mergedValue;
      if (mergedValue === 2048) reached2048 = true;
      i += 2;
    } else {
      const targetPos = positions[output.length];
      output.push({ ...current.tile });

      if (current.fromRow !== targetPos.row || current.fromCol !== targetPos.col) {
        moved = true;
        animations.push({
          id: current.tile.id,
          value: current.tile.value,
          fromCol: current.fromCol,
          fromRow: current.fromRow,
          toCol: targetPos.col,
          toRow: targetPos.row,
          isNew: false,
          vanishing: false,
          merged: false,
        });
      }
      i++;
    }
  }

  while (output.length < GRID_SIZE) output.push(null);
  return { tiles: output, animations, scoreGain, reached2048, moved };
}

function moveGrid(grid: Grid, dir: Direction): MoveResult {
  const newGrid = createEmptyGrid();
  const displayTiles: DisplayTile[] = [];
  let moved = false;
  let scoreGain = 0;
  let reached2048 = false;

  for (let lineIndex = 0; lineIndex < GRID_SIZE; lineIndex++) {
    const positions = getLinePositions(dir, lineIndex);
    const entries: LineEntry[] = [];
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const tile = grid[pos.row][pos.col];
      if (tile) entries.push({ tile, fromRow: pos.row, fromCol: pos.col });
    }

    const lineResult = processLine(entries, positions);
    if (lineResult.moved) moved = true;
    scoreGain += lineResult.scoreGain;
    if (lineResult.reached2048) reached2048 = true;
    displayTiles.push(...lineResult.animations);

    for (let i = 0; i < GRID_SIZE; i++) {
      const pos = positions[i];
      newGrid[pos.row][pos.col] = lineResult.tiles[i];
    }
  }

  return { grid: newGrid, moved, scoreGain, displayTiles, reached2048 };
}

function addRandomTile(draft: GameState): void {
  const empty: { row: number; col: number }[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!draft.grid[r][c]) empty.push({ row: r, col: c });
    }
  }
  if (empty.length === 0) return;

  const rand = nextRandom(draft.rng);
  draft.rng = rand.seed;
  const pick = empty[Math.floor(rand.value * empty.length)];
  const valueRand = nextRandom(draft.rng);
  draft.rng = valueRand.seed;
  const value = valueRand.value < 0.9 ? 2 : 4;

  const tile: Tile = { id: draft.nextTileId++, value };
  draft.grid[pick.row][pick.col] = tile;
  draft.displayTiles.push({
    id: tile.id,
    value: tile.value,
    fromCol: pick.col,
    fromRow: pick.row,
    toCol: pick.col,
    toRow: pick.row,
    isNew: true,
    vanishing: false,
    merged: false,
  });
}

function canMove(grid: Grid): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const tile = grid[r][c];
      if (!tile) return true;
      const neighbors = [
        [r, c + 1],
        [r + 1, c],
      ];
      for (const [nr, nc] of neighbors) {
        if (nr < GRID_SIZE && nc < GRID_SIZE) {
          const other = grid[nr][nc];
          if (!other || other.value === tile.value) return true;
        }
      }
    }
  }
  return false;
}

function makeInitialState(): GameState {
  const state: GameState = {
    phase: 'ready',
    grid: createEmptyGrid(),
    score: 0,
    best: 0,
    nextTileId: 1,
    rng: 0x2048,
    animating: false,
    animProgress: 0,
    displayTiles: [],
    swipeStart: null,
    wonAcknowledged: false,
  };
  addRandomTile(state);
  addRandomTile(state);
  state.displayTiles = state.displayTiles.map((t) => ({ ...t, isNew: false }));
  return state;
}

function finalizeAnimation(draft: GameState): void {
  draft.animating = false;
  draft.animProgress = 0;
  draft.displayTiles = draft.displayTiles
    .filter((t) => !t.vanishing)
    .map((t) => ({
      ...t,
      fromCol: t.toCol,
      fromRow: t.toRow,
      isNew: false,
      vanishing: false,
      merged: false,
    }));

  if (draft.phase === 'playing' || draft.phase === 'won') {
    if (!canMove(draft.grid)) {
      draft.phase = 'lost';
    }
  }
}

function buildStaticTiles(grid: Grid, excludeIds: Set<number>): DisplayTile[] {
  const tiles: DisplayTile[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const tile = grid[r][c];
      if (tile && !excludeIds.has(tile.id)) {
        tiles.push({
          id: tile.id,
          value: tile.value,
          fromCol: c,
          fromRow: r,
          toCol: c,
          toRow: r,
          isNew: false,
          vanishing: false,
          merged: false,
        });
      }
    }
  }
  return tiles;
}

function startMove(draft: GameState, dir: Direction): void {
  if (draft.animating || (draft.phase !== 'playing' && draft.phase !== 'won')) return;

  const result = moveGrid(draft.grid, dir);
  if (!result.moved) return;

  draft.grid = result.grid;
  draft.score += result.scoreGain;
  if (draft.score > draft.best) draft.best = draft.score;

  const animatedIds = new Set(result.displayTiles.filter((t) => !t.vanishing).map((t) => t.id));
  draft.displayTiles = [...result.displayTiles, ...buildStaticTiles(draft.grid, animatedIds)];
  draft.animating = true;
  draft.animProgress = 0;

  if (result.reached2048 && !draft.wonAcknowledged) {
    draft.phase = 'won';
  }
}

function restartGame(draft: GameState): void {
  Object.assign(draft, makeInitialState());
  draft.phase = 'playing';
}

const { store, commitChange, storeHistory } = createGameStore<GameState>(makeInitialState(), {
  enableHistory: true,
});

function handleDirection(dir: Direction): void {
  commitChange(`move ${dir}`, (draft) => {
    if (draft.phase === 'ready') {
      draft.phase = 'playing';
    }
    if (draft.phase === 'lost') {
      restartGame(draft);
      return;
    }
    startMove(draft, dir);
  });
}

function handleKey(code: string): void {
  const map: Record<string, Direction> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    KeyW: 'up',
    KeyS: 'down',
    KeyA: 'left',
    KeyD: 'right',
  };
  const dir = map[code];
  if (dir) handleDirection(dir);
}

function TileNode(props: { tile: DisplayTile; progress: number; animating: boolean }) {
  const { tile, progress, animating } = props;
  const t = animating ? easeOutCubic(progress) : 1;
  const col = tile.fromCol + (tile.toCol - tile.fromCol) * t;
  const row = tile.fromRow + (tile.toRow - tile.fromRow) * t;
  const x = cellX(col);
  const y = cellY(row);
  const colors = tileColor(tile.value);

  let scale = 1;
  let alpha = 1;
  if (animating) {
    if (tile.isNew) {
      scale = 0.35 + 0.65 * easeOutCubic(progress);
    } else if (tile.vanishing) {
      alpha = 1 - easeOutCubic(progress);
      scale = 1 - 0.2 * easeOutCubic(progress);
    } else if (tile.merged && progress < 1) {
      const pop = progress < 0.5 ? progress * 2 : 2 - progress * 2;
      scale = 1 + 0.12 * pop;
    }
  }

  const size = CELL_SIZE * scale;
  const offset = (CELL_SIZE - size) / 2;
  const fontSize = tile.value >= 1024 ? 22 : tile.value >= 128 ? 26 : 30;

  return (
    <group x={x + offset} y={y + offset} width={size} height={size} alpha={alpha} zIndex={tile.vanishing ? 1 : 2}>
      <node
        x={0}
        y={0}
        width={size}
        height={size}
        shape="roundedRect(6 6 6 6)"
        backgroundColor={colors.bg}
      />
      <text
        x={0}
        y={(size - fontSize) / 2 - 2}
        width={size}
        height={fontSize + 4}
        text={String(tile.value)}
        textAlign="center"
        textColor={colors.fg}
        textSize={String(fontSize)}
      />
    </group>
  );
}

function ScoreBox(props: { label: string; value: number; x: number }) {
  return (
    <group x={props.x} y={100} width={64} height={56}>
      <node
        x={0}
        y={0}
        width={64}
        height={56}
        shape="roundedRect(6 6 6 6)"
        backgroundColor="#bbada0"
      />
      <text
        x={0}
        y={8}
        width={64}
        height={16}
        text={props.label}
        textAlign="center"
        textColor="#eee4da"
        textSize="12"
      />
      <text
        x={0}
        y={28}
        width={64}
        height={24}
        text={String(props.value)}
        textAlign="center"
        textColor="#ffffff"
        textSize="20"
      />
    </group>
  );
}

function Game() {
  useFrame((frame) => {
    const dt = Math.min(frame.deltaSeconds, 0.05);
    if (!store.animating) return;

    commitChange('anim tick', (draft) => {
      if (!draft.animating) return;

      const prevProgress = draft.animProgress;
      draft.animProgress = Math.min(1, draft.animProgress + dt / ANIM_DURATION);

      if (prevProgress < 1 && draft.animProgress >= 1) {
        addRandomTile(draft);
        finalizeAnimation(draft);
      }
    });
  });

  return (
    <scene
      id="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#faf8ef"
      clickable
      onClick={() => {
        commitChange('start', (draft) => {
          if (draft.phase === 'ready') draft.phase = 'playing';
          if (draft.phase === 'lost') restartGame(draft);
        });
      }}
      onKeyDown={(e) => {
        if (e.detail?.code) handleKey(e.detail.code);
      }}
      onPointerDown={(e) => {
        commitChange('swipe:start', (draft) => {
          draft.swipeStart = { x: e.x, y: e.y };
        });
      }}
      onPointerUp={(e) => {
        commitChange('swipe:end', (draft) => {
          const from = draft.swipeStart;
          draft.swipeStart = null;
          if (!from) return;

          const dx = e.x - from.x;
          const dy = e.y - from.y;
          const threshold = 20;
          if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

          const dir: Direction =
            Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';

          if (draft.phase === 'ready') draft.phase = 'playing';
          if (draft.phase === 'lost') {
            restartGame(draft);
            return;
          }
          startMove(draft, dir);
        });
      }}
    >
      <text
        x={20}
        y={36}
        width={200}
        height={48}
        text="2048"
        textColor="#776e65"
        textSize="48"
      />
      <ScoreBox label="分数" value={store.score} x={188} />
      <ScoreBox label="最高" value={store.best} x={296} />

      <node
        x={GRID_X}
        y={GRID_Y}
        width={GRID_SIZE * CELL_SIZE + (GRID_SIZE + 1) * CELL_GAP}
        height={GRID_SIZE * CELL_SIZE + (GRID_SIZE + 1) * CELL_GAP}
        shape="roundedRect(8 8 8 8)"
        backgroundColor="#bbada0"
        zIndex={0}
      />

      {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
        const col = i % GRID_SIZE;
        const row = Math.floor(i / GRID_SIZE);
        return (
          <node
            x={cellX(col)}
            y={cellY(row)}
            width={CELL_SIZE}
            height={CELL_SIZE}
            shape="roundedRect(4 4 4 4)"
            backgroundColor="#cdc1b4"
            zIndex={0}
          />
        );
      })}

      {store.displayTiles.map((tile) => (
        <TileNode
          tile={tile}
          progress={store.animProgress}
          animating={store.animating || tile.isNew}
        />
      ))}

      {store.phase === 'ready' && (
        <group x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} zIndex={10}>
          <node x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} backgroundColor="#faf8ef" alpha={0.72} />
          <text
            x={0}
            y={280}
            width={SCENE_WIDTH}
            height={32}
            text="点击或滑动开始"
            textAlign="center"
            textColor="#776e65"
            textSize="24"
          />
          <text
            x={0}
            y={320}
            width={SCENE_WIDTH}
            height={24}
            text="方向键 / WASD / 滑动手势"
            textAlign="center"
            textColor="#8f7a66"
            textSize="16"
          />
        </group>
      )}

      {store.phase === 'won' && !store.animating && (
        <group x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} zIndex={10} clickable>
          <node x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} backgroundColor="#edc22e" alpha={0.5} />
          <text
            x={0}
            y={300}
            width={SCENE_WIDTH}
            height={36}
            text="你赢了！"
            textAlign="center"
            textColor="#ffffff"
            textSize="36"
          />
          <group
            x={80}
            y={360}
            width={200}
            height={48}
            clickable
            onClick={() => {
              commitChange('continue', (draft) => {
                draft.wonAcknowledged = true;
                draft.phase = 'playing';
              });
            }}
          >
            <node x={0} y={0} width={200} height={48} shape="roundedRect(8 8 8 8)" backgroundColor="#8f7a66" />
            <text x={0} y={12} width={200} height={24} text="继续游戏" textAlign="center" textColor="#f9f6f2" textSize="20" />
          </group>
        </group>
      )}

      {store.phase === 'lost' && !store.animating && (
        <group x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} zIndex={10}>
          <node x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} backgroundColor="#ffffff" alpha={0.6} />
          <text
            x={0}
            y={300}
            width={SCENE_WIDTH}
            height={36}
            text="游戏结束"
            textAlign="center"
            textColor="#776e65"
            textSize="36"
          />
          <text
            x={0}
            y={360}
            width={SCENE_WIDTH}
            height={24}
            text="点击任意处重新开始"
            textAlign="center"
            textColor="#8f7a66"
            textSize="18"
          />
        </group>
      )}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
