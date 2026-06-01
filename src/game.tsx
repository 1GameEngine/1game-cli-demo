import { createGameStore, renderGame } from '@1game/engine-bundle/runtime/worker';

type CellState = 'hidden' | 'revealed' | 'flagged';
type Phase = 'ready' | 'playing' | 'won' | 'lost';

type Cell = {
  isMine: boolean;
  adjacent: number;
  state: CellState;
};

type GameState = {
  phase: Phase;
  cols: number;
  rows: number;
  cellSize: number;
  mineCount: number;
  flagsPlaced: number;
  board: Cell[][];
  minesPlaced: boolean;
  flagMode: boolean;
  rngSeed: number;
};

const SCENE_WIDTH = 320;
const HUD_HEIGHT = 26;
const CONTROLS_HEIGHT = 44;
const COLS = 9;
const ROWS = 12;
const MINE_COUNT = 15;
const CELL_SIZE = Math.floor(SCENE_WIDTH / COLS);
const GRID_HEIGHT = ROWS * CELL_SIZE;
const SCENE_HEIGHT = HUD_HEIGHT + GRID_HEIGHT + CONTROLS_HEIGHT;
const GRID_OFFSET_Y = HUD_HEIGHT;

const NUMBER_COLORS = ['', '#3b82f6', '#22c55e', '#ef4444', '#a855f7', '#eab308', '#06b6d4', '#111827', '#6b7280'];

function nextRng(seed: number): [number, number] {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return [next, next / 0x100000000];
}

function createEmptyBoard(cols: number, rows: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      adjacent: 0,
      state: 'hidden' as CellState,
    })),
  );
}

function createInitialState(): GameState {
  return {
    phase: 'ready',
    cols: COLS,
    rows: ROWS,
    cellSize: CELL_SIZE,
    mineCount: MINE_COUNT,
    flagsPlaced: 0,
    board: createEmptyBoard(COLS, ROWS),
    minesPlaced: false,
    flagMode: false,
    rngSeed: 7,
  };
}

function inBounds(cols: number, rows: number, x: number, y: number): boolean {
  return x >= 0 && x < cols && y >= 0 && y < rows;
}

function forNeighbors(cols: number, rows: number, x: number, y: number, fn: (nx: number, ny: number) => void): void {
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (inBounds(cols, rows, nx, ny)) fn(nx, ny);
    }
  }
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
  let pool = positions.length;

  while (placed < draft.mineCount && pool > 0) {
    let rand: number;
    [seed, rand] = nextRng(seed);
    const index = Math.floor(rand * pool);
    const picked = positions[index];
    positions[index] = positions[pool - 1];
    pool -= 1;

    draft.board[picked.y][picked.x].isMine = true;
    placed += 1;
  }

  draft.rngSeed = seed;

  for (let y = 0; y < draft.rows; y += 1) {
    for (let x = 0; x < draft.cols; x += 1) {
      if (draft.board[y][x].isMine) continue;
      let count = 0;
      forNeighbors(draft.cols, draft.rows, x, y, (nx, ny) => {
        if (draft.board[ny][nx].isMine) count += 1;
      });
      draft.board[y][x].adjacent = count;
    }
  }

  draft.minesPlaced = true;
}

function revealCell(draft: GameState, x: number, y: number): void {
  if (draft.phase === 'won' || draft.phase === 'lost') return;

  const cell = draft.board[y][x];
  if (cell.state !== 'hidden') return;

  if (!draft.minesPlaced) {
    placeMines(draft, x, y);
    draft.phase = 'playing';
  }

  if (cell.isMine) {
    cell.state = 'revealed';
    draft.phase = 'lost';
    for (let row = 0; row < draft.rows; row += 1) {
      for (let col = 0; col < draft.cols; col += 1) {
        const target = draft.board[row][col];
        if (target.isMine) target.state = 'revealed';
      }
    }
    return;
  }

  const queue: { x: number; y: number }[] = [{ x, y }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.x},${current.y}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const target = draft.board[current.y][current.x];
    if (target.state === 'flagged') continue;
    if (target.state === 'revealed') continue;
    if (target.isMine) continue;

    target.state = 'revealed';

    if (target.adjacent === 0) {
      forNeighbors(draft.cols, draft.rows, current.x, current.y, (nx, ny) => {
        const neighbor = draft.board[ny][nx];
        if (neighbor.state === 'hidden' && !neighbor.isMine) {
          queue.push({ x: nx, y: ny });
        }
      });
    }
  }

  let hiddenSafe = 0;
  for (let row = 0; row < draft.rows; row += 1) {
    for (let col = 0; col < draft.cols; col += 1) {
      const target = draft.board[row][col];
      if (!target.isMine && target.state === 'hidden') hiddenSafe += 1;
    }
  }
  if (hiddenSafe === 0) draft.phase = 'won';
}

function toggleFlag(draft: GameState, x: number, y: number): void {
  if (draft.phase === 'won' || draft.phase === 'lost') return;
  const cell = draft.board[y][x];
  if (cell.state === 'revealed') return;

  if (cell.state === 'flagged') {
    cell.state = 'hidden';
    draft.flagsPlaced -= 1;
  } else {
    cell.state = 'flagged';
    draft.flagsPlaced += 1;
  }

  if (draft.phase === 'ready') draft.phase = 'playing';
}

function handleCellTap(draft: GameState, x: number, y: number): void {
  if (draft.flagMode) {
    toggleFlag(draft, x, y);
  } else {
    revealCell(draft, x, y);
  }
}

function restartGame(draft: GameState): void {
  const fresh = createInitialState();
  draft.phase = fresh.phase;
  draft.flagsPlaced = fresh.flagsPlaced;
  draft.board = fresh.board;
  draft.minesPlaced = fresh.minesPlaced;
  draft.flagMode = fresh.flagMode;
  draft.rngSeed = fresh.rngSeed;
}

function toggleFlagMode(draft: GameState): void {
  draft.flagMode = !draft.flagMode;
}

function cellBackground(cell: Cell, phase: Phase): string {
  if (cell.state === 'hidden') return '#4b5563';
  if (cell.state === 'flagged') return '#f59e0b';
  if (cell.isMine) return phase === 'lost' ? '#ef4444' : '#fca5a5';
  return '#e5e7eb';
}

function cellLabel(cell: Cell): string {
  if (cell.state === 'flagged') return '🚩';
  if (cell.state === 'hidden') return '';
  if (cell.isMine) return '💣';
  if (cell.adjacent === 0) return '';
  return String(cell.adjacent);
}

function cellTextColor(cell: Cell): string {
  if (cell.state !== 'revealed' || cell.isMine || cell.adjacent === 0) return '#111827';
  return NUMBER_COLORS[cell.adjacent] ?? '#111827';
}

const { store, commitChange, storeHistory } = createGameStore(createInitialState(), { enableHistory: true });

function CellButton(props: { x: number; y: number }): unknown {
  const cell = () => store.board[props.y][props.x];
  const px = () => props.x * store.cellSize;
  const py = () => GRID_OFFSET_Y + props.y * store.cellSize;
  const size = () => store.cellSize - 2;

  return (
    <group
      x={px()}
      y={py()}
      width={size()}
      height={size()}
      clickable
      onClick={() => {
        commitChange(`cell:${props.x},${props.y}`, (draft: GameState) => {
          handleCellTap(draft, props.x, props.y);
        });
      }}
      zIndex={1}
    >
      <node x={0} y={0} width={size()} height={size()} shape="roundedRect(3 3 3 3)" backgroundColor={cellBackground(cell(), store.phase)} />
      <text
        x={0}
        y={Math.max(0, Math.floor((size() - 14) / 2))}
        width={size()}
        height={14}
        text={cellLabel(cell())}
        textAlign="center"
        textColor={cellTextColor(cell())}
        textSize="12"
      />
    </group>
  );
}

function Game(): unknown {
  const statusText = () => {
    if (store.phase === 'won') return '胜利！';
    if (store.phase === 'lost') return '踩雷了';
    if (store.flagMode) return '插旗模式';
    return '点击揭开格子';
  };

  const minesLeft = () => Math.max(0, store.mineCount - store.flagsPlaced);

  return (
    <scene id="main" width={SCENE_WIDTH} height={SCENE_HEIGHT} backgroundColor="#0f172a">
      <text x={8} y={6} width={120} height={18} text={`雷: ${minesLeft()}`} textColor="#e2e8f0" textSize="14" />
      <text x={128} y={6} width={184} height={18} text={statusText()} textAlign="right" textColor="#94a3b8" textSize="13" />

      <node
        x={0}
        y={GRID_OFFSET_Y}
        width={SCENE_WIDTH}
        height={GRID_HEIGHT}
        shape="rect"
        backgroundColor="#1f2937"
        zIndex={0}
      />

      {Array.from({ length: store.rows }, (_, row) =>
        Array.from({ length: store.cols }, (_, col) => <CellButton x={col} y={row} />),
      )}

      <group
        x={16}
        y={GRID_OFFSET_Y + GRID_HEIGHT + 8}
        width={120}
        height={32}
        clickable
        onClick={() => commitChange('toggle-flag-mode', (draft: GameState) => toggleFlagMode(draft))}
        zIndex={5}
      >
        <node
          x={0}
          y={0}
          width={120}
          height={32}
          shape="roundedRect(8 8 8 8)"
          backgroundColor={store.flagMode ? '#f59e0b' : '#374151'}
        />
        <text x={0} y={7} width={120} height={18} text={store.flagMode ? '插旗中' : '揭开'} textAlign="center" textColor="#fff" textSize="14" />
      </group>

      <group
        x={184}
        y={GRID_OFFSET_Y + GRID_HEIGHT + 8}
        width={120}
        height={32}
        clickable
        onClick={() => commitChange('restart', (draft: GameState) => restartGame(draft))}
        zIndex={5}
      >
        <node x={0} y={0} width={120} height={32} shape="roundedRect(8 8 8 8)" backgroundColor="#2563eb" />
        <text x={0} y={7} width={120} height={18} text="重新开始" textAlign="center" textColor="#fff" textSize="14" />
      </group>

      {(store.phase === 'won' || store.phase === 'lost') && (
        <group
          x={80}
          y={GRID_OFFSET_Y + Math.floor(GRID_HEIGHT / 2) - 24}
          width={160}
          height={48}
          clickable
          onClick={() => commitChange('restart-overlay', (draft: GameState) => restartGame(draft))}
          zIndex={10}
        >
          <node x={0} y={0} width={160} height={48} shape="roundedRect(10 10 10 10)" backgroundColor="#111827" alpha={0.92} />
          <text
            x={0}
            y={6}
            width={160}
            height={20}
            text={store.phase === 'won' ? '你赢了！' : '游戏结束'}
            textAlign="center"
            textColor={store.phase === 'won' ? '#4ade80' : '#f87171'}
            textSize="16"
          />
          <text x={0} y={26} width={160} height={18} text="点击重开" textAlign="center" textColor="#cbd5e1" textSize="13" />
        </group>
      )}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
