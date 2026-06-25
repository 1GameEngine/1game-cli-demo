import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type TileRow = {
  id: string;
  y: number;
  blackCol: number;
  tapped: boolean;
};

type GameState = {
  phase: 'ready' | 'playing' | 'lost';
  score: number;
  bestScore: number;
  rows: TileRow[];
  scrollSpeed: number;
  timeMs: number;
  rowCounter: number;
  rngSeed: number;
  spawnAccumulator: number;
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const COLS = 4;
const GRID_PADDING = 8;
const GRID_TOP = 100;
const GRID_BOTTOM = SCENE_HEIGHT - 24;
const GRID_HEIGHT = GRID_BOTTOM - GRID_TOP;
const TILE_WIDTH = Math.floor((SCENE_WIDTH - GRID_PADDING * 2) / COLS);
const TILE_HEIGHT = 90;
const TILE_GAP = 2;
const SPAWN_INTERVAL = TILE_HEIGHT + TILE_GAP;
const INITIAL_SPEED = 180;
const TAP_ZONE_Y = GRID_BOTTOM - TILE_HEIGHT;

function nextRandom(seed: number): { value: number; seed: number } {
  const newSeed = (seed * 1664525 + 1013904223) >>> 0;
  return { value: newSeed / 0x100000000, seed: newSeed };
}

function pickBlackCol(seed: number): { col: number; seed: number } {
  const result = nextRandom(seed);
  return { col: Math.floor(result.value * COLS), seed: result.seed };
}

function makeInitialState(bestScore = 0): GameState {
  return {
    phase: 'ready',
    score: 0,
    bestScore,
    rows: [],
    scrollSpeed: INITIAL_SPEED,
    timeMs: 0,
    rowCounter: 0,
    rngSeed: 42,
    spawnAccumulator: 0,
  };
}

const { store, commitChange, storeHistory } = createGameStore<GameState>(makeInitialState(), {
  enableHistory: true,
});

function tileX(col: number): number {
  return GRID_PADDING + col * TILE_WIDTH;
}

function spawnRow(draft: GameState, y: number): void {
  const picked = pickBlackCol(draft.rngSeed);
  draft.rngSeed = picked.seed;
  draft.rowCounter += 1;
  draft.rows.push({
    id: `row-${draft.rowCounter}`,
    y,
    blackCol: picked.col,
    tapped: false,
  });
}

function startPlaying(draft: GameState): void {
  if (draft.phase === 'playing') return;
  const best = Math.max(draft.bestScore, draft.score);
  Object.assign(draft, makeInitialState(best));
  draft.phase = 'playing';
  spawnRow(draft, GRID_TOP);
  spawnRow(draft, GRID_TOP - SPAWN_INTERVAL);
  spawnRow(draft, GRID_TOP - SPAWN_INTERVAL * 2);
}

function restartGame(draft: GameState): void {
  const best = Math.max(draft.bestScore, draft.score);
  Object.assign(draft, makeInitialState(best));
}

function handleTileTap(col: number, rowId: string): void {
  commitChange('点击方块', (draft) => {
    if (draft.phase !== 'playing') return;

    const row = draft.rows.find((r) => r.id === rowId);
    if (!row || row.tapped) return;

    row.tapped = true;

    if (row.blackCol !== col) {
      draft.phase = 'lost';
      draft.bestScore = Math.max(draft.bestScore, draft.score);
      return;
    }

    draft.score += 1;
    if (draft.score % 5 === 0) {
      draft.scrollSpeed = Math.min(520, draft.scrollSpeed * 1.08);
    }
  });
}

function tickGame(draft: GameState, dt: number): void {
  if (draft.phase !== 'playing') return;

  draft.timeMs += dt * 1000;
  const dy = draft.scrollSpeed * dt;

  for (const row of draft.rows) {
    row.y += dy;
  }

  draft.spawnAccumulator += dy;
  while (draft.spawnAccumulator >= SPAWN_INTERVAL) {
    draft.spawnAccumulator -= SPAWN_INTERVAL;
    const topY = draft.rows.length > 0 ? Math.min(...draft.rows.map((r) => r.y)) : GRID_TOP;
    spawnRow(draft, topY - SPAWN_INTERVAL);
  }

  for (const row of draft.rows) {
    if (!row.tapped && row.y > TAP_ZONE_Y + TILE_HEIGHT) {
      draft.phase = 'lost';
      draft.bestScore = Math.max(draft.bestScore, draft.score);
      break;
    }
  }

  draft.rows = draft.rows.filter((row) => row.y < GRID_BOTTOM + TILE_HEIGHT);
}

function phaseTitle(phase: GameState['phase']): string {
  if (phase === 'ready') return '别踩白块';
  if (phase === 'playing') return `得分 ${store.score}`;
  return '游戏结束';
}

function phaseHint(phase: GameState['phase']): string {
  if (phase === 'ready') return '点击黑块开始，千万别点白块！';
  if (phase === 'playing') return '只点黑色方块';
  return `得分 ${store.score} · 最高 ${store.bestScore} · 点击重开`;
}

function Game() {
  useFrame((frame) => {
    const dt = Math.min(frame.deltaSeconds, 0.05);
    commitChange('逻辑帧', (draft) => tickGame(draft, dt));
  });

  return (
    <scene
      name="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#0b1220"
    >
      <text
        x={0}
        y={28}
        width={SCENE_WIDTH}
        height={36}
        text={phaseTitle(store.phase)}
        textAlign="center"
        textColor="#f8fafc"
        textSize="28"
      />

      <text
        x={16}
        y={64}
        width={SCENE_WIDTH - 32}
        height={24}
        text={phaseHint(store.phase)}
        textAlign="center"
        textColor="#94a3b8"
        textSize="16"
      />

      <node
        x={GRID_PADDING}
        y={GRID_TOP}
        width={SCENE_WIDTH - GRID_PADDING * 2}
        height={GRID_HEIGHT}
        shape="roundedRect(12 12 12 12)"
        backgroundColor="#111827"
        border="solid"
        borderWidth={2}
        borderColor="#1f2937"
      />

      {store.phase === 'playing' && (
        <node
          x={GRID_PADDING}
          y={TAP_ZONE_Y}
          width={SCENE_WIDTH - GRID_PADDING * 2}
          height={TILE_HEIGHT}
          backgroundColor="#1e3a5f33"
          border="solid"
          borderWidth={1}
          borderColor="#38bdf866"
        />
      )}

      {store.rows.map((row) =>
        Array.from({ length: COLS }, (_, col) => {
          const isBlack = col === row.blackCol;
          const innerW = TILE_WIDTH - TILE_GAP * 2;
          const innerH = TILE_HEIGHT - TILE_GAP * 2;
          const x = tileX(col) + TILE_GAP;
          const y = row.y + TILE_GAP;
          const tapped = row.tapped && isBlack;

          return (
            <group
              key={`${row.id}-${col}`}
              x={x}
              y={y}
              width={innerW}
              height={innerH}
              clickable={store.phase === 'playing'}
              onClick={() => handleTileTap(col, row.id)}
            >
              <node
                x={0}
                y={0}
                width={innerW}
                height={innerH}
                shape="roundedRect(6 6 6 6)"
                backgroundColor={
                  tapped ? '#22c55e' : isBlack ? '#0f172a' : '#f1f5f9'
                }
                border="solid"
                borderWidth={isBlack ? 0 : 1}
                borderColor="#cbd5e1"
              />
            </group>
          );
        }),
      )}

      {store.phase === 'playing' && (
        <text
          x={SCENE_WIDTH - 80}
          y={12}
          width={64}
          height={20}
          text={`最高 ${store.bestScore}`}
          textAlign="right"
          textColor="#64748b"
          textSize="14"
        />
      )}

      {store.phase !== 'playing' && (
        <group
          x={48}
          y={GRID_BOTTOM - 120}
          width={SCENE_WIDTH - 96}
          height={56}
          clickable
          onClick={() => {
            commitChange(store.phase === 'ready' ? '开始游戏' : '重开游戏', (draft) => {
              if (draft.phase === 'ready') startPlaying(draft);
              else if (draft.phase === 'lost') restartGame(draft);
            });
          }}
        >
          <node
            x={0}
            y={0}
            width={SCENE_WIDTH - 96}
            height={56}
            shape="roundedRect(14 14 14 14)"
            backgroundColor={store.phase === 'ready' ? '#2563eb' : '#dc2626'}
          />
          <text
            x={0}
            y={14}
            width={SCENE_WIDTH - 96}
            height={28}
            text={store.phase === 'ready' ? '开始游戏' : '再来一局'}
            textAlign="center"
            textColor="#ffffff"
            textSize="22"
          />
        </group>
      )}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
