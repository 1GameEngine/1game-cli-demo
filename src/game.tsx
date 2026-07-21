import { For, Index, Show } from 'solid-js';
import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'left' | 'right' | 'up' | 'down';
type AnimPhase = 'idle' | 'slide' | 'spawn';
type GamePhase = 'ready' | 'playing' | 'won' | 'lost';

type Tile = {
  id: string;
  value: number;
  row: number;
  col: number;
};

type DisplayTile = {
  slotId: string;
  active: boolean;
  tileId: string;
  value: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  role: 'alive' | 'merge-source' | 'merge-result' | 'spawn';
  x: number;
  y: number;
  size: number;
  visible: boolean;
};

type AnimState = {
  phase: AnimPhase;
  elapsedMs: number;
  durationMs: number;
};

type GameState = {
  phase: GamePhase;
  score: number;
  best: number;
  keepPlaying: boolean;
  nextId: number;
  tiles: Tile[];
  pendingTiles: Tile[];
  displayTiles: DisplayTile[];
  anim: AnimState;
  swipeStart: { x: number; y: number } | null;
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const GRID_SIZE = 4;
const CELL = 72;
const GAP = 10;
const BOARD_PAD = 12;
const BOARD_SIZE = BOARD_PAD * 2 + GRID_SIZE * CELL + (GRID_SIZE - 1) * GAP;
const BOARD_X = Math.round((SCENE_WIDTH - BOARD_SIZE) / 2);
const BOARD_Y = 168;
const SLIDE_MS = 140;
const SPAWN_MS = 90;
const DISPLAY_SLOT_COUNT = 32;

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
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function cellOrigin(row: number, col: number): { x: number; y: number } {
  return {
    x: BOARD_X + BOARD_PAD + col * (CELL + GAP),
    y: BOARD_Y + BOARD_PAD + row * (CELL + GAP),
  };
}

function emptyCells(tiles: Tile[]): Array<{ row: number; col: number }> {
  const occupied = new Set(tiles.map((t) => `${t.row},${t.col}`));
  const cells: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (!occupied.has(`${row},${col}`)) cells.push({ row, col });
    }
  }
  return cells;
}

function allocId(draft: { nextId: number }): string {
  draft.nextId += 1;
  return `t${draft.nextId}`;
}

function spawnRandomTile(draft: GameState): Tile | null {
  const cells = emptyCells(draft.tiles);
  if (cells.length === 0) return null;
  const pick = cells[Math.floor(Math.random() * cells.length)]!;
  const value = Math.random() < 0.9 ? 2 : 4;
  const tile: Tile = { id: allocId(draft), value, row: pick.row, col: pick.col };
  draft.tiles.push(tile);
  return tile;
}

function makeEmptySlot(index: number): DisplayTile {
  return {
    slotId: `slot-${index}`,
    active: false,
    tileId: '',
    value: 0,
    fromRow: 0,
    fromCol: 0,
    toRow: 0,
    toCol: 0,
    role: 'alive',
    x: -1000,
    y: -1000,
    size: CELL,
    visible: false,
  };
}

function makeDisplaySlots(): DisplayTile[] {
  return Array.from({ length: DISPLAY_SLOT_COUNT }, (_, i) => makeEmptySlot(i));
}

type DisplaySpec = {
  tileId: string;
  value: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  role: DisplayTile['role'];
};

function paintDisplayTile(tile: DisplayTile, phase: AnimPhase, progress: number): void {
  if (!tile.active) {
    tile.x = -1000;
    tile.y = -1000;
    tile.size = CELL;
    tile.visible = false;
    return;
  }

  const moving = phase === 'slide';
  const spawning = phase === 'spawn' && tile.role === 'spawn';
  const row = moving ? lerp(tile.fromRow, tile.toRow, progress) : tile.toRow;
  const col = moving ? lerp(tile.fromCol, tile.toCol, progress) : tile.toCol;
  const origin = cellOrigin(row, col);

  let scale = 1;
  if (spawning) scale = Math.max(0.01, easeOutBack(progress));
  if (moving && tile.role === 'merge-source') scale = lerp(1, 0.88, progress);

  // Only hide the newly created merge result until sources finish sliding in.
  let visible = true;
  if (moving && tile.role === 'merge-result' && progress < 0.85) {
    visible = false;
  }

  const size = CELL * scale;
  tile.x = visible ? origin.x + (CELL - size) / 2 : -1000;
  tile.y = visible ? origin.y + (CELL - size) / 2 : -1000;
  tile.size = size;
  tile.visible = visible;
}

function syncDisplayLayout(draft: GameState): void {
  const normalized =
    draft.anim.phase === 'idle' ? 1 : clamp01(draft.anim.elapsedMs / Math.max(1, draft.anim.durationMs));
  const progress = draft.anim.phase === 'slide' ? easeOutCubic(normalized) : clamp01(normalized);
  for (const tile of draft.displayTiles) {
    paintDisplayTile(tile, draft.anim.phase, progress);
  }
}

function writeDisplaySpecs(draft: GameState, specs: DisplaySpec[]): void {
  // Fixed-length slot pool: For/Index keep stable keys; only mutate slot fields.
  for (let i = 0; i < DISPLAY_SLOT_COUNT; i += 1) {
    const slot = draft.displayTiles[i]!;
    const spec = specs[i];
    if (!spec) {
      slot.active = false;
      slot.tileId = '';
      slot.value = 0;
      slot.visible = false;
      slot.x = -1000;
      slot.y = -1000;
      continue;
    }
    slot.active = true;
    slot.tileId = spec.tileId;
    slot.value = spec.value;
    slot.fromRow = spec.fromRow;
    slot.fromCol = spec.fromCol;
    slot.toRow = spec.toRow;
    slot.toCol = spec.toCol;
    slot.role = spec.role;
  }
  syncDisplayLayout(draft);
}

function tilesToSpecs(tiles: Tile[], role: DisplayTile['role'] = 'alive'): DisplaySpec[] {
  return tiles.map((tile) => ({
    tileId: tile.id,
    value: tile.value,
    fromRow: tile.row,
    fromCol: tile.col,
    toRow: tile.row,
    toCol: tile.col,
    role,
  }));
}

function canMoveAny(tiles: Tile[]): boolean {
  if (emptyCells(tiles).length > 0) return true;
  const at = (r: number, c: number) => tiles.find((t) => t.row === r && t.col === c);
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const cur = at(row, col);
      if (!cur) continue;
      const right = at(row, col + 1);
      const down = at(row + 1, col);
      if (right && right.value === cur.value) return true;
      if (down && down.value === cur.value) return true;
    }
  }
  return false;
}

function has2048(tiles: Tile[]): boolean {
  return tiles.some((t) => t.value >= 2048);
}

type MovePlan = {
  changed: boolean;
  scoreGain: number;
  nextTiles: Tile[];
  specs: DisplaySpec[];
  nextId: number;
};

function planMove(tiles: Tile[], direction: Direction, nextIdStart: number): MovePlan {
  let nextId = nextIdStart;
  const alloc = () => {
    nextId += 1;
    return `t${nextId}`;
  };

  const byPos = new Map<string, Tile>();
  for (const tile of tiles) byPos.set(`${tile.row},${tile.col}`, tile);

  const traverse =
    direction === 'left' || direction === 'right'
      ? Array.from({ length: GRID_SIZE }, (_, row) =>
          Array.from({ length: GRID_SIZE }, (_, i) => {
            const col = direction === 'left' ? i : GRID_SIZE - 1 - i;
            return { row, col };
          }),
        )
      : Array.from({ length: GRID_SIZE }, (_, col) =>
          Array.from({ length: GRID_SIZE }, (_, i) => {
            const row = direction === 'up' ? i : GRID_SIZE - 1 - i;
            return { row, col };
          }),
        );

  const specs: DisplaySpec[] = [];
  const nextTiles: Tile[] = [];
  let scoreGain = 0;
  let changed = false;

  for (const line of traverse) {
    const lineTiles: Tile[] = [];
    for (const pos of line) {
      const tile = byPos.get(`${pos.row},${pos.col}`);
      if (tile) lineTiles.push(tile);
    }

    type Built = {
      result: Tile;
      fromA: Tile;
      fromB?: Tile;
    };
    const built: Built[] = [];

    for (const tile of lineTiles) {
      const last = built[built.length - 1];
      if (last && !last.fromB && last.result.value === tile.value) {
        const mergedValue = tile.value * 2;
        last.result = {
          id: alloc(),
          value: mergedValue,
          row: last.result.row,
          col: last.result.col,
        };
        last.fromB = tile;
        scoreGain += mergedValue;
      } else {
        const target = line[built.length]!;
        built.push({
          result: { id: tile.id, value: tile.value, row: target.row, col: target.col },
          fromA: tile,
        });
      }
    }

    for (let i = 0; i < built.length; i += 1) {
      const item = built[i]!;
      const target = line[i]!;
      item.result.row = target.row;
      item.result.col = target.col;

      if (item.fromA.row !== target.row || item.fromA.col !== target.col || item.fromB) {
        changed = true;
      }

      if (item.fromB) {
        specs.push({
          tileId: item.fromA.id,
          value: item.fromA.value,
          fromRow: item.fromA.row,
          fromCol: item.fromA.col,
          toRow: target.row,
          toCol: target.col,
          role: 'merge-source',
        });
        specs.push({
          tileId: item.fromB.id,
          value: item.fromB.value,
          fromRow: item.fromB.row,
          fromCol: item.fromB.col,
          toRow: target.row,
          toCol: target.col,
          role: 'merge-source',
        });
        specs.push({
          tileId: item.result.id,
          value: item.result.value,
          fromRow: target.row,
          fromCol: target.col,
          toRow: target.row,
          toCol: target.col,
          role: 'merge-result',
        });
      } else {
        specs.push({
          tileId: item.result.id,
          value: item.result.value,
          fromRow: item.fromA.row,
          fromCol: item.fromA.col,
          toRow: target.row,
          toCol: target.col,
          role: 'alive',
        });
      }

      nextTiles.push(item.result);
    }
  }

  return { changed, scoreGain, nextTiles, specs, nextId };
}

function applyMove(draft: GameState, direction: Direction): boolean {
  if (draft.phase === 'lost') return false;
  if (draft.anim.phase !== 'idle') return false;
  if (draft.phase === 'won' && !draft.keepPlaying) return false;

  const plan = planMove(draft.tiles, direction, draft.nextId);
  if (!plan.changed) return false;

  draft.nextId = plan.nextId;
  draft.score += plan.scoreGain;
  if (draft.score > draft.best) draft.best = draft.score;
  draft.pendingTiles = plan.nextTiles.map((t) => ({ ...t }));
  draft.anim.phase = 'slide';
  draft.anim.elapsedMs = 0;
  draft.anim.durationMs = SLIDE_MS;
  if (draft.phase === 'ready') draft.phase = 'playing';
  writeDisplaySpecs(draft, plan.specs);
  return true;
}

function makeInitialState(best = 0): GameState {
  const state: GameState = {
    phase: 'ready',
    score: 0,
    best,
    keepPlaying: false,
    nextId: 0,
    tiles: [],
    pendingTiles: [],
    displayTiles: makeDisplaySlots(),
    anim: { phase: 'idle', elapsedMs: 0, durationMs: SLIDE_MS },
    swipeStart: null,
  };
  spawnRandomTile(state);
  spawnRandomTile(state);
  state.pendingTiles = state.tiles.map((t) => ({ ...t }));
  writeDisplaySpecs(state, tilesToSpecs(state.tiles));
  return state;
}

const { store, commitChange, bindStore } = createGameStore<GameState>(makeInitialState());

function beginMove(direction: Direction): void {
  commitChange(`移动:${direction}`, (draft) => {
    applyMove(draft, direction);
  });
}

function finalizeSlide(draft: GameState): void {
  draft.tiles = draft.pendingTiles.map((t) => ({ ...t }));

  if (has2048(draft.tiles) && draft.phase === 'playing' && !draft.keepPlaying) {
    draft.phase = 'won';
  }

  const spawned = spawnRandomTile(draft);
  const specs = [
    ...tilesToSpecs(draft.tiles.filter((t) => !spawned || t.id !== spawned.id)),
    ...(spawned
      ? [
          {
            tileId: spawned.id,
            value: spawned.value,
            fromRow: spawned.row,
            fromCol: spawned.col,
            toRow: spawned.row,
            toCol: spawned.col,
            role: 'spawn' as const,
          },
        ]
      : []),
  ];

  if (spawned) {
    draft.anim.phase = 'spawn';
    draft.anim.elapsedMs = 0;
    draft.anim.durationMs = SPAWN_MS;
  } else {
    draft.anim.phase = 'idle';
    draft.anim.elapsedMs = 0;
    if (!canMoveAny(draft.tiles) && draft.phase !== 'won') draft.phase = 'lost';
  }
  writeDisplaySpecs(draft, specs);
}

function finalizeSpawn(draft: GameState): void {
  draft.anim.phase = 'idle';
  draft.anim.elapsedMs = 0;
  if (!canMoveAny(draft.tiles)) {
    if (draft.phase === 'playing' || (draft.phase === 'won' && draft.keepPlaying)) {
      draft.phase = 'lost';
    }
  }
  writeDisplaySpecs(draft, tilesToSpecs(draft.tiles));
}

function restartGame(): void {
  commitChange('重开', (draft) => {
    const best = draft.best;
    const next = makeInitialState(best);
    draft.phase = next.phase;
    draft.score = next.score;
    draft.best = next.best;
    draft.keepPlaying = next.keepPlaying;
    draft.nextId = next.nextId;
    draft.tiles = next.tiles;
    draft.pendingTiles = next.pendingTiles;
    draft.anim.phase = next.anim.phase;
    draft.anim.elapsedMs = next.anim.elapsedMs;
    draft.anim.durationMs = next.anim.durationMs;
    draft.swipeStart = null;
    writeDisplaySpecs(draft, tilesToSpecs(next.tiles));
  });
}

function HudBox(props: { stableKey: string; x: number; label: string; value: string }) {
  return (
    <group key={props.stableKey} x={props.x} y={72} width={100} height={56}>
      <node x={0} y={0} width={100} height={56} shape="roundedRect(8 8 8 8)" backgroundColor="#bbada0" />
      <text x={0} y={6} width={100} height={16} text={props.label} textAlign="center" textVerticalAlign="middle" textColor="#eee4da" textSize="12" />
      <text x={0} y={24} width={100} height={28} text={props.value} textAlign="center" textVerticalAlign="middle" textColor="#ffffff" textSize="20" />
    </group>
  );
}

function ActionButton(props: {
  stableKey: string;
  x: number;
  y: number;
  width: number;
  label: string;
  onPress: () => void;
}) {
  return (
    <group
      key={props.stableKey}
      x={props.x}
      y={props.y}
      width={props.width}
      height={40}
      clickable
      onClick={props.onPress}
    >
      <node x={0} y={0} width={props.width} height={40} shape="roundedRect(8 8 8 8)" backgroundColor="#8f7a66" />
      <text x={0} y={10} width={props.width} height={20} text={props.label} textAlign="center" textColor="#f9f6f2" textSize="14" />
    </group>
  );
}

function BoardCell(props: { row: number; col: number }) {
  const origin = cellOrigin(props.row, props.col);
  return (
    <node
      key={`cell-${props.row}-${props.col}`}
      x={origin.x}
      y={origin.y}
      width={CELL}
      height={CELL}
      shape="roundedRect(6 6 6 6)"
      backgroundColor="#cdc1b4"
    />
  );
}

function Overlay(props: { title: string; subtitle: string; showKeepPlaying?: boolean }) {
  return (
    <group key="overlay" x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT}>
      <node x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} backgroundColor="#00000088" />
      <text x={0} y={250} width={SCENE_WIDTH} height={36} text={props.title} textAlign="center" textColor="#f9f6f2" textSize="32" />
      <text x={24} y={296} width={SCENE_WIDTH - 48} height={40} text={props.subtitle} textAlign="center" textColor="#eee4da" textSize="14" />
      <ActionButton stableKey="overlay-restart" x={BOARD_X} y={360} width={BOARD_SIZE} label="再来一局" onPress={restartGame} />
      <Show when={props.showKeepPlaying}>
        <ActionButton
          stableKey="overlay-keep"
          x={BOARD_X}
          y={412}
          width={BOARD_SIZE}
          label="继续挑战"
          onPress={() => {
            commitChange('继续挑战', (draft) => {
              draft.keepPlaying = true;
              draft.phase = 'playing';
            });
          }}
        />
      </Show>
    </group>
  );
}

function Game() {
  useFrame((frame) => {
    const dtMs = Math.min(frame.deltaSeconds, 0.05) * 1000;
    commitChange('anim:tick', (draft) => {
      if (draft.anim.phase === 'idle') return;
      draft.anim.elapsedMs += dtMs;
      if (draft.anim.elapsedMs >= draft.anim.durationMs) {
        if (draft.anim.phase === 'slide') finalizeSlide(draft);
        else if (draft.anim.phase === 'spawn') finalizeSpawn(draft);
        return;
      }
      syncDisplayLayout(draft);
    });
  });

  return (
    <scene
      name="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#faf8ef"
      onKeyDown={(event) => {
        const code = event.detail?.code;
        if (code === 'ArrowLeft') beginMove('left');
        if (code === 'ArrowRight') beginMove('right');
        if (code === 'ArrowUp') beginMove('up');
        if (code === 'ArrowDown') beginMove('down');
        if (code === 'KeyR') restartGame();
      }}
    >
      <node x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} backgroundColor="#faf8ef" />

      <text x={BOARD_X} y={28} width={160} height={40} text="2048" textColor="#776e65" textSize="40" />
      <HudBox stableKey="hud-score" x={BOARD_X + BOARD_SIZE - 210} label="SCORE" value={`${store.score}`} />
      <HudBox stableKey="hud-best" x={BOARD_X + BOARD_SIZE - 100} label="BEST" value={`${store.best}`} />

      <text
        x={BOARD_X}
        y={136}
        width={BOARD_SIZE}
        height={20}
        text={
          store.phase === 'ready'
            ? '滑动或方向键开始'
            : store.phase === 'won'
              ? '达到 2048！'
              : store.phase === 'lost'
                ? '没有可移动的格子了'
                : '合并数字，冲向 2048'
        }
        textColor="#776e65"
        textSize="14"
      />

      <node
        x={BOARD_X}
        y={BOARD_Y}
        width={BOARD_SIZE}
        height={BOARD_SIZE}
        shape="roundedRect(12 12 12 12)"
        backgroundColor="#bbada0"
        clickable
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
            const threshold = 24;
            if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
            const direction: Direction =
              Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
            applyMove(draft, direction);
          });
        }}
      />

      <Index each={[0, 1, 2, 3]}>
        {(_, row) => (
          <Index each={[0, 1, 2, 3]}>{(_, col) => <BoardCell row={row} col={col} />}</Index>
        )}
      </Index>

      <For each={store.displayTiles}>
        {(tile) => (
          <group key={tile.slotId} x={tile.x} y={tile.y} width={tile.size} height={tile.size}>
            <node
              x={0}
              y={0}
              width={tile.size}
              height={tile.size}
              shape="roundedRect(6 6 6 6)"
              backgroundColor={tile.active ? tileStyle(tile.value).bg : '#00000000'}
            />
            <text
              x={0}
              y={-2}
              width={tile.size}
              height={tile.size}
              text={tile.active && tile.visible ? `${tile.value}` : ''}
              textAlign="center"
              textVerticalAlign="middle"
              monospaced={false}
              textColor={tile.active ? tileStyle(tile.value).fg : '#00000000'}
              textSize={`${tile.value >= 1024 ? 24 : tile.value >= 128 ? 28 : 32}`}
            />
          </group>
        )}
      </For>

      <ActionButton
        stableKey="btn-new"
        x={BOARD_X}
        y={BOARD_Y + BOARD_SIZE + 24}
        width={BOARD_SIZE}
        label="新游戏 (R)"
        onPress={restartGame}
      />

      <text
        x={0}
        y={SCENE_HEIGHT - 36}
        width={SCENE_WIDTH}
        height={20}
        text="方向键 / 滑动操作"
        textAlign="center"
        textColor="#a09080"
        textSize="12"
      />

      <Show when={store.phase === 'won' && !store.keepPlaying}>
        <Overlay title="你赢了！" subtitle="已经合成 2048，还可以继续挑战更高分" showKeepPlaying />
      </Show>
      <Show when={store.phase === 'lost'}>
        <Overlay title="游戏结束" subtitle={`本局得分 ${store.score}`} />
      </Show>
    </scene>
  );
}

renderGame(() => <Game />, { bindStore });
