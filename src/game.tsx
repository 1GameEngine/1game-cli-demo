import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type TileRow = {
  id: number;
  y: number;
  blackCol: number;
  tapped: boolean;
};

type GameState = {
  phase: 'ready' | 'playing' | 'lost';
  score: number;
  speed: number;
  nextRowId: number;
  rows: TileRow[];
  rng: number;
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const COLS = 4;
const COL_WIDTH = SCENE_WIDTH / COLS;
const ROW_HEIGHT = 100;
const GAP = 2;
const TILE_SIZE = COL_WIDTH - GAP * 2;
const INITIAL_SPEED = 180;
const SPEED_INCREMENT = 4;
const MAX_SPEED = 520;
const VISIBLE_ROWS = Math.ceil(SCENE_HEIGHT / ROW_HEIGHT) + 2;

function nextRandom(seed: number): { value: number; seed: number } {
  const newSeed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return { value: newSeed / 0x7fffffff, seed: newSeed };
}

function makeRow(draft: GameState, y: number): TileRow {
  const roll = nextRandom(draft.rng);
  draft.rng = roll.seed;
  const blackCol = Math.floor(roll.value * COLS);
  const row: TileRow = {
    id: draft.nextRowId,
    y,
    blackCol,
    tapped: false,
  };
  draft.nextRowId += 1;
  return row;
}

function fillInitialRows(draft: GameState): void {
  draft.rows = [];
  for (let i = 0; i < VISIBLE_ROWS; i += 1) {
    draft.rows.push(makeRow(draft, i * ROW_HEIGHT));
  }
}

function makeInitialState(): GameState {
  const state: GameState = {
    phase: 'ready',
    score: 0,
    speed: INITIAL_SPEED,
    nextRowId: 0,
    rows: [],
    rng: 42,
  };
  fillInitialRows(state);
  return state;
}

const { store, commitChange, storeHistory } = createGameStore<GameState>(makeInitialState(), {
  enableHistory: true,
});

function restartGame(): void {
  commitChange('重开', (draft) => {
    Object.assign(draft, makeInitialState());
  });
}

function startGame(): void {
  commitChange('开始', (draft) => {
    if (draft.phase === 'ready') draft.phase = 'playing';
  });
}

function tapColumn(col: number): void {
  commitChange(`点击列:${col}`, (draft) => {
    if (draft.phase === 'ready') {
      draft.phase = 'playing';
    }
    if (draft.phase !== 'playing') return;

    const tapLine = SCENE_HEIGHT - ROW_HEIGHT * 0.55;
    let target: TileRow | null = null;
    let bestDist = Infinity;

    for (const row of draft.rows) {
      if (row.tapped) continue;
      const centerY = row.y + ROW_HEIGHT / 2;
      const dist = Math.abs(centerY - tapLine);
      if (dist < ROW_HEIGHT * 0.6 && dist < bestDist) {
        bestDist = dist;
        target = row;
      }
    }

    if (!target) return;

    if (target.blackCol === col) {
      target.tapped = true;
      draft.score += 1;
      draft.speed = Math.min(MAX_SPEED, draft.speed + SPEED_INCREMENT);
    } else {
      draft.phase = 'lost';
    }
  });
}

function tickGame(draft: GameState, dtSeconds: number): void {
  if (draft.phase !== 'playing') return;

  const dy = draft.speed * dtSeconds;
  for (const row of draft.rows) {
    row.y += dy;
  }

  for (const row of draft.rows) {
    if (row.y > SCENE_HEIGHT && !row.tapped) {
      draft.phase = 'lost';
      return;
    }
  }

  draft.rows = draft.rows.filter((row) => row.y <= SCENE_HEIGHT + ROW_HEIGHT || !row.tapped);

  const topRow = draft.rows.reduce((min, row) => (row.y < min.y ? row : min), draft.rows[0]);
  if (topRow && topRow.y >= 0) {
    draft.rows.unshift(makeRow(draft, topRow.y - ROW_HEIGHT));
  }
}

function Game() {
  useFrame((frame) => {
    const dtSeconds = Math.min(frame.deltaSeconds, 0.05);
    commitChange('逻辑帧', (draft) => tickGame(draft, dtSeconds));
  });

  return (
    <scene
      name="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#1a1a2e"
      clickable
      onClick={() => {
        if (store.phase === 'lost') restartGame();
        else if (store.phase === 'ready') startGame();
      }}
    >
      <text
        x={0}
        y={20}
        width={SCENE_WIDTH}
        height={32}
        text="别踩白块"
        textAlign="center"
        textColor="#f8fafc"
        textSize="28"
      />
      <text
        x={0}
        y={54}
        width={SCENE_WIDTH}
        height={24}
        text={`得分 ${store.score}`}
        textAlign="center"
        textColor="#94a3b8"
        textSize="18"
      />

      {store.phase === 'ready' && (
        <text
          x={0}
          y={SCENE_HEIGHT / 2 - 40}
          width={SCENE_WIDTH}
          height={28}
          text="点击黑块开始"
          textAlign="center"
          textColor="#fbbf24"
          textSize="22"
        />
      )}

      {store.phase === 'lost' && (
        <group x={40} y={SCENE_HEIGHT / 2 - 60} width={280} height={120}>
          <node
            x={0}
            y={0}
            width={280}
            height={120}
            shape="roundedRect(16 16 16 16)"
            backgroundColor="#0f172a"
            border="solid"
            borderWidth={2}
            borderColor="#ef4444"
          />
          <text
            x={0}
            y={20}
            width={280}
            height={28}
            text="游戏结束"
            textAlign="center"
            textColor="#ef4444"
            textSize="24"
          />
          <text
            x={0}
            y={56}
            width={280}
            height={24}
            text={`最终得分 ${store.score}`}
            textAlign="center"
            textColor="#e2e8f0"
            textSize="18"
          />
          <text
            x={0}
            y={86}
            width={280}
            height={22}
            text="点击屏幕重开"
            textAlign="center"
            textColor="#94a3b8"
            textSize="16"
          />
        </group>
      )}

      {store.rows.map((row) => (
        <group x={0} y={row.y} width={SCENE_WIDTH} height={ROW_HEIGHT}>
          {Array.from({ length: COLS }, (_, col) => {
            const isBlack = col === row.blackCol;
            const hidden = row.tapped && isBlack;
            return (
              <group
                x={col * COL_WIDTH}
                y={GAP}
                width={COL_WIDTH}
                height={ROW_HEIGHT - GAP * 2}
                clickable={store.phase === 'playing' || store.phase === 'ready'}
                hidden={hidden}
                onClick={() => tapColumn(col)}
              >
                <node
                  x={GAP}
                  y={0}
                  width={TILE_SIZE}
                  height={ROW_HEIGHT - GAP * 2}
                  shape="roundedRect(6 6 6 6)"
                  backgroundColor={isBlack ? '#111827' : '#f8fafc'}
                  border="solid"
                  borderWidth={isBlack ? 0 : 1}
                  borderColor="#e2e8f0"
                />
              </group>
            );
          })}
        </group>
      ))}

      <node
        x={0}
        y={SCENE_HEIGHT - ROW_HEIGHT - 4}
        width={SCENE_WIDTH}
        height={ROW_HEIGHT + 8}
        shape="rect"
        backgroundColor="#ffffff08"
        border="solid"
        borderWidth={1}
        borderColor="#ffffff22"
        zIndex={-1}
      />
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
