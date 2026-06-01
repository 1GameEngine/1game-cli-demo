import { createGameStore, renderGame } from '@1game/engine-bundle/runtime/worker';

type CellDisplay = 'hidden' | 'revealed' | 'flagged';
type Phase = 'playing' | 'won' | 'lost';

type Cell = {
  mine: boolean;
  adjacent: number;
  display: CellDisplay;
};

type GameState = {
  phase: Phase;
  cols: number;
  rows: number;
  cellSize: number;
  gridOffsetX: number;
  gridOffsetY: number;
  cells: Cell[];
  mineCount: number;
  flagsPlaced: number;
  minesPlaced: boolean;
  flagMode: boolean;
  rngSeed: number;
};

const SCENE_WIDTH = 320;
const SCENE_HEIGHT = 300;
const HUD_HEIGHT = 36;
const TOOLBAR_HEIGHT = 44;
const COLS = 9;
const ROWS = 8;
const CELL_SIZE = 26;
const MINE_COUNT = 12;
const GRID_WIDTH = COLS * CELL_SIZE;
const GRID_HEIGHT = ROWS * CELL_SIZE;
const GRID_OFFSET_X = Math.floor((SCENE_WIDTH - GRID_WIDTH) / 2);
const GRID_OFFSET_Y = HUD_HEIGHT + Math.floor((SCENE_HEIGHT - HUD_HEIGHT - TOOLBAR_HEIGHT - GRID_HEIGHT) / 2);

const NUMBER_COLORS = ['', '#60a5fa', '#4ade80', '#f87171', '#a78bfa', '#fb923c', '#22d3ee', '#1f2937', '#6b7280'];

function index(cols: number, x: number, y: number): number {
  return y * cols + x;
}

function inBounds(cols: number, rows: number, x: number, y: number): boolean {
  return x >= 0 && x < cols && y >= 0 && y < rows;
}

function nextRng(seed: number): [number, number] {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return [next, next / 0x100000000];
}

function createEmptyCells(): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i < COLS * ROWS; i += 1) {
    cells.push({ mine: false, adjacent: 0, display: 'hidden' });
  }
  return cells;
}

function makeInitialState(): GameState {
  return {
    phase: 'playing',
    cols: COLS,
    rows: ROWS,
    cellSize: CELL_SIZE,
    gridOffsetX: GRID_OFFSET_X,
    gridOffsetY: GRID_OFFSET_Y,
    cells: createEmptyCells(),
    mineCount: MINE_COUNT,
    flagsPlaced: 0,
    minesPlaced: false,
    flagMode: false,
    rngSeed: 0x9e3779b9,
  };
}

function neighbors(cols: number, rows: number, x: number, y: number): Array<{ x: number; y: number }> {
  const result: Array<{ x: number; y: number }> = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (inBounds(cols, rows, nx, ny)) result.push({ x: nx, y: ny });
    }
  }
  return result;
}

function placeMines(draft: GameState, safeX: number, safeY: number): void {
  const forbidden = new Set<number>();
  forbidden.add(index(draft.cols, safeX, safeY));
  for (const n of neighbors(draft.cols, draft.rows, safeX, safeY)) {
    forbidden.add(index(draft.cols, n.x, n.y));
  }

  let placed = 0;
  let seed = draft.rngSeed;
  let guard = 0;

  while (placed < draft.mineCount && guard < COLS * ROWS * 4) {
    guard += 1;
    let rand: number;
    [seed, rand] = nextRng(seed);
    const cellIndex = Math.floor(rand * draft.cells.length);
    if (forbidden.has(cellIndex) || draft.cells[cellIndex].mine) continue;
    draft.cells[cellIndex].mine = true;
    placed += 1;
  }

  for (let y = 0; y < draft.rows; y += 1) {
    for (let x = 0; x < draft.cols; x += 1) {
      const i = index(draft.cols, x, y);
      if (draft.cells[i].mine) {
        draft.cells[i].adjacent = 0;
        continue;
      }
      let count = 0;
      for (const n of neighbors(draft.cols, draft.rows, x, y)) {
        if (draft.cells[index(draft.cols, n.x, n.y)].mine) count += 1;
      }
      draft.cells[i].adjacent = count;
    }
  }

  draft.rngSeed = seed;
  draft.minesPlaced = true;
}

function countHiddenNonMines(draft: GameState): number {
  let count = 0;
  for (const cell of draft.cells) {
    if (!cell.mine && cell.display === 'hidden') count += 1;
  }
  return count;
}

function checkWin(draft: GameState): void {
  if (countHiddenNonMines(draft) === 0) {
    draft.phase = 'won';
  }
}

function revealCell(draft: GameState, x: number, y: number): void {
  if (draft.phase !== 'playing') return;
  const i = index(draft.cols, x, y);
  const cell = draft.cells[i];
  if (cell.display !== 'hidden') return;

  if (!draft.minesPlaced) {
    placeMines(draft, x, y);
  }

  cell.display = 'revealed';

  if (cell.mine) {
    draft.phase = 'lost';
    for (const c of draft.cells) {
      if (c.mine) c.display = 'revealed';
    }
    return;
  }

  if (cell.adjacent === 0) {
    const stack = neighbors(draft.cols, draft.rows, x, y);
    while (stack.length > 0) {
      const { x: nx, y: ny } = stack.pop()!;
      const ni = index(draft.cols, nx, ny);
      const neighbor = draft.cells[ni];
      if (neighbor.display !== 'hidden' || neighbor.mine) continue;
      neighbor.display = 'revealed';
      if (neighbor.adjacent === 0) {
        stack.push(...neighbors(draft.cols, draft.rows, nx, ny));
      }
    }
  }

  checkWin(draft);
}

function toggleFlag(draft: GameState, x: number, y: number): void {
  if (draft.phase !== 'playing') return;
  const cell = draft.cells[index(draft.cols, x, y)];
  if (cell.display === 'revealed') return;

  if (cell.display === 'flagged') {
    cell.display = 'hidden';
    draft.flagsPlaced -= 1;
  } else if (draft.flagsPlaced < draft.mineCount) {
    cell.display = 'flagged';
    draft.flagsPlaced += 1;
  }
}

function handleCellTap(draft: GameState, x: number, y: number): void {
  if (draft.flagMode) {
    toggleFlag(draft, x, y);
  } else {
    revealCell(draft, x, y);
  }
}

function restartGame(draft: GameState): void {
  Object.assign(draft, makeInitialState());
}

const { store, commitChange, storeHistory } = createGameStore(makeInitialState(), { enableHistory: true });

function cellBackground(cell: Cell, phase: Phase): string {
  if (cell.display === 'flagged') return '#f59e0b';
  if (cell.display === 'hidden') return '#475569';
  if (cell.mine) return phase === 'lost' ? '#ef4444' : '#94a3b8';
  return '#e2e8f0';
}

function CellView(props: { x: number; y: number }): unknown {
  const cellIndex = () => index(store.cols, props.x, props.y);
  const cell = () => store.cells[cellIndex()];

  return (
    <group
      x={store.gridOffsetX + props.x * store.cellSize}
      y={store.gridOffsetY + props.y * store.cellSize}
      width={store.cellSize}
      height={store.cellSize}
      clickable
      onPointerDown={() => {
        commitChange(`cell:${props.x},${props.y}`, (draft: GameState) => {
          handleCellTap(draft, props.x, props.y);
        });
      }}
    >
      <node
        x={1}
        y={1}
        width={store.cellSize - 2}
        height={store.cellSize - 2}
        shape="roundedRect(4 4 4 4)"
        backgroundColor={cellBackground(cell(), store.phase)}
      />
      {cell().display === 'revealed' && !cell().mine && cell().adjacent > 0 ? (
        <text
          x={0}
          y={5}
          width={store.cellSize}
          height={store.cellSize}
          text={String(cell().adjacent)}
          textAlign="center"
          textSize="18"
          textColor={NUMBER_COLORS[cell().adjacent] ?? '#111827'}
        />
      ) : null}
      {cell().display === 'revealed' && cell().mine ? (
        <text x={0} y={4} width={store.cellSize} height={store.cellSize} text="*" textAlign="center" textSize="18" textColor="#fff" />
      ) : null}
      {cell().display === 'flagged' ? (
        <text x={0} y={4} width={store.cellSize} height={store.cellSize} text="F" textAlign="center" textSize="16" textColor="#1f2937" />
      ) : null}
    </group>
  );
}

function ToolbarButton(props: { label: string; x: number; active?: boolean; onPress: () => void }): unknown {
  const bg = () => (props.active ? '#2563eb' : '#374151');
  return (
    <group x={props.x} y={SCENE_HEIGHT - TOOLBAR_HEIGHT + 6} width={92} height={32} clickable onPointerDown={props.onPress}>
      <node x={0} y={0} width={92} height={32} shape="roundedRect(8 8 8 8)" backgroundColor={bg()} />
      <text x={0} y={7} width={92} height={18} text={props.label} textAlign="center" textColor="#fff" textSize="14" />
    </group>
  );
}

function Game(): unknown {
  const minesLeft = () => Math.max(0, store.mineCount - store.flagsPlaced);
  const statusText = () => {
    if (store.phase === 'won') return '胜利!';
    if (store.phase === 'lost') return '踩雷了';
    return store.flagMode ? '插旗模式' : '点开格子';
  };

  const cells = () => {
    const views: unknown[] = [];
    for (let y = 0; y < store.rows; y += 1) {
      for (let x = 0; x < store.cols; x += 1) {
        views.push(<CellView x={x} y={y} />);
      }
    }
    return views;
  };

  return (
    <scene id="main" width={SCENE_WIDTH} height={SCENE_HEIGHT} backgroundColor="#0f172a">
      <text x={12} y={8} width={120} height={22} text={`雷: ${minesLeft()}`} textColor="#f8fafc" textSize="16" />
      <text x={130} y={8} width={178} height={22} text={statusText()} textAlign="right" textColor="#facc15" textSize="16" />

      {cells()}

      <ToolbarButton
        label={store.flagMode ? '插旗中' : '插旗'}
        x={16}
        active={store.flagMode}
        onPress={() => {
          commitChange('toggle-flag-mode', (draft: GameState) => {
            draft.flagMode = !draft.flagMode;
          });
        }}
      />
      <ToolbarButton
        label="重来"
        x={212}
        onPress={() => {
          commitChange('restart', (draft: GameState) => restartGame(draft));
        }}
      />
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
