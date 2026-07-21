import { For, Show } from 'solid-js';
import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'up' | 'down' | 'left' | 'right';
type Phase = 'ready' | 'playing' | 'won' | 'lost';
type AnimPhase = 'idle' | 'slide' | 'spawn';

type Tile = {
  id: string;
  value: number;
};

type Grid = (Tile | null)[][];

type DisplayTile = {
  id: string;
  value: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  isNew: boolean;
  vanishing: boolean;
  merged: boolean;
};

type GameState = {
  phase: Phase;
  score: number;
  best: number;
  nextTileId: number;
  rng: number;
  grid: Grid;
  displayTiles: DisplayTile[];
  anim: {
    phase: AnimPhase;
    elapsedMs: number;
    durationMs: number;
  };
  swipeStart: { x: number; y: number } | null;
  wonAcknowledged: boolean;
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const GRID_SIZE = 4;
const CELL_SIZE = 68;
const CELL_GAP = 10;
const BOARD_SIZE = GRID_SIZE * CELL_SIZE + (GRID_SIZE + 1) * CELL_GAP;
const GRID_X = (SCENE_WIDTH - BOARD_SIZE) / 2;
const GRID_Y = 196;
const SLIDE_MS = 140;
const SPAWN_MS = 110;

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

const CELL_SLOTS = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({
  id: `cell-${i}`,
  row: Math.floor(i / GRID_SIZE),
  col: i % GRID_SIZE,
}));

function tileColor(value: number): { bg: string; fg: string } {
  return TILE_COLORS[value] ?? { bg: '#3c3a32', fg: '#f9f6f2' };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function easeOutCubic(t: number): number {
  const x = clamp01(t) - 1;
  return x * x * x + 1;
}

function cellX(col: number): number {
  return GRID_X + CELL_GAP + col * (CELL_SIZE + CELL_GAP);
}

function cellY(row: number): number {
  return GRID_Y + CELL_GAP + row * (CELL_SIZE + CELL_GAP);
}

function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => null));
}

function nextRandom(seed: number): { value: number; seed: number } {
  const next = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return { value: next / 0x100000000, seed: next };
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

type LineEntry = { tile: Tile; fromRow: number; fromCol: number };

type LineResult = {
  tiles: (Tile | null)[];
  animations: DisplayTile[];
  scoreGain: number;
  reached2048: boolean;
  moved: boolean;
};

function processLine(entries: LineEntry[], positions: { row: number; col: number }[]): LineResult {
  const animations: DisplayTile[] = [];
  const output: (Tile | null)[] = [];
  let scoreGain = 0;
  let reached2048 = false;
  let moved = false;
  let i = 0;

  while (i < entries.length) {
    const current = entries[i];
    const next = i + 1 < entries.length ? entries[i + 1] : null;

    if (next && next.tile.value === current.tile.value) {
      const mergedValue = current.tile.value * 2;
      const target = positions[output.length];
      output.push({ id: current.tile.id, value: mergedValue });

      animations.push({
        id: current.tile.id,
        value: mergedValue,
        fromRow: current.fromRow,
        fromCol: current.fromCol,
        toRow: target.row,
        toCol: target.col,
        isNew: false,
        vanishing: false,
        merged: true,
      });
      animations.push({
        id: next.tile.id,
        value: next.tile.value,
        fromRow: next.fromRow,
        fromCol: next.fromCol,
        toRow: target.row,
        toCol: target.col,
        isNew: false,
        vanishing: true,
        merged: false,
      });

      if (current.fromRow !== target.row || current.fromCol !== target.col) moved = true;
      if (next.fromRow !== target.row || next.fromCol !== target.col) moved = true;
      // 同格合并也算移动（发生了合并）
      moved = true;
      scoreGain += mergedValue;
      if (mergedValue === 2048) reached2048 = true;
      i += 2;
    } else {
      const target = positions[output.length];
      output.push({ id: current.tile.id, value: current.tile.value });

      if (current.fromRow !== target.row || current.fromCol !== target.col) {
        moved = true;
        animations.push({
          id: current.tile.id,
          value: current.tile.value,
          fromRow: current.fromRow,
          fromCol: current.fromCol,
          toRow: target.row,
          toCol: target.col,
          isNew: false,
          vanishing: false,
          merged: false,
        });
      } else {
        animations.push({
          id: current.tile.id,
          value: current.tile.value,
          fromRow: current.fromRow,
          fromCol: current.fromCol,
          toRow: target.row,
          toCol: target.col,
          isNew: false,
          vanishing: false,
          merged: false,
        });
      }
      i += 1;
    }
  }

  while (output.length < GRID_SIZE) output.push(null);
  return { tiles: output, animations, scoreGain, reached2048, moved };
}

type MoveResult = {
  grid: Grid;
  moved: boolean;
  scoreGain: number;
  displayTiles: DisplayTile[];
  reached2048: boolean;
};

function moveGrid(grid: Grid, dir: Direction): MoveResult {
  const newGrid = createEmptyGrid();
  const displayTiles: DisplayTile[] = [];
  let moved = false;
  let scoreGain = 0;
  let reached2048 = false;

  for (let lineIndex = 0; lineIndex < GRID_SIZE; lineIndex++) {
    const positions = getLinePositions(dir, lineIndex);
    const entries: LineEntry[] = [];
    for (const pos of positions) {
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

function canMove(grid: Grid): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const tile = grid[r][c];
      if (!tile) return true;
      if (c + 1 < GRID_SIZE) {
        const right = grid[r][c + 1];
        if (!right || right.value === tile.value) return true;
      }
      if (r + 1 < GRID_SIZE) {
        const down = grid[r + 1][c];
        if (!down || down.value === tile.value) return true;
      }
    }
  }
  return false;
}

function buildDisplayFromGrid(grid: Grid): DisplayTile[] {
  const tiles: DisplayTile[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const tile = grid[r][c];
      if (!tile) continue;
      tiles.push({
        id: tile.id,
        value: tile.value,
        fromRow: r,
        fromCol: c,
        toRow: r,
        toCol: c,
        isNew: false,
        vanishing: false,
        merged: false,
      });
    }
  }
  return tiles;
}

function addRandomTile(draft: GameState, markNew: boolean): void {
  const empty: { row: number; col: number }[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!draft.grid[r][c]) empty.push({ row: r, col: c });
    }
  }
  if (empty.length === 0) return;

  const pickRand = nextRandom(draft.rng);
  draft.rng = pickRand.seed;
  const pick = empty[Math.floor(pickRand.value * empty.length)];

  const valueRand = nextRandom(draft.rng);
  draft.rng = valueRand.seed;
  const value = valueRand.value < 0.9 ? 2 : 4;

  const tile: Tile = { id: `t${draft.nextTileId++}`, value };
  draft.grid[pick.row][pick.col] = tile;
  draft.displayTiles.push({
    id: tile.id,
    value: tile.value,
    fromRow: pick.row,
    fromCol: pick.col,
    toRow: pick.row,
    toCol: pick.col,
    isNew: markNew,
    vanishing: false,
    merged: false,
  });
}

function makeInitialState(): GameState {
  const state: GameState = {
    phase: 'ready',
    score: 0,
    best: 0,
    nextTileId: 1,
    rng: 0x2048a11e,
    grid: createEmptyGrid(),
    displayTiles: [],
    anim: {
      phase: 'idle',
      elapsedMs: 0,
      durationMs: SLIDE_MS,
    },
    swipeStart: null,
    wonAcknowledged: false,
  };
  addRandomTile(state, false);
  addRandomTile(state, false);
  state.displayTiles = buildDisplayFromGrid(state.grid);
  return state;
}

function startMove(draft: GameState, dir: Direction): void {
  if (draft.anim.phase !== 'idle') return;
  if (draft.phase !== 'playing' && draft.phase !== 'won') return;

  const result = moveGrid(draft.grid, dir);
  if (!result.moved) return;

  draft.grid = result.grid;
  draft.score += result.scoreGain;
  if (draft.score > draft.best) draft.best = draft.score;
  draft.displayTiles = result.displayTiles;
  draft.anim.phase = 'slide';
  draft.anim.elapsedMs = 0;
  draft.anim.durationMs = SLIDE_MS;

  if (result.reached2048 && !draft.wonAcknowledged) {
    draft.phase = 'won';
  }
}

function finalizeToIdle(draft: GameState): void {
  draft.displayTiles = buildDisplayFromGrid(draft.grid);
  draft.anim.phase = 'idle';
  draft.anim.elapsedMs = 0;
  draft.anim.durationMs = SLIDE_MS;

  if ((draft.phase === 'playing' || draft.phase === 'won') && !canMove(draft.grid)) {
    draft.phase = 'lost';
  }
}

function completeSlide(draft: GameState): void {
  // 去掉合并中被吞掉的方块，保留落点方块，再生成新块并进入 spawn
  draft.displayTiles = draft.displayTiles
    .filter((tile) => !tile.vanishing)
    .map((tile) => ({
      ...tile,
      fromRow: tile.toRow,
      fromCol: tile.toCol,
      isNew: false,
      vanishing: false,
      merged: false,
    }));

  addRandomTile(draft, true);
  draft.anim.phase = 'spawn';
  draft.anim.elapsedMs = 0;
  draft.anim.durationMs = SPAWN_MS;
}

function restartGame(draft: GameState): void {
  const best = draft.best;
  Object.assign(draft, makeInitialState());
  draft.best = best;
  draft.phase = 'playing';
}

const { store, commitChange, bindStore } = createGameStore<GameState>(makeInitialState());

function handleDirection(dir: Direction): void {
  commitChange(`移动:${dir}`, (draft) => {
    if (draft.phase === 'ready') draft.phase = 'playing';
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

function ScoreBox(props: { label: string; value: number; x: number; stableKey: string }) {
  return (
    <group key={props.stableKey} x={props.x} y={92} width={72} height={58}>
      <node x={0} y={0} width={72} height={58} shape="roundedRect(8 8 8 8)" backgroundColor="#bbada0" />
      <text x={0} y={8} width={72} height={16} text={props.label} textAlign="center" textColor="#eee4da" textSize="12" />
      <text
        x={0}
        y={28}
        width={72}
        height={24}
        text={String(props.value)}
        textAlign="center"
        textColor="#ffffff"
        textSize="20"
      />
    </group>
  );
}

function TileView(props: { tile: DisplayTile }) {
  const anim = store.anim;
  const progress =
    anim.phase === 'idle' ? 1 : clamp01(anim.elapsedMs / Math.max(1, anim.durationMs));
  const eased = easeOutCubic(progress);

  let row = props.tile.fromRow + (props.tile.toRow - props.tile.fromRow) * eased;
  let col = props.tile.fromCol + (props.tile.toCol - props.tile.fromCol) * eased;
  let scale = 1;
  let alpha = 1;

  if (anim.phase === 'slide') {
    if (props.tile.vanishing) {
      alpha = 1 - eased * 0.85;
      scale = 1 - 0.18 * eased;
    } else if (props.tile.merged) {
      const pop = progress < 0.55 ? progress / 0.55 : (1 - progress) / 0.45;
      scale = 1 + 0.14 * clamp01(pop);
    }
  } else if (anim.phase === 'spawn' && props.tile.isNew) {
    row = props.tile.toRow;
    col = props.tile.toCol;
    scale = 0.28 + 0.72 * eased;
  } else {
    row = props.tile.toRow;
    col = props.tile.toCol;
  }

  const size = CELL_SIZE * scale;
  const offset = (CELL_SIZE - size) / 2;
  const x = cellX(col) + offset;
  const y = cellY(row) + offset;
  const colors = tileColor(props.tile.value);
  const fontSize = props.tile.value >= 1024 ? 22 : props.tile.value >= 128 ? 26 : 30;

  return (
    <group
      key={props.tile.id}
      x={x}
      y={y}
      width={size}
      height={size}
      alpha={alpha}
      zIndex={props.tile.vanishing ? 1 : props.tile.isNew ? 3 : 2}
    >
      <node x={0} y={0} width={size} height={size} shape="roundedRect(6 6 6 6)" backgroundColor={colors.bg} />
      <text
        x={0}
        y={(size - fontSize) / 2 - 2}
        width={size}
        height={fontSize + 4}
        text={String(props.tile.value)}
        textAlign="center"
        textColor={colors.fg}
        textSize={String(fontSize)}
      />
    </group>
  );
}

function Game() {
  useFrame((frame) => {
    const dtMs = Math.min(frame.deltaSeconds, 0.05) * 1000;
    commitChange('动画帧推进', (draft) => {
      if (draft.anim.phase === 'idle') return;
      draft.anim.elapsedMs += dtMs;
      if (draft.anim.elapsedMs < draft.anim.durationMs) return;

      if (draft.anim.phase === 'slide') {
        completeSlide(draft);
        return;
      }

      if (draft.anim.phase === 'spawn') {
        finalizeToIdle(draft);
      }
    });
  });

  const statusText =
    store.phase === 'ready'
      ? '点击或滑动开始'
      : store.phase === 'won'
        ? '达成 2048！可继续挑战'
        : store.phase === 'lost'
          ? '没有可移动步数了'
          : '合并相同数字，冲向 2048';

  return (
    <scene
      name="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#faf8ef"
      clickable
      onClick={() => {
        commitChange('点击场景', (draft) => {
          if (draft.phase === 'ready') draft.phase = 'playing';
          else if (draft.phase === 'lost') restartGame(draft);
        });
      }}
      onKeyDown={(event) => {
        if (event.detail?.code) handleKey(event.detail.code);
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

          const dx = event.x - from.x;
          const dy = event.y - from.y;
          if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;

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
      <text x={24} y={28} width={180} height={52} text="2048" textColor="#776e65" textSize="48" />
      <ScoreBox label="分数" value={store.score} x={188} stableKey="score" />
      <ScoreBox label="最高" value={store.best} x={268} stableKey="best" />

      <text
        x={24}
        y={156}
        width={312}
        height={24}
        text={statusText}
        textColor="#8f7a66"
        textSize="15"
      />

      <group
        x={24}
        y={520}
        width={120}
        height={40}
        clickable
        onClick={() => {
          commitChange('新游戏', (draft) => {
            restartGame(draft);
          });
        }}
      >
        <node x={0} y={0} width={120} height={40} shape="roundedRect(8 8 8 8)" backgroundColor="#8f7a66" />
        <text x={0} y={10} width={120} height={22} text="新游戏" textAlign="center" textColor="#f9f6f2" textSize="16" />
      </group>

      <Show when={store.phase === 'won' && store.anim.phase === 'idle' && !store.wonAcknowledged}>
        <group
          x={156}
          y={520}
          width={180}
          height={40}
          clickable
          onClick={() => {
            commitChange('继续挑战', (draft) => {
              draft.wonAcknowledged = true;
              draft.phase = 'playing';
            });
          }}
        >
          <node x={0} y={0} width={180} height={40} shape="roundedRect(8 8 8 8)" backgroundColor="#edc22e" />
          <text
            x={0}
            y={10}
            width={180}
            height={22}
            text="继续挑战"
            textAlign="center"
            textColor="#776e65"
            textSize="16"
          />
        </group>
      </Show>

      <node
        x={GRID_X}
        y={GRID_Y}
        width={BOARD_SIZE}
        height={BOARD_SIZE}
        shape="roundedRect(10 10 10 10)"
        backgroundColor="#bbada0"
        zIndex={0}
      />

      <For each={CELL_SLOTS}>
        {(slot) => (
          <node
            key={slot.id}
            x={cellX(slot.col)}
            y={cellY(slot.row)}
            width={CELL_SIZE}
            height={CELL_SIZE}
            shape="roundedRect(6 6 6 6)"
            backgroundColor="#cdc1b4"
            zIndex={0}
          />
        )}
      </For>

      <For each={store.displayTiles}>{(tile) => <TileView tile={tile} />}</For>

      <Show when={store.phase === 'ready'}>
        <group x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} zIndex={20}>
          <node x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} backgroundColor="#faf8ef" alpha={0.7} />
          <text
            x={0}
            y={286}
            width={SCENE_WIDTH}
            height={32}
            text="点击或滑动开始"
            textAlign="center"
            textColor="#776e65"
            textSize="24"
          />
          <text
            x={0}
            y={328}
            width={SCENE_WIDTH}
            height={24}
            text="方向键 / WASD / 滑动手势"
            textAlign="center"
            textColor="#8f7a66"
            textSize="15"
          />
        </group>
      </Show>

      <Show when={store.phase === 'lost' && store.anim.phase === 'idle'}>
        <group x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} zIndex={20}>
          <node x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} backgroundColor="#ffffff" alpha={0.55} />
          <text
            x={0}
            y={286}
            width={SCENE_WIDTH}
            height={36}
            text="游戏结束"
            textAlign="center"
            textColor="#776e65"
            textSize="34"
          />
          <text
            x={0}
            y={336}
            width={SCENE_WIDTH}
            height={24}
            text="点击任意处重新开始"
            textAlign="center"
            textColor="#8f7a66"
            textSize="16"
          />
        </group>
      </Show>
    </scene>
  );
}

renderGame(() => <Game />, { bindStore });
