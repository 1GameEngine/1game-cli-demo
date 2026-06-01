import { createGameStore, renderGame } from '@1game/engine-bundle/runtime/worker';

type Phase = 'ready' | 'playing' | 'won' | 'lost';

type Cell = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};

type GameState = {
  phase: Phase;
  cols: number;
  rows: number;
  cellSize: number;
  gridOffsetX: number;
  gridOffsetY: number;
  mineCount: number;
  flagCount: number;
  flagMode: boolean;
  minesGenerated: boolean;
  cells: Cell[];
  rngSeed: number;
};

const SCENE_WIDTH = 320;
const SCENE_HEIGHT = 480;
const HUD_HEIGHT = 36;
const FOOTER_HEIGHT = 52;
const COLS = 9;
const ROWS = 12;
const CELL_SIZE = 32;
const MINE_COUNT = 15;
const GRID_WIDTH = COLS * CELL_SIZE;
const GRID_HEIGHT = ROWS * CELL_SIZE;
const GRID_OFFSET_X = Math.floor((SCENE_WIDTH - GRID_WIDTH) / 2);
const GRID_OFFSET_Y = HUD_HEIGHT + Math.floor((SCENE_HEIGHT - HUD_HEIGHT - FOOTER_HEIGHT - GRID_HEIGHT) / 2);

const NEIGHBORS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const;

const NUMBER_COLORS = ['', '#1d4ed8', '#15803d', '#dc2626', '#7e22ce', '#b45309', '#0891b2', '#111827', '#6b7280'];

function nextRng(seed: number): [number, number] {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return [next, next / 0x100000000];
}

function cellIndex(cols: number, x: number, y: number): number {
  return y * cols + x;
}

function inBounds(cols: number, rows: number, x: number, y: number): boolean {
  return x >= 0 && x < cols && y >= 0 && y < rows;
}

function createEmptyCells(cols: number, rows: number): Cell[] {
  return Array.from({ length: cols * rows }, () => ({
    isMine: false,
    isRevealed: false,
    isFlagged: false,
    adjacentMines: 0,
  }));
}

function createInitialState(): GameState {
  return {
    phase: 'ready',
    cols: COLS,
    rows: ROWS,
    cellSize: CELL_SIZE,
    gridOffsetX: GRID_OFFSET_X,
    gridOffsetY: GRID_OFFSET_Y,
    mineCount: MINE_COUNT,
    flagCount: 0,
    flagMode: false,
    minesGenerated: false,
    cells: createEmptyCells(COLS, ROWS),
    rngSeed: 20260601,
  };
}

function placeMines(draft: GameState, safeX: number, safeY: number): void {
  const positions: { x: number; y: number }[] = [];
  for (let y = 0; y < draft.rows; y += 1) {
    for (let x = 0; x < draft.cols; x += 1) {
      if (x === safeX && y === safeY) continue;
      positions.push({ x, y });
    }
  }

  let seed = draft.rngSeed;
  let placed = 0;
  while (placed < draft.mineCount && positions.length > 0) {
    let rand: number;
    [seed, rand] = nextRng(seed);
    const pick = Math.floor(rand * positions.length);
    const { x, y } = positions.splice(pick, 1)[0];
    draft.cells[cellIndex(draft.cols, x, y)].isMine = true;
    placed += 1;
  }
  draft.rngSeed = seed;

  for (let y = 0; y < draft.rows; y += 1) {
    for (let x = 0; x < draft.cols; x += 1) {
      const idx = cellIndex(draft.cols, x, y);
      if (draft.cells[idx].isMine) continue;
      let count = 0;
      for (const [dx, dy] of NEIGHBORS) {
        const nx = x + dx;
        const ny = y + dy;
        if (!inBounds(draft.cols, draft.rows, nx, ny)) continue;
        if (draft.cells[cellIndex(draft.cols, nx, ny)].isMine) count += 1;
      }
      draft.cells[idx].adjacentMines = count;
    }
  }

  draft.minesGenerated = true;
}

function revealCell(draft: GameState, x: number, y: number): void {
  if (draft.phase !== 'playing' && draft.phase !== 'ready') return;

  const idx = cellIndex(draft.cols, x, y);
  const cell = draft.cells[idx];
  if (cell.isRevealed || cell.isFlagged) return;

  if (!draft.minesGenerated) {
    if (draft.phase === 'ready') draft.phase = 'playing';
    placeMines(draft, x, y);
  }

  if (cell.isMine) {
    cell.isRevealed = true;
    draft.phase = 'lost';
    for (const c of draft.cells) {
      if (c.isMine) c.isRevealed = true;
    }
    return;
  }

  const queue: { x: number; y: number }[] = [{ x, y }];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    const cIdx = cellIndex(draft.cols, current.x, current.y);
    const currentCell = draft.cells[cIdx];
    if (currentCell.isRevealed || currentCell.isFlagged || currentCell.isMine) continue;

    currentCell.isRevealed = true;
    if (currentCell.adjacentMines === 0) {
      for (const [dx, dy] of NEIGHBORS) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        if (!inBounds(draft.cols, draft.rows, nx, ny)) continue;
        const nIdx = cellIndex(draft.cols, nx, ny);
        if (!draft.cells[nIdx].isRevealed && !draft.cells[nIdx].isFlagged) {
          queue.push({ x: nx, y: ny });
        }
      }
    }
  }

  let hiddenSafe = 0;
  for (const c of draft.cells) {
    if (!c.isMine && !c.isRevealed) hiddenSafe += 1;
  }
  if (hiddenSafe === 0) draft.phase = 'won';
}

function toggleFlag(draft: GameState, x: number, y: number): void {
  if (draft.phase !== 'playing' && draft.phase !== 'ready') return;
  const idx = cellIndex(draft.cols, x, y);
  const cell = draft.cells[idx];
  if (cell.isRevealed) return;

  if (!cell.isFlagged && draft.flagCount >= draft.mineCount) return;

  cell.isFlagged = !cell.isFlagged;
  draft.flagCount += cell.isFlagged ? 1 : -1;
}

function handleCellTap(draft: GameState, x: number, y: number): void {
  if (draft.phase === 'won' || draft.phase === 'lost') return;
  if (draft.flagMode) {
    toggleFlag(draft, x, y);
    return;
  }
  revealCell(draft, x, y);
}

function restartGame(draft: GameState): void {
  const fresh = createInitialState();
  Object.assign(draft, fresh);
  draft.cells = createEmptyCells(COLS, ROWS);
}

function toggleFlagMode(draft: GameState): void {
  draft.flagMode = !draft.flagMode;
}

function statusText(state: GameState): string {
  if (state.phase === 'ready') return '点击格子开始';
  if (state.phase === 'won') return '胜利！';
  if (state.phase === 'lost') return '踩雷了';
  return state.flagMode ? '插旗模式' : '翻开模式';
}

function cellBackground(cell: Cell, phase: Phase): string {
  if (!cell.isRevealed) {
    return cell.isFlagged ? '#fbbf24' : '#6b7280';
  }
  if (cell.isMine) return '#ef4444';
  return '#e5e7eb';
}

function cellLabel(cell: Cell): string {
  if (!cell.isRevealed) return cell.isFlagged ? '🚩' : '';
  if (cell.isMine) return '💣';
  if (cell.adjacentMines > 0) return String(cell.adjacentMines);
  return '';
}

const { store, commitChange, storeHistory } = createGameStore(createInitialState(), { enableHistory: true });

function CellView(props: { x: number; y: number }): unknown {
  const idx = cellIndex(store.cols, props.x, props.y);
  const cell = () => store.cells[idx];
  const px = store.gridOffsetX + props.x * store.cellSize;
  const py = store.gridOffsetY + props.y * store.cellSize;
  const gap = 2;
  const inner = store.cellSize - gap;

  return (
    <group
      x={px}
      y={py}
      width={store.cellSize}
      height={store.cellSize}
      clickable
      onClick={() => {
        commitChange(`cell:${props.x},${props.y}`, (draft: GameState) => {
          handleCellTap(draft, props.x, props.y);
        });
      }}
    >
      <node
        x={gap / 2}
        y={gap / 2}
        width={inner}
        height={inner}
        shape="roundedRect(4 4 4 4)"
        backgroundColor={cellBackground(cell(), store.phase)}
        border={!cell().isRevealed ? '1px solid #9ca3af' : undefined}
      />
      <text
        x={0}
        y={6}
        width={store.cellSize}
        height={store.cellSize - 6}
        text={cellLabel(cell())}
        textAlign="center"
        textSize="18"
        textColor={
          cell().isRevealed && cell().adjacentMines > 0
            ? NUMBER_COLORS[cell().adjacentMines] ?? '#111827'
            : cell().isFlagged
              ? '#7c2d12'
              : '#111827'
        }
      />
    </group>
  );
}

function Game(): unknown {
  const remainingMines = () => Math.max(0, store.mineCount - store.flagCount);

  return (
    <scene
      id="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#1f2937"
      onKeyDown={(event) => {
        if (event.detail?.code === 'KeyF') {
          commitChange('toggle-flag-mode', (draft: GameState) => toggleFlagMode(draft));
        }
        if (event.detail?.code === 'KeyR' || event.detail?.code === 'Enter') {
          commitChange('restart', (draft: GameState) => restartGame(draft));
        }
      }}
    >
      <text x={12} y={8} width={140} height={22} text={`雷数 ${remainingMines()}`} textColor="#f9fafb" textSize="16" />
      <text
        x={160}
        y={8}
        width={148}
        height={22}
        text={statusText(store)}
        textAlign="right"
        textColor="#facc15"
        textSize="16"
      />

      {Array.from({ length: store.rows * store.cols }, (_, i) => {
        const col = i % store.cols;
        const row = Math.floor(i / store.cols);
        return <CellView x={col} y={row} />;
      })}

      <group
        x={16}
        y={SCENE_HEIGHT - FOOTER_HEIGHT + 8}
        width={136}
        height={36}
        clickable
        onClick={() => {
          commitChange('toggle-flag-mode', (draft: GameState) => toggleFlagMode(draft));
        }}
      >
        <node
          x={0}
          y={0}
          width={136}
          height={36}
          shape="roundedRect(8 8 8 8)"
          backgroundColor={store.flagMode ? '#d97706' : '#374151'}
        />
        <text
          x={0}
          y={8}
          width={136}
          height={20}
          text={store.flagMode ? '插旗中' : '插旗'}
          textAlign="center"
          textColor="#fff"
          textSize="16"
        />
      </group>

      <group
        x={168}
        y={SCENE_HEIGHT - FOOTER_HEIGHT + 8}
        width={136}
        height={36}
        clickable
        onClick={() => {
          commitChange('restart', (draft: GameState) => restartGame(draft));
        }}
      >
        <node x={0} y={0} width={136} height={36} shape="roundedRect(8 8 8 8)" backgroundColor="#2563eb" />
        <text x={0} y={8} width={136} height={20} text="重新开始" textAlign="center" textColor="#fff" textSize="16" />
      </group>

      {(store.phase === 'won' || store.phase === 'lost') && (
        <group
          x={40}
          y={SCENE_HEIGHT / 2 - 40}
          width={240}
          height={80}
          clickable
          onClick={() => {
            commitChange('restart-overlay', (draft: GameState) => restartGame(draft));
          }}
        >
          <node x={0} y={0} width={240} height={80} shape="roundedRect(12 12 12 12)" backgroundColor="#111827cc" />
          <text
            x={0}
            y={12}
            width={240}
            height={28}
            text={store.phase === 'won' ? '恭喜通关！' : '游戏结束'}
            textAlign="center"
            textColor="#f9fafb"
            textSize="20"
          />
          <text
            x={0}
            y={44}
            width={240}
            height={22}
            text="点此重新开始"
            textAlign="center"
            textColor="#93c5fd"
            textSize="16"
          />
        </group>
      )}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
