import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'up' | 'down' | 'left' | 'right';

type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  isNew: boolean;
  willRemove: boolean;
};

type GameState = {
  phase: 'ready' | 'playing' | 'won' | 'lost';
  score: number;
  best: number;
  tiles: Tile[];
  rngSeed: number;
  animPhase: 'idle' | 'slide' | 'spawn';
  animProgress: number;
  swipeStart: { x: number; y: number } | null;
  wonAcknowledged: boolean;
};

const SCENE_WIDTH = 400;
const SCENE_HEIGHT = 520;
const GRID_SIZE = 4;
const CELL = 80;
const GAP = 10;
const BOARD_W = GRID_SIZE * CELL + (GRID_SIZE + 1) * GAP;
const BOARD_X = (SCENE_WIDTH - BOARD_W) / 2;
const BOARD_Y = 150;
const SLIDE_DURATION = 0.12;
const SPAWN_DURATION = 0.1;

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

let nextTileId = 1;

function tileColor(value: number): { bg: string; fg: string } {
  return TILE_COLORS[value] ?? { bg: '#3c3a32', fg: '#f9f6f2' };
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function nextRandom(seed: number): { value: number; seed: number } {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return { value: next / 0xffffffff, seed: next };
}

function cellX(col: number): number {
  return BOARD_X + GAP + col * (CELL + GAP);
}

function cellY(row: number): number {
  return BOARD_Y + GAP + row * (CELL + GAP);
}

function tileAt(tiles: Tile[], row: number, col: number): Tile | undefined {
  return tiles.find((t) => !t.willRemove && t.row === row && t.col === col);
}

function emptyCells(tiles: Tile[]): Array<{ row: number; col: number }> {
  const occupied = new Set(tiles.filter((t) => !t.willRemove).map((t) => `${t.row},${t.col}`));
  const cells: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!occupied.has(`${row},${col}`)) cells.push({ row, col });
    }
  }
  return cells;
}

function makeTile(row: number, col: number, value: number, isNew = false): Tile {
  return {
    id: nextTileId++,
    value,
    row,
    col,
    fromRow: row,
    fromCol: col,
    toRow: row,
    toCol: col,
    isNew,
    willRemove: false,
  };
}

function spawnTile(tiles: Tile[], seed: number): { tiles: Tile[]; seed: number } {
  const empties = emptyCells(tiles);
  if (empties.length === 0) return { tiles, seed };
  const pick = nextRandom(seed);
  const cell = empties[Math.floor(pick.value * empties.length)]!;
  const valuePick = nextRandom(pick.seed);
  const value = valuePick.value < 0.9 ? 2 : 4;
  return {
    tiles: [...tiles, makeTile(cell.row, cell.col, value, true)],
    seed: valuePick.seed,
  };
}

function syncTilePositions(tile: Tile): void {
  tile.fromRow = tile.row;
  tile.fromCol = tile.col;
  tile.toRow = tile.row;
  tile.toCol = tile.col;
  tile.isNew = false;
}

function beginSlide(tile: Tile, toRow: number, toCol: number): void {
  if (tile.row === toRow && tile.col === toCol) return;
  tile.fromRow = tile.row;
  tile.fromCol = tile.col;
  tile.toRow = toRow;
  tile.toCol = toCol;
  tile.row = toRow;
  tile.col = toCol;
}

function moveTiles(tiles: Tile[], direction: Direction): { tiles: Tile[]; scoreGain: number; moved: boolean } {
  const working = tiles.map((t) => ({
    ...t,
    willRemove: false,
    isNew: false,
    fromRow: t.row,
    fromCol: t.col,
    toRow: t.row,
    toCol: t.col,
  }));

  let scoreGain = 0;
  let moved = false;
  const reverse = direction === 'right' || direction === 'down';
  const alongCol = direction === 'left' || direction === 'right';

  const slideLine = (lineTiles: Tile[], fixed: number): void => {
    const ordered = [...lineTiles].sort((a, b) => {
      const keyA = alongCol ? a.col : a.row;
      const keyB = alongCol ? b.col : b.row;
      return reverse ? keyB - keyA : keyA - keyB;
    });

    let target = reverse ? GRID_SIZE - 1 : 0;
    const step = reverse ? -1 : 1;
    let i = 0;

    while (i < ordered.length) {
      const current = ordered[i]!;
      const startRow = current.row;
      const startCol = current.col;
      const targetRow = alongCol ? fixed : target;
      const targetCol = alongCol ? target : fixed;

      if (i + 1 < ordered.length && current.value === ordered[i + 1]!.value) {
        const partner = ordered[i + 1]!;
        const partnerStartRow = partner.row;
        const partnerStartCol = partner.col;

        beginSlide(current, targetRow, targetCol);
        beginSlide(partner, targetRow, targetCol);
        current.value *= 2;
        partner.willRemove = true;
        scoreGain += current.value;

        if (
          startRow !== targetRow ||
          startCol !== targetCol ||
          partnerStartRow !== targetRow ||
          partnerStartCol !== targetCol
        ) {
          moved = true;
        } else {
          moved = true;
        }
        i += 2;
        target += step;
      } else {
        if (startRow !== targetRow || startCol !== targetCol) {
          beginSlide(current, targetRow, targetCol);
          moved = true;
        }
        i += 1;
        target += step;
      }
    }
  };

  if (alongCol) {
    for (let row = 0; row < GRID_SIZE; row++) {
      slideLine(
        working.filter((t) => t.row === row),
        row,
      );
    }
  } else {
    for (let col = 0; col < GRID_SIZE; col++) {
      slideLine(
        working.filter((t) => t.col === col),
        col,
      );
    }
  }

  return { tiles: working, scoreGain, moved };
}

function hasMoves(tiles: Tile[]): boolean {
  if (emptyCells(tiles).length > 0) return true;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const tile = tileAt(tiles, row, col);
      if (!tile) continue;
      const right = tileAt(tiles, row, col + 1);
      const down = tileAt(tiles, row + 1, col);
      if ((right && right.value === tile.value) || (down && down.value === tile.value)) return true;
    }
  }
  return false;
}

function hasWon(tiles: Tile[]): boolean {
  return tiles.some((t) => t.value >= 2048);
}

function makeFreshTiles(seed: number): { tiles: Tile[]; seed: number } {
  nextTileId = 1;
  let currentSeed = seed;
  let tiles: Tile[] = [];
  const first = spawnTile(tiles, currentSeed);
  tiles = first.tiles;
  currentSeed = first.seed;
  const second = spawnTile(tiles, currentSeed);
  return { tiles: second.tiles, seed: second.seed };
}

function restartState(seed: number): Pick<GameState, 'phase' | 'score' | 'tiles' | 'rngSeed' | 'animPhase' | 'animProgress' | 'wonAcknowledged'> {
  const fresh = makeFreshTiles(seed);
  return {
    phase: 'playing',
    score: 0,
    tiles: fresh.tiles,
    rngSeed: fresh.seed,
    animPhase: 'idle',
    animProgress: 1,
    wonAcknowledged: false,
  };
}

function checkEndState(draft: GameState): void {
  if (!draft.wonAcknowledged && hasWon(draft.tiles)) {
    draft.phase = 'won';
    return;
  }
  if (!hasMoves(draft.tiles)) {
    draft.phase = 'lost';
  }
}

function finalizeAnimation(draft: GameState): void {
  draft.tiles = draft.tiles
    .filter((t) => !t.willRemove)
    .map((t) => {
      syncTilePositions(t);
      return t;
    });

  const beforeCount = draft.tiles.length;
  const spawned = spawnTile(draft.tiles, draft.rngSeed);
  draft.tiles = spawned.tiles;
  draft.rngSeed = spawned.seed;

  if (spawned.tiles.length > beforeCount) {
    draft.animPhase = 'spawn';
    draft.animProgress = 0;
    return;
  }

  draft.animPhase = 'idle';
  draft.animProgress = 1;
  checkEndState(draft);
}

function tryMove(draft: GameState, direction: Direction): void {
  if (draft.phase === 'ready') draft.phase = 'playing';
  if (draft.phase === 'lost' || draft.animPhase !== 'idle') return;

  const result = moveTiles(draft.tiles, direction);
  if (!result.moved) return;

  draft.tiles = result.tiles;
  draft.score += result.scoreGain;
  draft.best = Math.max(draft.best, draft.score);
  draft.animPhase = 'slide';
  draft.animProgress = 0;
}

function tileDisplayPos(tile: Tile, progress: number): { x: number; y: number } {
  const t = easeOutCubic(Math.min(1, Math.max(0, progress)));
  const row = tile.fromRow + (tile.toRow - tile.fromRow) * t;
  const col = tile.fromCol + (tile.toCol - tile.fromCol) * t;
  return { x: cellX(col), y: cellY(row) };
}

function tileScale(tile: Tile, animPhase: GameState['animPhase'], progress: number): number {
  if (tile.isNew && animPhase === 'spawn') return 0.55 + 0.45 * easeOutCubic(progress);
  if (tile.willRemove && animPhase === 'slide') return 1 - 0.35 * easeOutCubic(progress);
  return 1;
}

const initial = makeFreshTiles(2048);

const { store, commitChange, storeHistory } = createGameStore<GameState>(
  {
    phase: 'ready',
    score: 0,
    best: 0,
    tiles: initial.tiles,
    rngSeed: initial.seed,
    animPhase: 'idle',
    animProgress: 1,
    swipeStart: null,
    wonAcknowledged: false,
  },
  { enableHistory: true },
);

function handleDirection(direction: Direction): void {
  commitChange(`move:${direction}`, (draft) => {
    tryMove(draft, direction);
  });
}

function Game() {
  useFrame((frame) => {
    const dt = Math.min(frame.deltaSeconds, 0.05);
    if (store.animPhase === 'idle') return;

    commitChange('anim', (draft) => {
      if (draft.animPhase === 'idle') return;
      const duration = draft.animPhase === 'slide' ? SLIDE_DURATION : SPAWN_DURATION;
      draft.animProgress += dt / duration;
      if (draft.animProgress < 1) return;

      if (draft.animPhase === 'slide') {
        finalizeAnimation(draft);
        return;
      }

      draft.tiles.forEach(syncTilePositions);
      draft.animPhase = 'idle';
      draft.animProgress = 1;
      checkEndState(draft);
    });
  });

  const overlayAlpha =
    store.phase === 'ready' ? 0.55 : store.phase === 'won' || store.phase === 'lost' ? 0.72 : 0;

  return (
    <scene
      id="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#faf8ef"
      clickable
      onClick={() => {
        commitChange('tap', (draft) => {
          if (draft.phase === 'ready') draft.phase = 'playing';
          if (draft.phase === 'lost') Object.assign(draft, restartState(draft.rngSeed));
        });
      }}
      onKeyDown={(e) => {
        const code = e.detail?.code;
        if (code === 'ArrowUp') handleDirection('up');
        if (code === 'ArrowDown') handleDirection('down');
        if (code === 'ArrowLeft') handleDirection('left');
        if (code === 'ArrowRight') handleDirection('right');
        if (code === 'KeyR') {
          commitChange('restart', (draft) => {
            Object.assign(draft, restartState(draft.rngSeed + 1));
          });
        }
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
          const threshold = 24;
          if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
          const dir: Direction =
            Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
          tryMove(draft, dir);
        });
      }}
    >
      <text x={24} y={28} width={200} height={36} text="2048" textSize="34" textColor="#776e65" />
      <text
        x={24}
        y={68}
        width={240}
        height={22}
        text="方向键 / 滑动移动"
        textSize="14"
        textColor="#8f7a66"
      />

      <node x={BOARD_X + BOARD_W - 168} y={24} width={76} height={56} shape="roundedRect(6 6 6 6)" backgroundColor="#bbada0">
        <text x={0} y={8} width={76} height={16} text="分数" textAlign="center" textSize="12" textColor="#eee4da" />
        <text
          x={0}
          y={26}
          width={76}
          height={24}
          text={`${store.score}`}
          textAlign="center"
          textSize="20"
          textColor="#ffffff"
        />
      </node>

      <node x={BOARD_X + BOARD_W - 84} y={24} width={76} height={56} shape="roundedRect(6 6 6 6)" backgroundColor="#bbada0">
        <text x={0} y={8} width={76} height={16} text="最高" textAlign="center" textSize="12" textColor="#eee4da" />
        <text
          x={0}
          y={26}
          width={76}
          height={24}
          text={`${store.best}`}
          textAlign="center"
          textSize="20"
          textColor="#ffffff"
        />
      </node>

      <node
        x={BOARD_X}
        y={BOARD_Y}
        width={BOARD_W}
        height={BOARD_W}
        shape="roundedRect(8 8 8 8)"
        backgroundColor="#bbada0"
      />

      {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
        const row = Math.floor(i / GRID_SIZE);
        const col = i % GRID_SIZE;
        return (
          <node
            x={cellX(col)}
            y={cellY(row)}
            width={CELL}
            height={CELL}
            shape="roundedRect(6 6 6 6)"
            backgroundColor="#cdc1b4"
          />
        );
      })}

      {store.tiles.map((tile) => {
        const progress = store.animPhase === 'slide' ? store.animProgress : 1;
        const pos = tileDisplayPos(tile, progress);
        const scale = tileScale(tile, store.animPhase, store.animPhase === 'spawn' && tile.isNew ? store.animProgress : progress);
        const size = CELL * scale;
        const offset = (CELL - size) / 2;
        const colors = tileColor(tile.value);
        const fontSize = tile.value >= 1000 ? 24 : tile.value >= 100 ? 28 : 32;

        return (
          <group x={pos.x + offset} y={pos.y + offset} width={size} height={size} zIndex={tile.willRemove ? 1 : 2}>
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
              text={`${tile.value}`}
              textAlign="center"
              textSize={`${fontSize}`}
              textColor={colors.fg}
            />
          </group>
        );
      })}

      {overlayAlpha > 0 ? (
        <group x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} zIndex={10}>
          <node x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} backgroundColor="#faf8ef" alpha={overlayAlpha} />
          <text
            x={0}
            y={store.phase === 'ready' ? 210 : 190}
            width={SCENE_WIDTH}
            height={40}
            text={store.phase === 'ready' ? '点击开始' : store.phase === 'won' ? '你赢了！' : '游戏结束'}
            textAlign="center"
            textSize="32"
            textColor="#776e65"
          />
          <text
            x={0}
            y={store.phase === 'ready' ? 252 : 236}
            width={SCENE_WIDTH}
            height={24}
            text={
              store.phase === 'ready'
                ? '合并方块，达成 2048'
                : store.phase === 'won'
                  ? '点击继续挑战'
                  : '点击重新开始'
            }
            textAlign="center"
            textSize="16"
            textColor="#8f7a66"
          />
          {store.phase === 'won' ? (
            <group
              x={(SCENE_WIDTH - 140) / 2}
              y={280}
              width={140}
              height={44}
              clickable
              onClick={() => {
                commitChange('continue', (draft) => {
                  draft.wonAcknowledged = true;
                  draft.phase = 'playing';
                });
              }}
            >
              <node x={0} y={0} width={140} height={44} shape="roundedRect(8 8 8 8)" backgroundColor="#8f7a66" />
              <text x={0} y={12} width={140} height={22} text="继续" textAlign="center" textSize="18" textColor="#f9f6f2" />
            </group>
          ) : null}
        </group>
      ) : null}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
