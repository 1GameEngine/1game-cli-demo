import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const COLS = 4;
const ROW_HEIGHT = 96;
const CELL_WIDTH = SCENE_WIDTH / COLS;
const GRID_TOP = 108;
const GRID_BOTTOM = SCENE_HEIGHT - 16;
const BASE_SPEED = 110;
const MAX_SPEED = 380;

type Row = {
  id: number;
  blackCol: number;
  y: number;
  blackTapped: boolean;
};

type GameState = {
  phase: 'ready' | 'playing' | 'lost';
  score: number;
  speed: number;
  rows: Row[];
  nextRowId: number;
  rngSeed: number;
};

function nextRandom(seed: number): { value: number; seed: number } {
  const next = (seed * 1_664_525 + 1_013_904_223) >>> 0;
  return { value: next / 0xffff_ffff, seed: next };
}

function randomBlackCol(seed: number): { col: number; seed: number } {
  const { value, seed: nextSeed } = nextRandom(seed);
  return { col: Math.floor(value * COLS), seed: nextSeed };
}

function makeRow(id: number, y: number, blackCol: number): Row {
  return { id, blackCol, y, blackTapped: false };
}

function makeInitialRows(seed: number, nextRowId: number): { rows: Row[]; seed: number; nextRowId: number } {
  const rows: Row[] = [];
  let currentSeed = seed;
  let rowId = nextRowId;
  const rowCount = Math.ceil((GRID_BOTTOM - GRID_TOP) / ROW_HEIGHT) + 3;

  for (let i = 0; i < rowCount; i += 1) {
    const { col, seed: newSeed } = randomBlackCol(currentSeed);
    currentSeed = newSeed;
    rows.push(makeRow(rowId, GRID_TOP - (rowCount - i) * ROW_HEIGHT, col));
    rowId += 1;
  }

  return { rows, seed: currentSeed, nextRowId: rowId };
}

function makeInitialState(): GameState {
  const { rows, seed, nextRowId } = makeInitialRows(42_001, 1);
  return {
    phase: 'ready',
    score: 0,
    speed: BASE_SPEED,
    rows,
    nextRowId,
    rngSeed: seed,
  };
}

const { store, commitChange, storeHistory } = createGameStore<GameState>(makeInitialState(), { enableHistory: true });

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

function tapTile(rowId: number, col: number): void {
  commitChange('点击方块', (draft) => {
    if (draft.phase === 'ready') {
      draft.phase = 'playing';
      return;
    }
    if (draft.phase !== 'playing') return;

    const row = draft.rows.find((item) => item.id === rowId);
    if (!row || row.blackTapped) return;
    if (row.y + ROW_HEIGHT < GRID_TOP || row.y > GRID_BOTTOM) return;

    if (col === row.blackCol) {
      row.blackTapped = true;
      draft.score += 1;
      draft.speed = Math.min(MAX_SPEED, BASE_SPEED + draft.score * 10);
      return;
    }

    draft.phase = 'lost';
  });
}

function spawnRowIfNeeded(draft: GameState): void {
  const topRow = draft.rows.reduce<Row | null>((top, row) => {
    if (!top || row.y < top.y) return row;
    return top;
  }, null);

  if (!topRow || topRow.y < GRID_TOP) return;

  const { col, seed } = randomBlackCol(draft.rngSeed);
  draft.rngSeed = seed;
  draft.rows.push(makeRow(draft.nextRowId, topRow.y - ROW_HEIGHT, col));
  draft.nextRowId += 1;
}

function tickRows(draft: GameState, deltaSeconds: number): void {
  if (draft.phase !== 'playing') return;

  const deltaY = draft.speed * deltaSeconds;
  for (const row of draft.rows) {
    row.y += deltaY;
  }

  spawnRowIfNeeded(draft);

  const remaining: Row[] = [];
  for (const row of draft.rows) {
    if (row.y > GRID_BOTTOM) {
      if (!row.blackTapped) {
        draft.phase = 'lost';
        return;
      }
      continue;
    }
    remaining.push(row);
  }
  draft.rows = remaining;
}

function tileColor(row: Row, col: number): string {
  if (col !== row.blackCol) return '#f1f5f9';
  if (row.blackTapped) return '#22c55e';
  return '#0f172a';
}

function statusText(phase: GameState['phase'], score: number): string {
  if (phase === 'ready') return '点击黑块开始';
  if (phase === 'lost') return `游戏结束 · 得分 ${score}`;
  return `得分 ${score}`;
}

function hintText(phase: GameState['phase']): string {
  if (phase === 'ready') return '只点黑色，别碰白块';
  if (phase === 'lost') return '点击屏幕重开';
  return '黑块到底前必须点到';
}

function Game() {
  useFrame((frame) => {
    const deltaSeconds = Math.min(frame.deltaSeconds, 0.05);
    commitChange('逻辑帧', (draft) => {
      tickRows(draft, deltaSeconds);
    });
  });

  return (
    <scene
      name="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#020617"
      clickable={store.phase === 'lost'}
      onClick={() => {
        if (store.phase === 'lost') restartGame();
      }}
    >
      <text
        x={0}
        y={24}
        width={SCENE_WIDTH}
        height={32}
        text="别踩白块"
        textAlign="center"
        textColor="#f8fafc"
        textSize="28"
      />
      <text
        x={0}
        y={60}
        width={SCENE_WIDTH}
        height={24}
        text={statusText(store.phase, store.score)}
        textAlign="center"
        textColor="#38bdf8"
        textSize="18"
      />
      <text
        x={0}
        y={84}
        width={SCENE_WIDTH}
        height={20}
        text={hintText(store.phase)}
        textAlign="center"
        textColor="#94a3b8"
        textSize="14"
      />

      <node
        x={0}
        y={GRID_TOP - 4}
        width={SCENE_WIDTH}
        height={GRID_BOTTOM - GRID_TOP + 8}
        shape="roundedRect(12 12 12 12)"
        border="solid"
        borderWidth={2}
        borderColor="#1e293b"
      />

      {store.rows.map((row) =>
        Array.from({ length: COLS }, (_, col) => {
          const x = col * CELL_WIDTH;
          const y = row.y;
          const visible = y + ROW_HEIGHT >= GRID_TOP - 8 && y <= GRID_BOTTOM + 8;
          if (!visible) return null;

          return (
            <group
              x={x + 4}
              y={y + 4}
              width={CELL_WIDTH - 8}
              height={ROW_HEIGHT - 8}
              clickable
              zIndex={10 + row.id}
              onClick={() => {
                if (store.phase === 'lost') {
                  restartGame();
                  return;
                }
                if (store.phase === 'ready') {
                  startGame();
                  return;
                }
                tapTile(row.id, col);
              }}
            >
              <node
                x={0}
                y={0}
                width={CELL_WIDTH - 8}
                height={ROW_HEIGHT - 8}
                shape="roundedRect(8 8 8 8)"
                backgroundColor={tileColor(row, col)}
              />
            </group>
          );
        }),
      )}

      {store.phase === 'lost' ? (
        <group x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} zIndex={1000} clickable onClick={restartGame}>
          <node x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} backgroundColor="#000000aa" />
          <text
            x={40}
            y={280}
            width={280}
            height={80}
            text={`得分 ${store.score}\n点击重开`}
            textAlign="center"
            textColor="#f8fafc"
            textSize="24"
          />
        </group>
      ) : null}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
