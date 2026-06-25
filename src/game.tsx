import { createGameStore, renderGame } from '@1game/engine-bundle/runtime/worker';

type Phase = 'ready' | 'playing' | 'lost';

type TileRow = {
  id: string;
  blackCol: number;
};

type GameState = {
  phase: Phase;
  score: number;
  bestScore: number;
  rows: TileRow[];
  rngSeed: number;
  rowCounter: number;
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const COLS = 4;
const ROWS = 4;
const GRID_PADDING = 16;
const GAP = 8;
const CELL_SIZE = (SCENE_WIDTH - GRID_PADDING * 2 - GAP * (COLS - 1)) / COLS;
const GRID_X = GRID_PADDING;
const GRID_Y = 180;
const WHITE_TILE = '#f1f5f9';
const BLACK_TILE = '#0f172a';
const TILE_BORDER = '#cbd5e1';

function nextRandom(seed: number): { value: number; seed: number } {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return { value: next / 0xffffffff, seed: next };
}

function randomCol(seed: number): { col: number; seed: number } {
  const { value, seed: nextSeed } = nextRandom(seed);
  return { col: Math.floor(value * COLS), seed: nextSeed };
}

function makeRow(counter: number, blackCol: number): TileRow {
  return { id: `row-${counter}`, blackCol };
}

function spawnRow(draft: GameState): void {
  const picked = randomCol(draft.rngSeed);
  draft.rngSeed = picked.seed;
  draft.rows.unshift(makeRow(draft.rowCounter, picked.col));
  draft.rowCounter += 1;
}

function makeInitialState(): GameState {
  let seed = 0x1a2e3f4d;
  let rowCounter = 0;
  const rows: TileRow[] = [];
  for (let i = 0; i < ROWS; i += 1) {
    const picked = randomCol(seed);
    seed = picked.seed;
    rows.push(makeRow(rowCounter, picked.col));
    rowCounter += 1;
  }
  return {
    phase: 'ready',
    score: 0,
    bestScore: 0,
    rows,
    rngSeed: seed,
    rowCounter,
  };
}

const { store, commitChange, storeHistory } = createGameStore<GameState>(makeInitialState(), { enableHistory: true });

function tileX(col: number): number {
  return GRID_X + col * (CELL_SIZE + GAP);
}

function tileY(row: number): number {
  return GRID_Y + row * (CELL_SIZE + GAP);
}

function startGame(): void {
  commitChange('开始', (draft) => {
    if (draft.phase !== 'ready') return;
    draft.phase = 'playing';
  });
}

function restartGame(): void {
  commitChange('重开', (draft) => {
    const best = Math.max(draft.bestScore, draft.score);
    Object.assign(draft, makeInitialState());
    draft.bestScore = best;
  });
}

function tapColumn(col: number): void {
  commitChange(`点击列:${col}`, (draft) => {
    if (draft.phase === 'ready') {
      draft.phase = 'playing';
    }
    if (draft.phase !== 'playing') return;

    const bottom = draft.rows[draft.rows.length - 1];
    if (!bottom) return;

    if (bottom.blackCol !== col) {
      draft.bestScore = Math.max(draft.bestScore, draft.score);
      draft.phase = 'lost';
      return;
    }

    draft.score += 1;
    draft.bestScore = Math.max(draft.bestScore, draft.score);
    draft.rows.pop();
    spawnRow(draft);
  });
}

function phaseTitle(phase: Phase): string {
  if (phase === 'ready') return '别踩白块';
  if (phase === 'playing') return '只点黑块';
  return '踩到白块了';
}

function phaseHint(phase: Phase, score: number): string {
  if (phase === 'ready') return '点击底部黑块开始';
  if (phase === 'playing') return `得分 ${score} · 点最底行黑块`;
  return '点击屏幕再来一局';
}

function Game() {
  const boardWidth = COLS * CELL_SIZE + GAP * (COLS - 1);
  const boardHeight = ROWS * CELL_SIZE + GAP * (ROWS - 1);
  const overlayVisible = store.phase === 'ready' || store.phase === 'lost';

  return (
    <scene
      name="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#020617"
      clickable={overlayVisible}
      onClick={() => {
        if (store.phase === 'ready') startGame();
        if (store.phase === 'lost') restartGame();
      }}
    >
      <text
        x={0}
        y={48}
        width={SCENE_WIDTH}
        height={36}
        text={phaseTitle(store.phase)}
        textAlign="center"
        textColor="#f8fafc"
        textSize="28"
      />
      <text
        x={0}
        y={88}
        width={SCENE_WIDTH}
        height={24}
        text={phaseHint(store.phase, store.score)}
        textAlign="center"
        textColor="#94a3b8"
        textSize="16"
      />
      <text
        x={GRID_PADDING}
        y={124}
        width={boardWidth}
        height={22}
        text={`当前 ${store.score}    最高 ${store.bestScore}`}
        textAlign="center"
        textColor="#e2e8f0"
        textSize="16"
      />

      <node
        x={GRID_X - 6}
        y={GRID_Y - 6}
        width={boardWidth + 12}
        height={boardHeight + 12}
        shape="roundedRect(14 14 14 14)"
        backgroundColor="#1e293b"
        border="solid"
        borderWidth={2}
        borderColor="#334155"
      />

      {store.rows.map((row, rowIndex) =>
        Array.from({ length: COLS }, (_, col) => {
          const isBlack = row.blackCol === col;
          const isBottomRow = rowIndex === store.rows.length - 1;
          const clickable = isBottomRow && (store.phase === 'playing' || store.phase === 'ready');

          return (
            <group
              x={tileX(col)}
              y={tileY(rowIndex)}
              width={CELL_SIZE}
              height={CELL_SIZE}
              clickable={clickable}
              zIndex={clickable ? 2 : 1}
              onClick={() => {
                if (clickable) tapColumn(col);
              }}
            >
              <node
                x={0}
                y={0}
                width={CELL_SIZE}
                height={CELL_SIZE}
                shape="roundedRect(10 10 10 10)"
                backgroundColor={isBlack ? BLACK_TILE : WHITE_TILE}
                border="solid"
                borderWidth={isBottomRow && store.phase !== 'lost' ? 2 : 1}
                borderColor={isBottomRow && store.phase !== 'lost' ? '#38bdf8' : TILE_BORDER}
              />
            </group>
          );
        }),
      )}

      {overlayVisible ? (
        <group
          x={40}
          y={GRID_Y + boardHeight + 48}
          width={SCENE_WIDTH - 80}
          height={52}
          clickable
          zIndex={10}
          onClick={() => {
            if (store.phase === 'ready') startGame();
            if (store.phase === 'lost') restartGame();
          }}
        >
          <node
            x={0}
            y={0}
            width={SCENE_WIDTH - 80}
            height={52}
            shape="roundedRect(12 12 12 12)"
            backgroundColor="#2563eb"
          />
          <text
            x={0}
            y={14}
            width={SCENE_WIDTH - 80}
            height={28}
            text={store.phase === 'ready' ? '开始游戏' : '再来一局'}
            textAlign="center"
            textColor="#ffffff"
            textSize="20"
          />
        </group>
      ) : null}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
