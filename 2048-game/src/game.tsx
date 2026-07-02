import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'left' | 'right' | 'up' | 'down';
type AnimPhase = 'idle' | 'slide';
type GamePhase = 'ready' | 'playing' | 'won' | 'gameover';

type Tile = {
  id: string;
  value: number;
  row: number;
  col: number;
};

type TileDisplay = {
  id: string;
  value: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  isMergeSource?: boolean;
};

type GameState = {
  phase: GamePhase;
  score: number;
  best: number;
  tiles: Tile[];
  displayTiles: TileDisplay[];
  anim: { phase: AnimPhase; elapsedMs: number; durationMs: number };
  swipeStart: { x: number; y: number } | null;
  rngSeed: number;
  nextTileId: number;
  keepPlaying: boolean;
  pendingSpawn: { row: number; col: number; value: number } | null;
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const GRID_SIZE = 4;
const CELL_SIZE = 72;
const CELL_GAP = 8;
const GRID_X = (SCENE_WIDTH - GRID_SIZE * CELL_SIZE) / 2;
const GRID_Y = 200;
const ANIM_DURATION_MS = 140;
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

function tileColor(value: number): { bg: string; fg: string } {
  return TILE_COLORS[value] ?? { bg: '#3c3a32', fg: '#f9f6f2' };
}

function tileTextSize(value: number): string {
  if (value >= 1024) return '22';
  if (value >= 128) return '26';
  if (value >= 16) return '30';
  return '34';
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutCubic(t: number): number {
  const x = clamp01(t) - 1;
  return x * x * x + 1;
}

function nextRandom(seed: number): [number, number] {
  const next = (seed * 1103515245 + 12345) & 0x7fffffff;
  return [next, next / 0x7fffffff];
}

function allocId(draft: GameState): string {
  const id = `t${draft.nextTileId}`;
  draft.nextTileId += 1;
  return id;
}

function tilesToGrid(tiles: Tile[]): number[][] {
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
  for (const tile of tiles) {
    grid[tile.row][tile.col] = tile.value;
  }
  return grid;
}

function spawnRandomTile(draft: GameState): boolean {
  const grid = tilesToGrid(draft.tiles);
  const empty: { row: number; col: number }[] = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (grid[row][col] === 0) empty.push({ row, col });
    }
  }
  if (empty.length === 0) return false;

  let rand = 0;
  [draft.rngSeed, rand] = nextRandom(draft.rngSeed);
  const pick = empty[Math.floor(rand * empty.length)];

  [draft.rngSeed, rand] = nextRandom(draft.rngSeed);
  const value = rand < 0.9 ? 2 : 4;

  draft.tiles.push({
    id: allocId(draft),
    value,
    row: pick.row,
    col: pick.col,
  });
  return true;
}

function buildDisplayTiles(tiles: Tile[]): TileDisplay[] {
  return tiles.map((tile) => ({
    id: tile.id,
    value: tile.value,
    fromRow: tile.row,
    fromCol: tile.col,
    toRow: tile.row,
    toCol: tile.col,
  }));
}

function makeInitialState(): GameState {
  const draft: GameState = {
    phase: 'ready',
    score: 0,
    best: 0,
    tiles: [],
    displayTiles: [],
    anim: { phase: 'idle', elapsedMs: 0, durationMs: ANIM_DURATION_MS },
    swipeStart: null,
    rngSeed: 42,
    nextTileId: 1,
    keepPlaying: false,
    pendingSpawn: null,
  };
  spawnRandomTile(draft);
  spawnRandomTile(draft);
  draft.displayTiles = buildDisplayTiles(draft.tiles);
  return draft;
}

function canMove(tiles: Tile[]): boolean {
  const grid = tilesToGrid(tiles);
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (grid[row][col] === 0) return true;
      if (col + 1 < GRID_SIZE && grid[row][col] === grid[row][col + 1]) return true;
      if (row + 1 < GRID_SIZE && grid[row][col] === grid[row + 1][col]) return true;
    }
  }
  return false;
}

function hasWon(tiles: Tile[]): boolean {
  return tiles.some((tile) => tile.value >= 2048);
}

type MoveResult = {
  tiles: Tile[];
  displayTiles: TileDisplay[];
  scoreGain: number;
  moved: boolean;
};

function processLine(
  lineTiles: Tile[],
  primaryKey: 'row' | 'col',
  secondaryKey: 'row' | 'col',
  reverse: boolean,
): MoveResult {
  const sorted = [...lineTiles].sort((a, b) => {
    const delta = a[secondaryKey] - b[secondaryKey];
    return reverse ? -delta : delta;
  });

  const resultTiles: Tile[] = [];
  const displayTiles: TileDisplay[] = [];
  let scoreGain = 0;
  let moved = false;
  let targetIndex = 0;
  let index = 0;

  while (index < sorted.length) {
    const current = sorted[index];
    const currentSecondary = current[secondaryKey];

    if (index + 1 < sorted.length && sorted[index + 1].value === current.value) {
      const next = sorted[index + 1];
      const mergedValue = current.value * 2;
      scoreGain += mergedValue;
      moved = moved || currentSecondary !== targetIndex || next[secondaryKey] !== targetIndex;

      displayTiles.push({
        id: current.id,
        value: mergedValue,
        fromRow: current.row,
        fromCol: current.col,
        toRow: primaryKey === 'row' ? current.row : targetIndex,
        toCol: primaryKey === 'col' ? current.col : targetIndex,
      });
      displayTiles.push({
        id: next.id,
        value: next.value,
        fromRow: next.row,
        fromCol: next.col,
        toRow: primaryKey === 'row' ? next.row : targetIndex,
        toCol: primaryKey === 'col' ? next.col : targetIndex,
        isMergeSource: true,
      });

      resultTiles.push({
        id: current.id,
        value: mergedValue,
        row: primaryKey === 'row' ? current.row : targetIndex,
        col: primaryKey === 'col' ? current.col : targetIndex,
      });

      targetIndex += 1;
      index += 2;
      continue;
    }

    moved = moved || currentSecondary !== targetIndex;
    displayTiles.push({
      id: current.id,
      value: current.value,
      fromRow: current.row,
      fromCol: current.col,
      toRow: primaryKey === 'row' ? current.row : targetIndex,
      toCol: primaryKey === 'col' ? current.col : targetIndex,
    });
    resultTiles.push({
      id: current.id,
      value: current.value,
      row: primaryKey === 'row' ? current.row : targetIndex,
      col: primaryKey === 'col' ? current.col : targetIndex,
    });
    targetIndex += 1;
    index += 1;
  }

  return { tiles: resultTiles, displayTiles, scoreGain, moved };
}

function moveTiles(tiles: Tile[], direction: Direction): MoveResult {
  const grouped = new Map<number, Tile[]>();
  const primaryKey = direction === 'left' || direction === 'right' ? 'row' : 'col';
  const secondaryKey = direction === 'left' || direction === 'right' ? 'col' : 'row';
  const reverse = direction === 'right' || direction === 'down';

  for (const tile of tiles) {
    const key = tile[primaryKey];
    const bucket = grouped.get(key) ?? [];
    bucket.push(tile);
    grouped.set(key, bucket);
  }

  const mergedTiles: Tile[] = [];
  const mergedDisplay: TileDisplay[] = [];
  let totalScore = 0;
  let moved = false;

  for (let index = 0; index < GRID_SIZE; index += 1) {
    const lineTiles = grouped.get(index) ?? [];
    if (lineTiles.length === 0) continue;
    const result = processLine(lineTiles, primaryKey, secondaryKey, reverse);
    mergedTiles.push(...result.tiles);
    mergedDisplay.push(...result.displayTiles);
    totalScore += result.scoreGain;
    moved = moved || result.moved;
  }

  return {
    tiles: mergedTiles,
    displayTiles: mergedDisplay,
    scoreGain: totalScore,
    moved,
  };
}

function finalizeAnimation(draft: GameState): void {
  draft.tiles = draft.displayTiles
    .filter((tile) => !tile.isMergeSource)
    .map((tile) => ({
      id: tile.id,
      value: tile.value,
      row: tile.toRow,
      col: tile.toCol,
    }));

  if (draft.pendingSpawn) {
    const spawn = draft.pendingSpawn;
    draft.tiles.push({
      id: allocId(draft),
      value: spawn.value,
      row: spawn.row,
      col: spawn.col,
    });
    draft.pendingSpawn = null;
  }

  draft.displayTiles = buildDisplayTiles(draft.tiles);
  draft.anim.phase = 'idle';
  draft.anim.elapsedMs = 0;

  if (!draft.keepPlaying && hasWon(draft.tiles)) {
    draft.phase = 'won';
  } else if (!canMove(draft.tiles)) {
    draft.phase = 'gameover';
  }
}

function prepareSpawn(draft: GameState): void {
  const grid = tilesToGrid(draft.tiles);
  const empty: { row: number; col: number }[] = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (grid[row][col] === 0) empty.push({ row, col });
    }
  }
  if (empty.length === 0) return;

  let rand = 0;
  [draft.rngSeed, rand] = nextRandom(draft.rngSeed);
  const pick = empty[Math.floor(rand * empty.length)];
  [draft.rngSeed, rand] = nextRandom(draft.rngSeed);
  draft.pendingSpawn = { row: pick.row, col: pick.col, value: rand < 0.9 ? 2 : 4 };
}

function beginMove(direction: Direction): void {
  commitChange(`移动:${direction}`, (draft) => {
    if (draft.phase === 'gameover') return;
    if (draft.anim.phase !== 'idle') return;

    if (draft.phase === 'ready') draft.phase = 'playing';

    const result = moveTiles(draft.tiles, direction);
    if (!result.moved) return;

    draft.score += result.scoreGain;
    if (draft.score > draft.best) draft.best = draft.score;

    draft.tiles = result.tiles;
    draft.displayTiles = result.displayTiles;
    draft.anim.phase = 'slide';
    draft.anim.elapsedMs = 0;
    prepareSpawn(draft);
  });
}

function restartGame(): void {
  commitChange('重开', (draft) => {
    Object.assign(draft, makeInitialState());
    draft.phase = 'playing';
  });
}

const { store, commitChange, storeHistory } = createGameStore<GameState>(makeInitialState(), { enableHistory: true });

function handleSwipeEnd(fromX: number, fromY: number, toX: number, toY: number): void {
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    beginMove(dx > 0 ? 'right' : 'left');
  } else {
    beginMove(dy > 0 ? 'down' : 'up');
  }
}

function Game() {
  useFrame((frame) => {
    const dtMs = Math.min(frame.deltaSeconds, 0.05) * 1000;
    commitChange('动画帧推进', (draft) => {
      if (draft.anim.phase !== 'slide') return;
      draft.anim.elapsedMs += dtMs;
      if (draft.anim.elapsedMs < draft.anim.durationMs) return;
      finalizeAnimation(draft);
    });
  });

  const progress =
    store.anim.phase === 'idle' ? 1 : easeOutCubic(clamp01(store.anim.elapsedMs / store.anim.durationMs));
  const boardSize = GRID_SIZE * CELL_SIZE;
  const innerSize = CELL_SIZE - CELL_GAP;

  const title =
    store.phase === 'ready'
      ? '滑动开始游戏'
      : store.phase === 'won'
        ? '达成 2048！'
        : store.phase === 'gameover'
          ? '游戏结束'
          : '滑动合并方块';

  return (
    <scene
      name="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#faf8ef"
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
          handleSwipeEnd(from.x, from.y, event.x, event.y);
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
      <text x={0} y={36} width={SCENE_WIDTH} height={32} text="2048" textAlign="center" textColor="#776e65" textSize="34" />
      <text x={0} y={72} width={SCENE_WIDTH} height={22} text={title} textAlign="center" textColor="#8f8178" textSize="16" />

      <node x={GRID_X - 8} y={132} width={148} height={56} shape="roundedRect(8 8 8 8)" backgroundColor="#bbada0" />
      <text x={GRID_X - 8} y={140} width={148} height={18} text="分数" textAlign="center" textColor="#eee4da" textSize="14" />
      <text
        x={GRID_X - 8}
        y={160}
        width={148}
        height={24}
        text={`${store.score}`}
        textAlign="center"
        textColor="#ffffff"
        textSize="22"
      />

      <node x={GRID_X + boardSize - 140} y={132} width={148} height={56} shape="roundedRect(8 8 8 8)" backgroundColor="#bbada0" />
      <text x={GRID_X + boardSize - 140} y={140} width={148} height={18} text="最高" textAlign="center" textColor="#eee4da" textSize="14" />
      <text
        x={GRID_X + boardSize - 140}
        y={160}
        width={148}
        height={24}
        text={`${store.best}`}
        textAlign="center"
        textColor="#ffffff"
        textSize="22"
      />

      <node x={GRID_X - 8} y={GRID_Y - 8} width={boardSize + 16} height={boardSize + 16} shape="roundedRect(10 10 10 10)" backgroundColor="#bbada0" />

      {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
        const row = Math.floor(index / GRID_SIZE);
        const col = index % GRID_SIZE;
        return (
          <node
            key={`cell-${row}-${col}`}
            x={GRID_X + col * CELL_SIZE + CELL_GAP / 2}
            y={GRID_Y + row * CELL_SIZE + CELL_GAP / 2}
            width={innerSize}
            height={innerSize}
            shape="roundedRect(6 6 6 6)"
            backgroundColor="#cdc1b4"
          />
        );
      })}

      {store.displayTiles.map((tile) => {
        if (tile.isMergeSource && progress >= 1) return null;
        const row = tile.fromRow + (tile.toRow - tile.fromRow) * progress;
        const col = tile.fromCol + (tile.toCol - tile.fromCol) * progress;
        const x = GRID_X + col * CELL_SIZE + CELL_GAP / 2;
        const y = GRID_Y + row * CELL_SIZE + CELL_GAP / 2;
        const colors = tileColor(tile.value);
        const mergeScale = tile.isMergeSource ? 1 - progress * 0.35 : 1;
        const size = innerSize * mergeScale;
        const offset = (innerSize - size) / 2;

        return (
          <group key={tile.id}>
            <node
              x={x + offset}
              y={y + offset}
              width={size}
              height={size}
              shape="roundedRect(6 6 6 6)"
              backgroundColor={colors.bg}
            />
            {!tile.isMergeSource || progress < 0.85 ? (
              <text
                x={x + offset}
                y={y + offset + (size - 24) / 2}
                width={size}
                height={24}
                text={`${tile.value}`}
                textAlign="center"
                textColor={colors.fg}
                textSize={tileTextSize(tile.value)}
              />
            ) : null}
          </group>
        );
      })}

      {store.pendingSpawn && store.anim.phase === 'slide' && progress >= 0.98 ? (
        (() => {
          const spawn = store.pendingSpawn!;
          const x = GRID_X + spawn.col * CELL_SIZE + CELL_GAP / 2;
          const y = GRID_Y + spawn.row * CELL_SIZE + CELL_GAP / 2;
          const colors = tileColor(spawn.value);
          const spawnScale = clamp01((progress - 0.98) / 0.02);
          const size = innerSize * (0.35 + spawnScale * 0.65);
          const offset = (innerSize - size) / 2;
          return (
            <group key="pending-spawn">
              <node
                x={x + offset}
                y={y + offset}
                width={size}
                height={size}
                shape="roundedRect(6 6 6 6)"
                backgroundColor={colors.bg}
              />
              <text
                x={x + offset}
                y={y + offset + (size - 24) / 2}
                width={size}
                height={24}
                text={`${spawn.value}`}
                textAlign="center"
                textColor={colors.fg}
                textSize={tileTextSize(spawn.value)}
              />
            </group>
          );
        })()
      ) : null}

      {(store.phase === 'gameover' || store.phase === 'won') && (
        <group x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} zIndex={10}>
          <node x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} backgroundColor="#eee4da" alpha={0.72} />
          <text
            x={0}
            y={280}
            width={SCENE_WIDTH}
            height={36}
            text={store.phase === 'won' ? '你赢了！' : '没有可移动的步数'}
            textAlign="center"
            textColor="#776e65"
            textSize="28"
          />
          {store.phase === 'won' ? (
            <group
              x={48}
              y={350}
              width={120}
              height={44}
              clickable
              onClick={() => {
                commitChange('继续游戏', (draft) => {
                  draft.keepPlaying = true;
                  draft.phase = 'playing';
                });
              }}
            >
              <node x={0} y={0} width={120} height={44} shape="roundedRect(8 8 8 8)" backgroundColor="#8f7a66" />
              <text x={0} y={12} width={120} height={22} text="继续" textAlign="center" textColor="#f9f6f2" textSize="18" />
            </group>
          ) : null}
          <group
            x={store.phase === 'won' ? 192 : 120}
            y={350}
            width={120}
            height={44}
            clickable
            onClick={restartGame}
          >
            <node x={0} y={0} width={120} height={44} shape="roundedRect(8 8 8 8)" backgroundColor="#8f7a66" />
            <text x={0} y={12} width={120} height={22} text="再来一局" textAlign="center" textColor="#f9f6f2" textSize="18" />
          </group>
        </group>
      )}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
