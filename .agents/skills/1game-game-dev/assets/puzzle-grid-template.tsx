import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'left' | 'right' | 'up' | 'down';
type AnimPhase = 'idle' | 'sliding';

type Tile = {
  id: string;
  value: number;
  row: number;
  col: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
};

type GameState = {
  phase: 'ready' | 'playing';
  rows: number;
  cols: number;
  cell: number;
  tile: Tile;
  anim: {
    phase: AnimPhase;
    elapsedMs: number;
    durationMs: number;
  };
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const GRID_X = 72;
const GRID_Y = 168;
const GRID_ROWS = 4;
const GRID_COLS = 4;
const CELL_SIZE = 54;

const { store, commitChange, storeHistory } = createGameStore<GameState>(
  {
    phase: 'ready',
    rows: GRID_ROWS,
    cols: GRID_COLS,
    cell: CELL_SIZE,
    tile: {
      id: 'tile-2',
      value: 2,
      row: 1,
      col: 1,
      fromRow: 1,
      fromCol: 1,
      toRow: 1,
      toCol: 1,
    },
    anim: {
      phase: 'idle',
      elapsedMs: 0,
      durationMs: 140,
    },
  },
  { enableHistory: true },
);

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function easeOutCubic(t: number): number {
  const x = clamp(t, 0, 1) - 1;
  return x * x * x + 1;
}

function beginMove(direction: Direction): void {
  commitChange(`移动:${direction}`, (draft) => {
    if (draft.phase === 'ready') draft.phase = 'playing';
    if (draft.anim.phase !== 'idle') return;

    const currentRow = draft.tile.row;
    const currentCol = draft.tile.col;
    let nextRow = currentRow;
    let nextCol = currentCol;

    if (direction === 'left') nextCol -= 1;
    if (direction === 'right') nextCol += 1;
    if (direction === 'up') nextRow -= 1;
    if (direction === 'down') nextRow += 1;

    nextRow = clamp(nextRow, 0, draft.rows - 1);
    nextCol = clamp(nextCol, 0, draft.cols - 1);
    if (nextRow === currentRow && nextCol === currentCol) return;

    draft.tile.fromRow = currentRow;
    draft.tile.fromCol = currentCol;
    draft.tile.toRow = nextRow;
    draft.tile.toCol = nextCol;
    draft.anim.phase = 'sliding';
    draft.anim.elapsedMs = 0;
  });
}

function Game() {
  useFrame((frame) => {
    const dtMs = Math.min(frame.deltaSeconds, 0.05) * 1000;
    commitChange('动画帧推进', (draft) => {
      if (draft.anim.phase !== 'sliding') return;
      draft.anim.elapsedMs += dtMs;
      if (draft.anim.elapsedMs < draft.anim.durationMs) return;

      draft.tile.row = draft.tile.toRow;
      draft.tile.col = draft.tile.toCol;
      draft.tile.fromRow = draft.tile.row;
      draft.tile.fromCol = draft.tile.col;
      draft.anim.phase = 'idle';
      draft.anim.elapsedMs = 0;
    });
  });

  const normalized = store.anim.phase === 'idle' ? 1 : clamp(store.anim.elapsedMs / store.anim.durationMs, 0, 1);
  const progress = easeOutCubic(normalized);
  const row = store.tile.fromRow + (store.tile.toRow - store.tile.fromRow) * progress;
  const col = store.tile.fromCol + (store.tile.toCol - store.tile.fromCol) * progress;
  const tileX = GRID_X + col * store.cell + 4;
  const tileY = GRID_Y + row * store.cell + 4;
  const boardWidth = store.cols * store.cell;
  const boardHeight = store.rows * store.cell;
  const title = store.phase === 'ready' ? '点击后用方向键操作' : '事件驱动移动 + 帧动画';

  return (
    <scene
      name="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#0f172a"
      clickable
      onClick={() => {
        commitChange('开始', (draft) => {
          if (draft.phase === 'ready') draft.phase = 'playing';
        });
      }}
      onKeyDown={(event) => {
        if (event.detail?.code === 'ArrowLeft') beginMove('left');
        if (event.detail?.code === 'ArrowRight') beginMove('right');
        if (event.detail?.code === 'ArrowUp') beginMove('up');
        if (event.detail?.code === 'ArrowDown') beginMove('down');
      }}
    >
      <text x={0} y={36} width={SCENE_WIDTH} height={24} text={title} textAlign="center" textColor="#e2e8f0" textSize="18" />
      <text
        x={0}
        y={64}
        width={SCENE_WIDTH}
        height={20}
        text={`动画:${store.anim.phase} 进度:${normalized.toFixed(2)}`}
        textAlign="center"
        textColor="#94a3b8"
        textSize="14"
      />

      <node x={GRID_X} y={GRID_Y} width={boardWidth} height={boardHeight} shape="roundedRect(12 12 12 12)" backgroundColor="#1e293b" />

      <node x={tileX} y={tileY} width={store.cell - 8} height={store.cell - 8} shape="roundedRect(8 8 8 8)" backgroundColor="#f59e0b" />
      <text
        x={tileX}
        y={tileY + 14}
        width={store.cell - 8}
        height={20}
        text={`${store.tile.value}`}
        textAlign="center"
        textColor="#0f172a"
        textSize="18"
      />
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
