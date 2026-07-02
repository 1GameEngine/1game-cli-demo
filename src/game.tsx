import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'left' | 'right' | 'up' | 'down';
type AnimPhase = 'idle' | 'sliding' | 'spawning';
type GamePhase = 'ready' | 'playing' | 'won' | 'lost';

type Tile = {
  id: string;
  value: number;
  row: number;
  col: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  isNew?: boolean;
  hidden?: boolean;
};

type GameState = {
  phase: GamePhase;
  score: number;
  best: number;
  size: number;
  cell: number;
  tiles: Tile[];
  nextTileId: number;
  rngSeed: number;
  anim: {
    phase: AnimPhase;
    elapsedMs: number;
    slideDurationMs: number;
    spawnDurationMs: number;
  };
  swipeStart: { x: number; y: number } | null;
  keepPlaying: boolean;
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const GRID_SIZE = 4;
const CELL_SIZE = 72;
const GRID_X = (SCENE_WIDTH - GRID_SIZE * CELL_SIZE) / 2;
const GRID_Y = 200;
const SWIPE_THRESHOLD = 24;
const SLIDE_DURATION_MS = 140;
const SPAWN_DURATION_MS = 100;

const TILE_BG: Record<number, string> = {
  2: '#eee4da',
  4: '#ede0c8',
  8: '#f2b179',
  16: '#f59563',
  32: '#f67c5f',
  64: '#f65e3b',
  128: '#edcf72',
  256: '#edcc61',
  512: '#edc850',
  1024: '#edc53f',
  2048: '#edc22e',
};

const TILE_FG: Record<number, string> = {
  2: '#776e65',
  4: '#776e65',
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutCubic(t: number): number {
  const x = clamp01(t) - 1;
  return x * x * x + 1;
}

function easeOutBack(t: number): number {
  const x = clamp01(t);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
}

function nextRandom(seed: number): { value: number; seed: number } {
  const newSeed = (seed * 1664525 + 1013904223) >>> 0;
  return { value: newSeed / 0xffffffff, seed: newSeed };
}

function tileBg(value: number): string {
  return TILE_BG[value] ?? '#3c3a32';
}

function tileFg(value: number): string {
  return TILE_FG[value] ?? '#f9f6f2';
}

function tileFontSize(value: number): string {
  if (value >= 1024) return '20';
  if (value >= 128) return '24';
  if (value >= 16) return '28';
  return '32';
}

function makeTile(id: string, value: number, row: number, col: number, isNew = false): Tile {
  return {
    id,
    value,
    row,
    col,
    fromRow: row,
    fromCol: col,
    toRow: row,
    toCol: col,
    isNew,
  };
}

function getLineCoords(direction: Direction, lineIndex: number): [number, number][] {
  const coords: [number, number][] = [];
  if (direction === 'left' || direction === 'right') {
    const cols = direction === 'left' ? [0, 1, 2, 3] : [3, 2, 1, 0];
    for (const col of cols) coords.push([lineIndex, col]);
  } else {
    const rows = direction === 'up' ? [0, 1, 2, 3] : [3, 2, 1, 0];
    for (const row of rows) coords.push([row, lineIndex]);
  }
  return coords;
}

function tileAt(tiles: Tile[], row: number, col: number): Tile | undefined {
  return tiles.find((t) => !t.hidden && t.row === row && t.col === col);
}

function processLine(tiles: Tile[], coords: [number, number][]): { moved: boolean; scoreGain: number } {
  let moved = false;
  let scoreGain = 0;
  const lineTiles = coords
    .map(([row, col]) => tileAt(tiles, row, col))
    .filter((t): t is Tile => t !== undefined);

  const result: Tile[] = [];
  let pending: Tile | null = null;

  for (const tile of lineTiles) {
    tile.fromRow = tile.row;
    tile.fromCol = tile.col;
    tile.toRow = tile.row;
    tile.toCol = tile.col;

    if (!pending) {
      pending = tile;
      continue;
    }

    if (pending.value === tile.value && !pending.merged) {
      tile.hidden = true;
      tile.toRow = pending.toRow;
      tile.toCol = pending.toCol;
      pending.value *= 2;
      (pending as Tile & { merged?: boolean }).merged = true;
      scoreGain += pending.value;
      result.push(pending);
      pending = null;
      moved = true;
    } else {
      result.push(pending);
      pending = tile;
    }
  }

  if (pending) result.push(pending);

  for (let i = 0; i < result.length; i++) {
    const [targetRow, targetCol] = coords[i];
    const tile = result[i];
    if (tile.row !== targetRow || tile.col !== targetCol) moved = true;
    tile.toRow = targetRow;
    tile.toCol = targetCol;
  }

  return { moved, scoreGain };
}

function tryMove(tiles: Tile[], direction: Direction): { tiles: Tile[]; moved: boolean; scoreGain: number } {
  const working = tiles.map((t) => ({
    ...t,
    hidden: false,
    isNew: false,
    fromRow: t.row,
    fromCol: t.col,
    toRow: t.row,
    toCol: t.col,
  }));

  let moved = false;
  let scoreGain = 0;

  for (let i = 0; i < GRID_SIZE; i++) {
    const coords = getLineCoords(direction, i);
    const result = processLine(working, coords);
    if (result.moved) moved = true;
    scoreGain += result.scoreGain;
  }

  return { tiles: working, moved, scoreGain };
}

function emptyCells(tiles: Tile[]): [number, number][] {
  const occupied = new Set(tiles.filter((t) => !t.hidden).map((t) => `${t.row},${t.col}`));
  const cells: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!occupied.has(`${r},${c}`)) cells.push([r, c]);
    }
  }
  return cells;
}

function canMove(tiles: Tile[]): boolean {
  if (emptyCells(tiles).length > 0) return true;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const tile = tileAt(tiles, r, c);
      if (!tile) continue;
      const right = tileAt(tiles, r, c + 1);
      const down = tileAt(tiles, r + 1, c);
      if (right && right.value === tile.value) return true;
      if (down && down.value === tile.value) return true;
    }
  }
  return false;
}

function spawnTile(draft: GameState): void {
  const empties = emptyCells(draft.tiles);
  if (empties.length === 0) return;

  const pick = nextRandom(draft.rngSeed);
  draft.rngSeed = pick.seed;
  const index = Math.floor(pick.value * empties.length);
  const [row, col] = empties[index];

  const valuePick = nextRandom(draft.rngSeed);
  draft.rngSeed = valuePick.seed;
  const value = valuePick.value < 0.9 ? 2 : 4;

  const id = `t${draft.nextTileId++}`;
  draft.tiles.push(makeTile(id, value, row, col, true));
}

function finalizeSlide(draft: GameState): void {
  for (const tile of draft.tiles) {
    if (tile.hidden) continue;
    tile.row = tile.toRow;
    tile.col = tile.toCol;
    tile.fromRow = tile.row;
    tile.fromCol = tile.col;
  }
  draft.tiles = draft.tiles.filter((t) => !t.hidden);
  draft.anim.phase = 'spawning';
  draft.anim.elapsedMs = 0;
  spawnTile(draft);

  if (!draft.keepPlaying && draft.tiles.some((t) => t.value >= 2048)) {
    draft.phase = 'won';
  } else if (!canMove(draft.tiles)) {
    draft.phase = 'lost';
  }
}

function finalizeSpawn(draft: GameState): void {
  for (const tile of draft.tiles) {
    tile.isNew = false;
    tile.fromRow = tile.row;
    tile.fromCol = tile.col;
    tile.toRow = tile.row;
    tile.toCol = tile.col;
  }
  draft.anim.phase = 'idle';
  draft.anim.elapsedMs = 0;
}

function makeInitialState(): GameState {
  const state: GameState = {
    phase: 'ready',
    score: 0,
    best: 0,
    size: GRID_SIZE,
    cell: CELL_SIZE,
    tiles: [],
    nextTileId: 1,
    rngSeed: 42,
    anim: {
      phase: 'idle',
      elapsedMs: 0,
      slideDurationMs: SLIDE_DURATION_MS,
      spawnDurationMs: SPAWN_DURATION_MS,
    },
    swipeStart: null,
    keepPlaying: false,
  };
  spawnTile(state);
  spawnTile(state);
  for (const tile of state.tiles) tile.isNew = false;
  return state;
}

const { store, commitChange, storeHistory } = createGameStore<GameState>(makeInitialState(), { enableHistory: true });

function beginMove(direction: Direction): void {
  commitChange(`移动:${direction}`, (draft) => {
    if (draft.phase === 'ready') draft.phase = 'playing';
    if (draft.phase === 'won' || draft.phase === 'lost') return;
    if (draft.anim.phase !== 'idle') return;

    const { tiles, moved, scoreGain } = tryMove(draft.tiles, direction);
    if (!moved) return;

    draft.tiles = tiles;
    draft.score += scoreGain;
    if (draft.score > draft.best) draft.best = draft.score;
    draft.anim.phase = 'sliding';
    draft.anim.elapsedMs = 0;
  });
}

function restartGame(): void {
  commitChange('重新开始', (draft) => {
    Object.assign(draft, makeInitialState());
    draft.phase = 'playing';
  });
}

function continueAfterWin(): void {
  commitChange('继续游戏', (draft) => {
    draft.keepPlaying = true;
    draft.phase = 'playing';
  });
}

function swipeToDirection(dx: number, dy: number): Direction | null {
  if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return null;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
}

function Game() {
  useFrame((frame) => {
    const dtMs = Math.min(frame.deltaSeconds, 0.05) * 1000;
    commitChange('动画帧', (draft) => {
      if (draft.anim.phase === 'idle') return;

      draft.anim.elapsedMs += dtMs;

      if (draft.anim.phase === 'sliding') {
        if (draft.anim.elapsedMs < draft.anim.slideDurationMs) return;
        finalizeSlide(draft);
        if (draft.anim.phase === 'spawning' && draft.anim.elapsedMs >= draft.anim.spawnDurationMs) {
          finalizeSpawn(draft);
        }
        return;
      }

      if (draft.anim.phase === 'spawning') {
        if (draft.anim.elapsedMs < draft.anim.spawnDurationMs) return;
        finalizeSpawn(draft);
      }
    });
  });

  const boardW = store.size * store.cell;
  const boardH = store.size * store.cell;

  const slideT =
    store.anim.phase === 'sliding'
      ? easeOutCubic(store.anim.elapsedMs / store.anim.slideDurationMs)
      : store.anim.phase === 'idle'
        ? 1
        : 1;
  const spawnT =
    store.anim.phase === 'spawning' ? easeOutBack(store.anim.elapsedMs / store.anim.spawnDurationMs) : 1;

  const title =
    store.phase === 'ready'
      ? '滑动屏幕开始'
      : store.phase === 'won'
        ? '达成 2048！'
        : store.phase === 'lost'
          ? '游戏结束'
          : '滑动合并方块';

  const visibleTiles = store.tiles.filter((t) => !t.hidden);

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

          const direction = swipeToDirection(e.x - from.x, e.y - from.y);
          if (!direction) {
            if (draft.phase === 'ready') draft.phase = 'playing';
            return;
          }
          draft.swipeStart = null;

          if (draft.anim.phase !== 'idle') return;
          if (draft.phase === 'won' || draft.phase === 'lost') return;

          const { tiles, moved, scoreGain } = tryMove(draft.tiles, direction);
          if (!moved) return;

          if (draft.phase === 'ready') draft.phase = 'playing';
          draft.tiles = tiles;
          draft.score += scoreGain;
          if (draft.score > draft.best) draft.best = draft.score;
          draft.anim.phase = 'sliding';
          draft.anim.elapsedMs = 0;
        });
      }}
      onKeyDown={(e) => {
        const code = e.detail?.code;
        if (code === 'ArrowLeft') beginMove('left');
        if (code === 'ArrowRight') beginMove('right');
        if (code === 'ArrowUp') beginMove('up');
        if (code === 'ArrowDown') beginMove('down');
      }}
    >
      <text x={0} y={48} width={SCENE_WIDTH} height={36} text="2048" textAlign="center" textColor="#776e65" textSize="42" />
      <text x={0} y={88} width={SCENE_WIDTH} height={22} text={title} textAlign="center" textColor="#8f7a66" textSize="16" />

      <node x={24} y={120} width={100} height={56} shape="roundedRect(6 6 6 6)" backgroundColor="#bbada0">
        <text x={0} y={8} width={100} height={16} text="得分" textAlign="center" textColor="#eee4da" textSize="12" />
        <text
          x={0}
          y={26}
          width={100}
          height={24}
          text={`${store.score}`}
          textAlign="center"
          textColor="#ffffff"
          textSize="22"
        />
      </node>

      <node x={236} y={120} width={100} height={56} shape="roundedRect(6 6 6 6)" backgroundColor="#bbada0">
        <text x={0} y={8} width={100} height={16} text="最高" textAlign="center" textColor="#eee4da" textSize="12" />
        <text
          x={0}
          y={26}
          width={100}
          height={24}
          text={`${store.best}`}
          textAlign="center"
          textColor="#ffffff"
          textSize="22"
        />
      </node>

      <node x={GRID_X - 8} y={GRID_Y - 8} width={boardW + 16} height={boardH + 16} shape="roundedRect(8 8 8 8)" backgroundColor="#bbada0" />

      {Array.from({ length: store.size * store.size }, (_, i) => {
        const row = Math.floor(i / store.size);
        const col = i % store.size;
        const x = GRID_X + col * store.cell + 4;
        const y = GRID_Y + row * store.cell + 4;
        const s = store.cell - 8;
        return <node key={`bg-${i}`} x={x} y={y} width={s} height={s} shape="roundedRect(4 4 4 4)" backgroundColor="#cdc1b4" />;
      })}

      {visibleTiles.map((tile) => {
        const fromX = GRID_X + tile.fromCol * store.cell + 4;
        const fromY = GRID_Y + tile.fromRow * store.cell + 4;
        const toX = GRID_X + tile.toCol * store.cell + 4;
        const toY = GRID_Y + tile.toRow * store.cell + 4;
        const baseX = fromX + (toX - fromX) * slideT;
        const baseY = fromY + (toY - fromY) * slideT;
        const size = store.cell - 8;
        const scale = tile.isNew && store.anim.phase === 'spawning' ? 0.5 + 0.5 * spawnT : 1;
        const offset = (size * (1 - scale)) / 2;
        const x = baseX + offset;
        const y = baseY + offset;
        const w = size * scale;
        const h = size * scale;

        return (
          <group key={tile.id}>
            <node x={x} y={y} width={w} height={h} shape="roundedRect(4 4 4 4)" backgroundColor={tileBg(tile.value)} />
            <text
              x={x}
              y={y + h / 2 - 14}
              width={w}
              height={28}
              text={`${tile.value}`}
              textAlign="center"
              textColor={tileFg(tile.value)}
              textSize={tileFontSize(tile.value)}
            />
          </group>
        );
      })}

      {(store.phase === 'won' || store.phase === 'lost') && (
        <group x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} zIndex={10}>
          <node x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} backgroundColor="#ffffff" alpha={0.72} />
          <text
            x={0}
            y={280}
            width={SCENE_WIDTH}
            height={40}
            text={store.phase === 'won' ? '你赢了！' : '没有可移动的步数'}
            textAlign="center"
            textColor="#776e65"
            textSize="32"
          />
          {store.phase === 'won' && (
            <group
              x={48}
              y={360}
              width={120}
              height={48}
              clickable
              onClick={continueAfterWin}
            >
              <node x={0} y={0} width={120} height={48} shape="roundedRect(6 6 6 6)" backgroundColor="#8f7a66" />
              <text x={0} y={14} width={120} height={24} text="继续" textAlign="center" textColor="#f9f6f2" textSize="18" />
            </group>
          )}
          <group
            x={store.phase === 'won' ? 192 : 120}
            y={360}
            width={120}
            height={48}
            clickable
            onClick={restartGame}
          >
            <node x={0} y={0} width={120} height={48} shape="roundedRect(6 6 6 6)" backgroundColor="#8f7a66" />
            <text x={0} y={14} width={120} height={24} text="再来" textAlign="center" textColor="#f9f6f2" textSize="18" />
          </group>
        </group>
      )}

      <text
        x={0}
        y={SCENE_HEIGHT - 48}
        width={SCENE_WIDTH}
        height={20}
        text="上下左右滑动移动方块"
        textAlign="center"
        textColor="#8f7a66"
        textSize="14"
      />
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
