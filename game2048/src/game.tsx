import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'left' | 'right' | 'up' | 'down';
type AnimPhase = 'idle' | 'sliding' | 'spawning';
type GamePhase = 'ready' | 'playing' | 'won' | 'lost';

type Tile = {
  id: string;
  value: number;
  row: number;
  col: number;
};

type AnimTile = {
  id: string;
  value: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  removeAfterAnim: boolean;
};

type GameState = {
  phase: GamePhase;
  size: number;
  cell: number;
  score: number;
  best: number;
  tiles: Tile[];
  animTiles: AnimTile[];
  swipeStart: { x: number; y: number } | null;
  nextTileId: number;
  rngSeed: number;
  anim: {
    phase: AnimPhase;
    elapsedMs: number;
    durationMs: number;
  };
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const GRID_SIZE = 4;
const CELL_SIZE = 72;
const GRID_X = 36;
const GRID_Y = 200;
const GAP = 8;
const TILE_SIZE = CELL_SIZE - GAP;
const SLIDE_MS = 140;
const SPAWN_MS = 100;

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

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutCubic(t: number): number {
  const x = clamp01(t) - 1;
  return x * x * x + 1;
}

function nextRandom(seed: number): { value: number; seed: number } {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return { value: next / 0xffffffff, seed: next };
}

function tileColor(value: number): { bg: string; fg: string } {
  return TILE_COLORS[value] ?? { bg: '#3c3a32', fg: '#f9f6f2' };
}

function textSizeFor(value: number): number {
  if (value >= 1024) return 22;
  if (value >= 128) return 26;
  return 30;
}

function makeEmptyGrid(size: number): (string | null)[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
}

function gridFromTiles(tiles: Tile[], size: number): (string | null)[][] {
  const grid = makeEmptyGrid(size);
  for (const tile of tiles) {
    grid[tile.row][tile.col] = tile.id;
  }
  return grid;
}

function spawnTile(draft: GameState): boolean {
  const grid = gridFromTiles(draft.tiles, draft.size);
  const empty: { row: number; col: number }[] = [];
  for (let row = 0; row < draft.size; row++) {
    for (let col = 0; col < draft.size; col++) {
      if (!grid[row][col]) empty.push({ row, col });
    }
  }
  if (empty.length === 0) return false;

  const pick = nextRandom(draft.rngSeed);
  draft.rngSeed = pick.seed;
  const index = Math.floor(pick.value * empty.length);
  const spot = empty[index];

  const valuePick = nextRandom(draft.rngSeed);
  draft.rngSeed = valuePick.seed;
  const value = valuePick.value < 0.9 ? 2 : 4;

  const id = `t${draft.nextTileId}`;
  draft.nextTileId += 1;
  draft.tiles.push({ id, value, row: spot.row, col: spot.col });
  return true;
}

function makeInitialState(): GameState {
  const state: GameState = {
    phase: 'ready',
    size: GRID_SIZE,
    cell: CELL_SIZE,
    score: 0,
    best: 0,
    tiles: [],
    animTiles: [],
    swipeStart: null,
    nextTileId: 1,
    rngSeed: 0x2048,
    anim: { phase: 'idle', elapsedMs: 0, durationMs: SLIDE_MS },
  };
  spawnTile(state);
  spawnTile(state);
  return state;
}

const { store, commitChange, storeHistory } = createGameStore<GameState>(makeInitialState(), {
  enableHistory: true,
});

function canMove(tiles: Tile[], size: number): boolean {
  const values: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  for (const tile of tiles) {
    values[tile.row][tile.col] = tile.value;
  }
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (values[row][col] === 0) return true;
      const v = values[row][col];
      if (col + 1 < size && values[row][col + 1] === v) return true;
      if (row + 1 < size && values[row + 1][col] === v) return true;
    }
  }
  return false;
}

type LineMove = {
  id: string;
  fromIndex: number;
  toIndex: number;
  value: number;
  remove: boolean;
};

function slideLine(values: number[], ids: (string | null)[]): {
  newValues: number[];
  newIds: (string | null)[];
  moves: LineMove[];
  scoreGain: number;
} {
  const cells: { value: number; id: string; index: number }[] = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i] !== 0 && ids[i]) cells.push({ value: values[i], id: ids[i]!, index: i });
  }

  const moves: LineMove[] = [];
  let scoreGain = 0;
  const mergedValues: number[] = [];
  const mergedIds: (string | null)[] = [];
  let i = 0;

  while (i < cells.length) {
    if (i + 1 < cells.length && cells[i].value === cells[i + 1].value) {
      const mergedValue = cells[i].value * 2;
      scoreGain += mergedValue;
      const toIndex = mergedValues.length;
      moves.push({ id: cells[i].id, fromIndex: cells[i].index, toIndex, value: mergedValue, remove: false });
      moves.push({ id: cells[i + 1].id, fromIndex: cells[i + 1].index, toIndex, value: cells[i + 1].value, remove: true });
      mergedValues.push(mergedValue);
      mergedIds.push(cells[i].id);
      i += 2;
    } else {
      const toIndex = mergedValues.length;
      moves.push({ id: cells[i].id, fromIndex: cells[i].index, toIndex, value: cells[i].value, remove: false });
      mergedValues.push(cells[i].value);
      mergedIds.push(cells[i].id);
      i += 1;
    }
  }

  while (mergedValues.length < values.length) {
    mergedValues.push(0);
    mergedIds.push(null);
  }

  return { newValues: mergedValues, newIds: mergedIds, moves, scoreGain };
}

function buildMove(
  tiles: Tile[],
  size: number,
  direction: Direction,
): {
  moved: boolean;
  nextTiles: Tile[];
  animTiles: AnimTile[];
  scoreGain: number;
} {
  const valueGrid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  const idGrid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  for (const tile of tiles) {
    valueGrid[tile.row][tile.col] = tile.value;
    idGrid[tile.row][tile.col] = tile.id;
  }

  const animMap = new Map<string, AnimTile>();
  for (const tile of tiles) {
    animMap.set(tile.id, {
      id: tile.id,
      value: tile.value,
      fromRow: tile.row,
      fromCol: tile.col,
      toRow: tile.row,
      toCol: tile.col,
      removeAfterAnim: false,
    });
  }

  let scoreGain = 0;
  let moved = false;

  const applyLine = (getLine: () => { values: number[]; ids: (string | null)[]; coords: { row: number; col: number }[] }) => {
    const { values, ids, coords } = getLine();
    const lineValues = direction === 'right' || direction === 'down' ? [...values].reverse() : values;
    const lineIds = direction === 'right' || direction === 'down' ? [...ids].reverse() : ids;
    const lineCoords = direction === 'right' || direction === 'down' ? [...coords].reverse() : coords;

    const { newValues, newIds, moves, scoreGain: gain } = slideLine(lineValues, lineIds);
    scoreGain += gain;

    const outValues = direction === 'right' || direction === 'down' ? [...newValues].reverse() : newValues;
    const outIds = direction === 'right' || direction === 'down' ? [...newIds].reverse() : newIds;

    for (let i = 0; i < coords.length; i++) {
      const { row, col } = coords[i];
      valueGrid[row][col] = outValues[i];
      idGrid[row][col] = outIds[i];
    }

    for (const move of moves) {
      const fromCoord = lineCoords[move.fromIndex];
      const toCoord = lineCoords[move.toIndex];
      if (!fromCoord || !toCoord) continue;
      if (fromCoord.row !== toCoord.row || fromCoord.col !== toCoord.col) moved = true;

      const existing = animMap.get(move.id);
      if (!existing) continue;
      existing.toRow = toCoord.row;
      existing.toCol = toCoord.col;
      if (move.remove) existing.removeAfterAnim = true;
    }
  };

  if (direction === 'left' || direction === 'right') {
    for (let row = 0; row < size; row++) {
      applyLine(() => ({
        values: Array.from({ length: size }, (_, col) => valueGrid[row][col]),
        ids: Array.from({ length: size }, (_, col) => idGrid[row][col]),
        coords: Array.from({ length: size }, (_, col) => ({ row, col })),
      }));
    }
  } else {
    for (let col = 0; col < size; col++) {
      applyLine(() => ({
        values: Array.from({ length: size }, (_, row) => valueGrid[row][col]),
        ids: Array.from({ length: size }, (_, row) => idGrid[row][col]),
        coords: Array.from({ length: size }, (_, row) => ({ row, col })),
      }));
    }
  }

  if (!moved) {
    return { moved: false, nextTiles: tiles, animTiles: [], scoreGain: 0 };
  }

  const nextTiles: Tile[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const id = idGrid[row][col];
      if (!id) continue;
      const anim = animMap.get(id);
      if (anim?.removeAfterAnim) continue;
      nextTiles.push({ id, value: valueGrid[row][col], row, col });
    }
  }

  return { moved: true, nextTiles, animTiles: Array.from(animMap.values()), scoreGain };
}

function applyMove(draft: GameState, direction: Direction): void {
  if (draft.phase === 'ready') draft.phase = 'playing';
  if (draft.phase === 'lost' || draft.phase === 'won') return;
  if (draft.anim.phase !== 'idle') return;

  const { moved, nextTiles, animTiles, scoreGain } = buildMove(draft.tiles, draft.size, direction);
  if (!moved) {
    if (draft.phase === 'playing' && !canMove(draft.tiles, draft.size)) draft.phase = 'lost';
    return;
  }

  draft.score += scoreGain;
  if (draft.score > draft.best) draft.best = draft.score;
  draft.animTiles = animTiles;
  draft.tiles = nextTiles;
  draft.anim.phase = 'sliding';
  draft.anim.elapsedMs = 0;
  draft.anim.durationMs = SLIDE_MS;

  if (nextTiles.some((t) => t.value >= 2048) && draft.phase === 'playing') {
    draft.phase = 'won';
  }
}

function beginMove(direction: Direction): void {
  commitChange(`移动:${direction}`, (draft) => {
    applyMove(draft, direction);
  });
}

function finalizeSlide(draft: GameState): void {
  const tileById = new Map(draft.tiles.map((t) => [t.id, t]));
  const surviving: Tile[] = [];
  for (const anim of draft.animTiles) {
    if (anim.removeAfterAnim) continue;
    const tile = tileById.get(anim.id);
    if (!tile) continue;
    surviving.push({ id: tile.id, value: tile.value, row: anim.toRow, col: anim.toCol });
  }
  draft.tiles = surviving;
  draft.animTiles = [];

  const spawned = spawnTile(draft);
  if (spawned) {
    const newest = draft.tiles[draft.tiles.length - 1];
    draft.animTiles = [
      {
        id: newest.id,
        value: newest.value,
        fromRow: newest.row,
        fromCol: newest.col,
        toRow: newest.row,
        toCol: newest.col,
        removeAfterAnim: false,
      },
    ];
    draft.anim.phase = 'spawning';
    draft.anim.elapsedMs = 0;
    draft.anim.durationMs = SPAWN_MS;
    return;
  }

  draft.anim.phase = 'idle';
  draft.anim.elapsedMs = 0;
  if (draft.phase === 'playing' && !canMove(draft.tiles, draft.size)) {
    draft.phase = 'lost';
  }
}

function finalizeSpawn(draft: GameState): void {
  draft.animTiles = [];
  draft.anim.phase = 'idle';
  draft.anim.elapsedMs = 0;
  if (draft.phase === 'playing' && !canMove(draft.tiles, draft.size)) {
    draft.phase = 'lost';
  }
}

function restartGame(): void {
  commitChange('重开', (draft) => {
    const best = draft.best;
    Object.assign(draft, makeInitialState());
    draft.phase = 'playing';
    draft.best = best;
  });
}

function Game() {
  useFrame((frame) => {
    const dtMs = Math.min(frame.deltaSeconds, 0.05) * 1000;
    commitChange('动画帧', (draft) => {
      if (draft.anim.phase === 'idle') return;
      draft.anim.elapsedMs += dtMs;
      if (draft.anim.elapsedMs < draft.anim.durationMs) return;
      if (draft.anim.phase === 'sliding') finalizeSlide(draft);
      else if (draft.anim.phase === 'spawning') finalizeSpawn(draft);
    });
  });

  const boardSize = store.size * store.cell;
  const progress =
    store.anim.phase === 'idle' ? 1 : easeOutCubic(clamp01(store.anim.elapsedMs / store.anim.durationMs));
  const spawnScale = store.anim.phase === 'spawning' ? 0.6 + 0.4 * progress : 1;

  const renderTiles: AnimTile[] =
    store.anim.phase === 'idle'
      ? store.tiles.map((t) => ({
          id: t.id,
          value: t.value,
          fromRow: t.row,
          fromCol: t.col,
          toRow: t.row,
          toCol: t.col,
          removeAfterAnim: false,
        }))
      : store.animTiles;

  const newestId = store.tiles[store.tiles.length - 1]?.id;

  const statusText =
    store.phase === 'ready'
      ? '滑动屏幕开始游戏'
      : store.phase === 'won'
        ? '达成 2048！点击继续'
        : store.phase === 'lost'
          ? '游戏结束 - 点击重开'
          : '滑动合并方块';

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
        if (store.phase === 'lost') {
          restartGame();
          return;
        }
        if (store.phase === 'won' && store.anim.phase === 'idle') {
          commitChange('继续', (draft) => {
            draft.phase = 'playing';
          });
        }

        const from = store.swipeStart;
        if (!from) return;
        const dx = e.x - from.x;
        const dy = e.y - from.y;
        const threshold = 24;
        commitChange('滑动:结束', (draft) => {
          draft.swipeStart = null;
          if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
          const direction: Direction =
            Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
          applyMove(draft, direction);
        });
      }}
      onKeyDown={(e) => {
        if (e.detail?.code === 'ArrowLeft') beginMove('left');
        if (e.detail?.code === 'ArrowRight') beginMove('right');
        if (e.detail?.code === 'ArrowUp') beginMove('up');
        if (e.detail?.code === 'ArrowDown') beginMove('down');
        if (e.detail?.code === 'KeyR') restartGame();
      }}
    >
      <text x={0} y={48} width={SCENE_WIDTH} height={40} text="2048" textAlign="center" textColor="#776e65" textSize="42" />

      <text x={24} y={108} width={140} height={20} text="分数" textAlign="left" textColor="#bbada0" textSize="14" />
      <node x={24} y={128} width={140} height={48} shape="roundedRect(6 6 6 6)" backgroundColor="#bbada0" />
      <text
        x={24}
        y={140}
        width={140}
        height={28}
        text={`${store.score}`}
        textAlign="center"
        textColor="#ffffff"
        textSize="24"
      />

      <text x={196} y={108} width={140} height={20} text="最高" textAlign="left" textColor="#bbada0" textSize="14" />
      <node x={196} y={128} width={140} height={48} shape="roundedRect(6 6 6 6)" backgroundColor="#bbada0" />
      <text
        x={196}
        y={140}
        width={140}
        height={28}
        text={`${store.best}`}
        textAlign="center"
        textColor="#ffffff"
        textSize="24"
      />

      <text x={0} y={168} width={SCENE_WIDTH} height={22} text={statusText} textAlign="center" textColor="#776e65" textSize="15" />

      <node
        x={GRID_X}
        y={GRID_Y}
        width={boardSize}
        height={boardSize}
        shape="roundedRect(8 8 8 8)"
        backgroundColor="#bbada0"
      />

      {Array.from({ length: store.size * store.size }, (_, i) => {
        const row = Math.floor(i / store.size);
        const col = i % store.size;
        const pos = { x: GRID_X + col * store.cell + GAP / 2, y: GRID_Y + row * store.cell + GAP / 2 };
        return (
          <node
            key={`cell-${row}-${col}`}
            x={pos.x}
            y={pos.y}
            width={TILE_SIZE}
            height={TILE_SIZE}
            shape="roundedRect(4 4 4 4)"
            backgroundColor="#cdc1b4"
          />
        );
      })}

      {renderTiles
        .filter((tile) => !tile.removeAfterAnim || store.anim.phase === 'sliding')
        .map((tile) => {
          const row = tile.fromRow + (tile.toRow - tile.fromRow) * progress;
          const col = tile.fromCol + (tile.toCol - tile.fromCol) * progress;
          const x = GRID_X + col * store.cell + GAP / 2;
          const y = GRID_Y + row * store.cell + GAP / 2;
          const colors = tileColor(tile.value);
          const isSpawning = store.anim.phase === 'spawning' && tile.id === newestId;
          const scale = isSpawning ? spawnScale : 1;
          const size = TILE_SIZE * scale;
          const offset = (TILE_SIZE - size) / 2;
          const fontSize = textSizeFor(tile.value);

          return (
            <group key={tile.id} x={x + offset} y={y + offset} width={size} height={size}>
              <node x={0} y={0} width={size} height={size} shape="roundedRect(4 4 4 4)" backgroundColor={colors.bg} />
              <text
                x={0}
                y={size / 2 - fontSize / 2}
                width={size}
                height={fontSize}
                text={`${tile.value}`}
                textAlign="center"
                textColor={colors.fg}
                textSize={`${fontSize}`}
              />
            </group>
          );
        })}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
