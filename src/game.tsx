import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'up' | 'down' | 'left' | 'right';
type Phase = 'ready' | 'playing' | 'animating' | 'won' | 'lost';

type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
  fromRow: number | null;
  fromCol: number | null;
  removeAfterAnim: boolean;
  spawnAnim: boolean;
  mergedThisTurn: boolean;
};

type GameState = {
  phase: Phase;
  tiles: Tile[];
  score: number;
  best: number;
  nextId: number;
  rngSeed: number;
  animMs: number;
  swipeStart: { x: number; y: number } | null;
};

const GRID = 4;
const CELL = 68;
const GAP = 10;
const PAD = 12;
const BOARD_INNER = GRID * CELL + (GRID - 1) * GAP;
const BOARD_SIZE = BOARD_INNER + PAD * 2;
const SCENE_W = 400;
const SCENE_H = 520;
const GRID_X = (SCENE_W - BOARD_SIZE) / 2 + PAD;
const GRID_Y = 118;
const ANIM_MS = 130;
const WIN_VALUE = 2048;

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

function tileStyle(value: number): { bg: string; fg: string } {
  return TILE_COLORS[value] ?? { bg: '#3c3a32', fg: '#f9f6f2' };
}

function nextRandom(seed: number): { value: number; seed: number } {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return { value: next / 0xffffffff, seed: next };
}

function easeOutCubic(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - (1 - clamped) ** 3;
}

function makeTile(
  draft: GameState,
  row: number,
  col: number,
  value: 2 | 4,
  spawnAnim = false,
): Tile {
  return {
    id: draft.nextId++,
    value,
    row,
    col,
    fromRow: null,
    fromCol: null,
    removeAfterAnim: false,
    spawnAnim,
    mergedThisTurn: false,
  };
}

function emptyCells(draft: GameState): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  for (let row = 0; row < GRID; row += 1) {
    for (let col = 0; col < GRID; col += 1) {
      const occupied = draft.tiles.some(
        (tile) => !tile.removeAfterAnim && tile.row === row && tile.col === col,
      );
      if (!occupied) cells.push({ row, col });
    }
  }
  return cells;
}

function spawnRandomTile(draft: GameState): void {
  const cells = emptyCells(draft);
  if (cells.length === 0) return;

  const pick = nextRandom(draft.rngSeed);
  draft.rngSeed = pick.seed;
  const cell = cells[Math.floor(pick.value * cells.length)]!;

  const valueRoll = nextRandom(draft.rngSeed);
  draft.rngSeed = valueRoll.seed;
  const value: 2 | 4 = valueRoll.value < 0.9 ? 2 : 4;

  draft.tiles.push(makeTile(draft, cell.row, cell.col, value, true));
}

function activeTiles(draft: GameState): Tile[] {
  return draft.tiles.filter((tile) => !tile.removeAfterAnim);
}

function canMove(draft: GameState): boolean {
  if (emptyCells(draft).length > 0) return true;

  const tiles = activeTiles(draft);
  for (const tile of tiles) {
    const right = tiles.find((other) => other.row === tile.row && other.col === tile.col + 1);
    const down = tiles.find((other) => other.col === tile.col && other.row === tile.row + 1);
    if ((right && right.value === tile.value) || (down && down.value === tile.value)) return true;
  }
  return false;
}

function resetBoard(draft: GameState): void {
  draft.phase = 'playing';
  draft.tiles = [];
  draft.score = 0;
  draft.nextId = 1;
  draft.rngSeed = 0x2048;
  draft.animMs = 0;
  draft.swipeStart = null;

  spawnRandomTile(draft);
  spawnRandomTile(draft);
  for (const tile of draft.tiles) tile.spawnAnim = false;
}

function beginMove(draft: GameState, direction: Direction): boolean {
  if (draft.phase === 'animating' || draft.phase === 'lost') return false;
  if (draft.phase === 'ready') draft.phase = 'playing';

  const moving = activeTiles(draft);
  for (const tile of moving) {
    tile.fromRow = tile.row;
    tile.fromCol = tile.col;
    tile.mergedThisTurn = false;
    tile.spawnAnim = false;
  }

  let moved = false;
  let scoreGain = 0;

  if (direction === 'left' || direction === 'right') {
    const toLeft = direction === 'left';
    for (let row = 0; row < GRID; row += 1) {
      const line = moving
        .filter((tile) => tile.row === row)
        .sort((a, b) => (toLeft ? a.col - b.col : b.col - a.col));
      const result = compressLine(
        line,
        (tile) => tile.col,
        (tile, col) => {
          tile.col = col;
        },
        toLeft ? 0 : GRID - 1,
        toLeft ? 1 : -1,
      );
      moved = moved || result.moved;
      scoreGain += result.score;
    }
  } else {
    const toUp = direction === 'up';
    for (let col = 0; col < GRID; col += 1) {
      const line = moving
        .filter((tile) => tile.col === col)
        .sort((a, b) => (toUp ? a.row - b.row : b.row - a.row));
      const result = compressLine(
        line,
        (tile) => tile.row,
        (tile, row) => {
          tile.row = row;
        },
        toUp ? 0 : GRID - 1,
        toUp ? 1 : -1,
      );
      moved = moved || result.moved;
      scoreGain += result.score;
    }
  }

  if (!moved) return false;

  draft.score += scoreGain;
  if (draft.score > draft.best) draft.best = draft.score;
  draft.animMs = 0;
  draft.phase = 'animating';
  return true;
}

function compressLine(
  line: Tile[],
  getPos: (tile: Tile) => number,
  setPos: (tile: Tile, pos: number) => void,
  destStart: number,
  destStep: number,
): { moved: boolean; score: number } {
  const merged: Tile[] = [];
  let score = 0;

  for (const tile of line) {
    const last = merged[merged.length - 1];
    if (last && last.value === tile.value && !last.mergedThisTurn) {
      last.value *= 2;
      last.mergedThisTurn = true;
      score += last.value;
      tile.removeAfterAnim = true;
      setPos(tile, getPos(last));
      continue;
    }
    merged.push(tile);
  }

  let moved = false;
  let pos = destStart;
  for (const tile of merged) {
    const before = getPos(tile);
    if (before !== pos) moved = true;
    setPos(tile, pos);
    pos += destStep;
  }

  for (const tile of line) {
    if (tile.fromRow !== null && tile.fromCol !== null) {
      if (tile.row !== tile.fromRow || tile.col !== tile.fromCol) moved = true;
    }
  }

  return { moved, score };
}

function finishAnimation(draft: GameState): void {
  draft.tiles = draft.tiles.filter((tile) => !tile.removeAfterAnim);
  for (const tile of draft.tiles) {
    tile.fromRow = null;
    tile.fromCol = null;
    tile.mergedThisTurn = false;
    tile.spawnAnim = false;
  }

  spawnRandomTile(draft);

  if (activeTiles(draft).some((tile) => tile.value >= WIN_VALUE)) {
    draft.phase = 'won';
    return;
  }

  if (!canMove(draft)) {
    draft.phase = 'lost';
    return;
  }

  draft.phase = 'playing';
}

function tilePixel(row: number, col: number): { x: number; y: number } {
  return {
    x: GRID_X + col * (CELL + GAP),
    y: GRID_Y + row * (CELL + GAP),
  };
}

function displayPosition(tile: Tile, progress: number): { x: number; y: number; scale: number } {
  const fromRow = tile.fromRow ?? tile.row;
  const fromCol = tile.fromCol ?? tile.col;
  const eased = easeOutCubic(progress);
  const from = tilePixel(fromRow, fromCol);
  const to = tilePixel(tile.row, tile.col);

  let scale = 1;
  if (tile.spawnAnim) {
    scale = 0.35 + eased * 0.65;
  } else if (tile.mergedThisTurn && progress >= 1) {
    scale = 1;
  } else if (tile.mergedThisTurn) {
    scale = 1 + Math.sin(eased * Math.PI) * 0.08;
  }

  return {
    x: from.x + (to.x - from.x) * eased,
    y: from.y + (to.y - from.y) * eased,
    scale,
  };
}

function directionFromSwipe(dx: number, dy: number): Direction | null {
  const threshold = 20;
  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return null;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
}

function directionFromKey(code: string | undefined): Direction | null {
  if (code === 'ArrowLeft' || code === 'KeyA') return 'left';
  if (code === 'ArrowRight' || code === 'KeyD') return 'right';
  if (code === 'ArrowUp' || code === 'KeyW') return 'up';
  if (code === 'ArrowDown' || code === 'KeyS') return 'down';
  return null;
}

const { store, commitChange, storeHistory } = createGameStore<GameState>(
  {
    phase: 'ready',
    tiles: [],
    score: 0,
    best: 0,
    nextId: 1,
    rngSeed: 0x2048,
    animMs: 0,
    swipeStart: null,
  },
  { enableHistory: true },
);

function tryMove(direction: Direction): void {
  commitChange(`move:${direction}`, (draft) => {
    if (draft.phase === 'ready') resetBoard(draft);
    beginMove(draft, direction);
  });
}

function Game() {
  useFrame((frame) => {
    const dtMs = Math.min(frame.deltaSeconds, 0.05) * 1000;
    commitChange('anim tick', (draft) => {
      if (draft.phase !== 'animating') return;
      draft.animMs += dtMs;
      if (draft.animMs < ANIM_MS) return;
      finishAnimation(draft);
    });
  });

  const animProgress =
    store.phase === 'animating' ? easeOutCubic(Math.min(1, store.animMs / ANIM_MS)) : 1;

  const statusText =
    store.phase === 'ready'
      ? '点击或滑动开始'
      : store.phase === 'won'
        ? '达成 2048！点击继续'
        : store.phase === 'lost'
          ? '游戏结束 · 点击重来'
          : '方向键 / 滑动移动';

  return (
    <scene
      id="main"
      width={SCENE_W}
      height={SCENE_H}
      backgroundColor="#faf8ef"
      clickable
      onClick={() => {
        commitChange('tap', (draft) => {
          if (draft.phase === 'ready') resetBoard(draft);
          else if (draft.phase === 'won') draft.phase = 'playing';
          else if (draft.phase === 'lost') resetBoard(draft);
        });
      }}
      onKeyDown={(event) => {
        const direction = directionFromKey(event.detail?.code);
        if (direction) tryMove(direction);
      }}
      onPointerDown={(event) => {
        commitChange('swipe:start', (draft) => {
          draft.swipeStart = { x: event.x, y: event.y };
        });
      }}
      onPointerUp={(event) => {
        commitChange('swipe:end', (draft) => {
          const from = draft.swipeStart;
          draft.swipeStart = null;
          if (!from) return;
          const direction = directionFromSwipe(event.x - from.x, event.y - from.y);
          if (!direction) return;
          if (draft.phase === 'ready') resetBoard(draft);
          beginMove(draft, direction);
        });
      }}
    >
      <text
        x={24}
        y={28}
        width={180}
        height={36}
        text="2048"
        textSize="32"
        textColor="#776e65"
        textAlign="left"
      />
      <text
        x={24}
        y={64}
        width={220}
        height={20}
        text={statusText}
        textSize="14"
        textColor="#8f7a66"
      />

      <node
        x={SCENE_W - 24 - 88}
        y={30}
        width={88}
        height={52}
        shape="roundedRect(6 6 6 6)"
        backgroundColor="#bbada0"
      />
      <text
        x={SCENE_W - 24 - 88}
        y={36}
        width={88}
        height={16}
        text="分数"
        textAlign="center"
        textSize="12"
        textColor="#eee4da"
      />
      <text
        x={SCENE_W - 24 - 88}
        y={52}
        width={88}
        height={24}
        text={`${store.score}`}
        textAlign="center"
        textSize="20"
        textColor="#ffffff"
      />

      <node
        x={SCENE_W - 24 - 88 - 12 - 88}
        y={30}
        width={88}
        height={52}
        shape="roundedRect(6 6 6 6)"
        backgroundColor="#bbada0"
      />
      <text
        x={SCENE_W - 24 - 88 - 12 - 88}
        y={36}
        width={88}
        height={16}
        text="最高"
        textAlign="center"
        textSize="12"
        textColor="#eee4da"
      />
      <text
        x={SCENE_W - 24 - 88 - 12 - 88}
        y={52}
        width={88}
        height={24}
        text={`${store.best}`}
        textAlign="center"
        textSize="20"
        textColor="#ffffff"
      />

      <node
        x={(SCENE_W - BOARD_SIZE) / 2}
        y={GRID_Y - PAD}
        width={BOARD_SIZE}
        height={BOARD_SIZE}
        shape="roundedRect(10 10 10 10)"
        backgroundColor="#bbada0"
      />

      {Array.from({ length: GRID * GRID }, (_, index) => {
        const row = Math.floor(index / GRID);
        const col = index % GRID;
        const pos = tilePixel(row, col);
        return (
          <node
            key={`cell-${row}-${col}`}
            x={pos.x}
            y={pos.y}
            width={CELL}
            height={CELL}
            shape="roundedRect(6 6 6 6)"
            backgroundColor="#cdc1b4"
          />
        );
      })}

      {store.tiles.map((tile) => {
        const progress = tile.fromRow === null && tile.fromCol === null && !tile.spawnAnim ? 1 : animProgress;
        const { x, y, scale } = displayPosition(tile, progress);
        const style = tileStyle(tile.value);
        const size = CELL * scale;
        const offset = (CELL - size) / 2;
        const fontSize = tile.value >= 1000 ? 22 : tile.value >= 100 ? 26 : 30;

        return (
          <group key={`tile-${tile.id}`} x={x + offset} y={y + offset} width={size} height={size}>
            <node
              x={0}
              y={0}
              width={size}
              height={size}
              shape="roundedRect(6 6 6 6)"
              backgroundColor={style.bg}
            />
            <text
              x={0}
              y={(size - fontSize) / 2 - 2}
              width={size}
              height={fontSize + 4}
              text={`${tile.value}`}
              textAlign="center"
              textSize={`${fontSize}`}
              textColor={style.fg}
            />
          </group>
        );
      })}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
