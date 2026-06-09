import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'up' | 'down' | 'left' | 'right';

type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
  displayRow: number;
  displayCol: number;
  fromRow: number;
  fromCol: number;
  isMerged?: boolean;
};

type GameState = {
  phase: 'ready' | 'playing' | 'won' | 'lost';
  tiles: Tile[];
  score: number;
  best: number;
  nextId: number;
  animating: boolean;
  animProgress: number;
  pendingSpawn: boolean;
  rngSeed: number;
  swipeStart: { x: number; y: number } | null;
};

const SCENE_WIDTH = 400;
const SCENE_HEIGHT = 520;
const GRID_SIZE = 4;
const CELL = 72;
const GAP = 10;
const GRID_X = (SCENE_WIDTH - GRID_SIZE * CELL - (GRID_SIZE + 1) * GAP) / 2 + GAP;
const GRID_Y = 160;
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

function nextRandom(seed: number): { value: number; seed: number } {
  const newSeed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return { value: newSeed / 0x7fffffff, seed: newSeed };
}

function cellX(col: number): number {
  return GRID_X + col * (CELL + GAP);
}

function cellY(row: number): number {
  return GRID_Y + row * (CELL + GAP);
}

function findTileAt(tiles: Tile[], row: number, col: number): Tile | undefined {
  return tiles.find((t) => !t.isMerged && t.row === row && t.col === col);
}

function makeInitialState(): GameState {
  const state: GameState = {
    phase: 'ready',
    tiles: [],
    score: 0,
    best: 0,
    nextId: 1,
    animating: false,
    animProgress: 0,
    pendingSpawn: false,
    rngSeed: 42,
    swipeStart: null,
  };
  spawnRandomTile(state);
  spawnRandomTile(state);
  return state;
}

function spawnRandomTile(draft: GameState): void {
  const empty: { row: number; col: number }[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!findTileAt(draft.tiles, r, c)) empty.push({ row: r, col: c });
    }
  }
  if (empty.length === 0) return;

  const rand = nextRandom(draft.rngSeed);
  draft.rngSeed = rand.seed;
  const spot = empty[Math.floor(rand.value * empty.length)]!;
  const rand2 = nextRandom(draft.rngSeed);
  draft.rngSeed = rand2.seed;
  const value = rand2.value < 0.9 ? 2 : 4;

  draft.tiles.push({
    id: draft.nextId++,
    value,
    row: spot.row,
    col: spot.col,
    displayRow: spot.row,
    displayCol: spot.col,
    fromRow: spot.row,
    fromCol: spot.col,
  });
}

function getLineIndices(direction: Direction, index: number): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  if (direction === 'left' || direction === 'right') {
    for (let c = 0; c < GRID_SIZE; c++) {
      cells.push({ row: index, col: direction === 'left' ? c : GRID_SIZE - 1 - c });
    }
  } else {
    for (let r = 0; r < GRID_SIZE; r++) {
      cells.push({ row: direction === 'up' ? r : GRID_SIZE - 1 - r, col: index });
    }
  }
  return cells;
}

function slideLine(tiles: Tile[], indices: { row: number; col: number }[]): { moved: boolean; scoreGain: number } {
  const lineTiles = indices
    .map((pos) => findTileAt(tiles, pos.row, pos.col))
    .filter((t): t is Tile => t !== undefined);

  let moved = false;
  let scoreGain = 0;
  const mergedIds = new Set<number>();
  const result: Tile[] = [];

  for (const tile of lineTiles) {
    if (result.length > 0) {
      const prev = result[result.length - 1]!;
      if (prev.value === tile.value && !mergedIds.has(prev.id)) {
        prev.value *= 2;
        scoreGain += prev.value;
        mergedIds.add(prev.id);
        tile.isMerged = true;
        tile.row = prev.row;
        tile.col = prev.col;
        moved = true;
        continue;
      }
    }
    result.push(tile);
  }

  for (let i = 0; i < result.length; i++) {
    const target = indices[i]!;
    const tile = result[i]!;
    if (tile.row !== target.row || tile.col !== target.col) {
      tile.row = target.row;
      tile.col = target.col;
      moved = true;
    }
  }

  return { moved, scoreGain };
}

function moveTiles(draft: GameState, direction: Direction): boolean {
  if (draft.animating || draft.phase === 'lost') return false;

  let moved = false;
  let scoreGain = 0;

  if (direction === 'left' || direction === 'right') {
    for (let row = 0; row < GRID_SIZE; row++) {
      const result = slideLine(draft.tiles, getLineIndices(direction, row));
      if (result.moved) moved = true;
      scoreGain += result.scoreGain;
    }
  } else {
    for (let col = 0; col < GRID_SIZE; col++) {
      const result = slideLine(draft.tiles, getLineIndices(direction, col));
      if (result.moved) moved = true;
      scoreGain += result.scoreGain;
    }
  }

  if (!moved) return false;

  draft.score += scoreGain;
  if (draft.score > draft.best) draft.best = draft.score;
  for (const tile of draft.tiles) {
    tile.fromRow = tile.displayRow;
    tile.fromCol = tile.displayCol;
  }
  draft.animating = true;
  draft.animProgress = 0;
  draft.pendingSpawn = true;

  if (draft.tiles.some((t) => t.value >= 2048 && draft.phase === 'playing')) {
    draft.phase = 'won';
  }

  return true;
}

function canMove(tiles: Tile[]): boolean {
  const active = tiles.filter((t) => !t.isMerged);
  if (active.length < GRID_SIZE * GRID_SIZE) return true;

  for (const tile of active) {
    const neighbors = [
      { row: tile.row - 1, col: tile.col },
      { row: tile.row + 1, col: tile.col },
      { row: tile.row, col: tile.col - 1 },
      { row: tile.row, col: tile.col + 1 },
    ];
    for (const n of neighbors) {
      const other = findTileAt(active, n.row, n.col);
      if (other && other.value === tile.value) return true;
    }
  }
  return false;
}

function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

function handleDirection(draft: GameState, direction: Direction): void {
  if (draft.phase === 'ready') draft.phase = 'playing';
  if (draft.phase === 'won' || draft.phase === 'lost') return;
  moveTiles(draft, direction);
}

function restartGame(draft: GameState): void {
  Object.assign(draft, makeInitialState());
  draft.phase = 'playing';
}

const { store, commitChange, storeHistory } = createGameStore<GameState>(makeInitialState(), { enableHistory: true });

function Game() {
  useFrame((frame) => {
    const dt = Math.min(frame.deltaSeconds, 0.05);
    commitChange('animate', (draft) => {
      if (!draft.animating) return;

      draft.animProgress += dt / ANIM_DURATION;
      const t = easeOut(Math.min(1, draft.animProgress));

      for (const tile of draft.tiles) {
        tile.displayRow = tile.fromRow + (tile.row - tile.fromRow) * t;
        tile.displayCol = tile.fromCol + (tile.col - tile.fromCol) * t;
      }

      if (draft.animProgress < 1) return;

      for (const tile of draft.tiles) {
        tile.displayRow = tile.row;
        tile.displayCol = tile.col;
        tile.fromRow = tile.row;
        tile.fromCol = tile.col;
      }

      draft.animating = false;
      draft.tiles = draft.tiles.filter((t) => !t.isMerged);

      if (draft.pendingSpawn) {
        spawnRandomTile(draft);
        draft.pendingSpawn = false;
        if (draft.phase === 'playing' && !canMove(draft.tiles)) {
          draft.phase = 'lost';
        }
      }
    });
  });

  const statusText =
    store.phase === 'ready'
      ? '点击或滑动开始'
      : store.phase === 'won'
        ? '你赢了！继续玩或重新开始'
        : store.phase === 'lost'
          ? '游戏结束 - 点击重新开始'
          : '方向键或滑动移动';

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
        const code = e.detail?.code;
        commitChange('keydown', (draft) => {
          if (code === 'ArrowUp') handleDirection(draft, 'up');
          if (code === 'ArrowDown') handleDirection(draft, 'down');
          if (code === 'ArrowLeft') handleDirection(draft, 'left');
          if (code === 'ArrowRight') handleDirection(draft, 'right');
        });
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
          if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
            if (draft.phase === 'ready') draft.phase = 'playing';
            if (draft.phase === 'lost') restartGame(draft);
            return;
          }

          const direction: Direction =
            Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
          handleDirection(draft, direction);
        });
      }}
    >
      <text
        x={24}
        y={28}
        width={200}
        height={48}
        text="2048"
        textSize="42"
        textColor="#776e65"
        textAlign="left"
      />

      <group x={SCENE_WIDTH - 180} y={24} width={156} height={56}>
        <node x={0} y={0} width={72} height={56} shape="roundedRect(6 6 6 6)" backgroundColor="#bbada0" />
        <text x={0} y={6} width={72} height={16} text="分数" textAlign="center" textSize="12" textColor="#eee4da" />
        <text
          x={0}
          y={24}
          width={72}
          height={28}
          text={`${store.score}`}
          textAlign="center"
          textSize="22"
          textColor="#ffffff"
        />

        <node x={84} y={0} width={72} height={56} shape="roundedRect(6 6 6 6)" backgroundColor="#bbada0" />
        <text x={84} y={6} width={72} height={16} text="最高" textAlign="center" textSize="12" textColor="#eee4da" />
        <text
          x={84}
          y={24}
          width={72}
          height={28}
          text={`${store.best}`}
          textAlign="center"
          textSize="22"
          textColor="#ffffff"
        />
      </group>

      <text
        x={0}
        y={96}
        width={SCENE_WIDTH}
        height={24}
        text={statusText}
        textAlign="center"
        textSize="14"
        textColor="#776e65"
      />

      <node
        x={GRID_X - GAP}
        y={GRID_Y - GAP}
        width={GRID_SIZE * CELL + (GRID_SIZE + 1) * GAP}
        height={GRID_SIZE * CELL + (GRID_SIZE + 1) * GAP}
        shape="roundedRect(8 8 8 8)"
        backgroundColor="#bbada0"
      />

      {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
        const row = Math.floor(i / GRID_SIZE);
        const col = i % GRID_SIZE;
        return (
          <node
            key={`cell-${row}-${col}`}
            x={cellX(col)}
            y={cellY(row)}
            width={CELL}
            height={CELL}
            shape="roundedRect(4 4 4 4)"
            backgroundColor="#cdc1b4"
          />
        );
      })}

      {store.tiles.map((tile) => {
        const colors = tileColor(tile.value);
        const x = cellX(tile.displayCol);
        const y = cellY(tile.displayRow);
        const fontSize = tile.value >= 1000 ? 24 : tile.value >= 100 ? 28 : 32;
        return (
          <group key={`tile-${tile.id}`} x={x} y={y} width={CELL} height={CELL}>
            <node
              x={0}
              y={0}
              width={CELL}
              height={CELL}
              shape="roundedRect(4 4 4 4)"
              backgroundColor={colors.bg}
            />
            <text
              x={0}
              y={(CELL - fontSize) / 2 - 2}
              width={CELL}
              height={fontSize + 4}
              text={`${tile.value}`}
              textAlign="center"
              textSize={`${fontSize}`}
              textColor={colors.fg}
            />
          </group>
        );
      })}

      <group
        x={SCENE_WIDTH / 2 - 60}
        y={SCENE_HEIGHT - 64}
        width={120}
        height={40}
        clickable
        onClick={() => {
          commitChange('restart', (draft) => restartGame(draft));
        }}
      >
        <node x={0} y={0} width={120} height={40} shape="roundedRect(8 8 8 8)" backgroundColor="#8f7a66" />
        <text x={0} y={10} width={120} height={20} text="重新开始" textAlign="center" textSize="16" textColor="#f9f6f2" />
      </group>
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
