import { createGameStore, renderGame } from '@1game/engine-bundle/runtime/worker';

type CellState = 'hidden' | 'revealed' | 'flagged';

type Cell = {
  isMine: boolean;
  neighborMines: number;
  state: CellState;
};

type GameState = {
  phase: 'ready' | 'playing' | 'won' | 'lost';
  cols: number;
  rows: number;
  mineCount: number;
  cells: Cell[];
  flagMode: boolean;
  revealedSafe: number;
  minesPlaced: boolean;
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const COLS = 9;
const ROWS = 12;
const MINE_COUNT = 18;
const HUD_HEIGHT = 88;
const BOARD_PADDING = 12;

const NUMBER_COLORS = ['', '#1d4ed8', '#15803d', '#dc2626', '#7c3aed', '#b45309', '#0891b2', '#111827', '#6b7280'];

function makeCells(): Cell[] {
  return Array.from({ length: COLS * ROWS }, () => ({
    isMine: false,
    neighborMines: 0,
    state: 'hidden' as CellState,
  }));
}

function makeInitialState(): GameState {
  return {
    phase: 'ready',
    cols: COLS,
    rows: ROWS,
    mineCount: MINE_COUNT,
    cells: makeCells(),
    flagMode: false,
    revealedSafe: 0,
    minesPlaced: false,
  };
}

const { store, commitChange, storeHistory } = createGameStore(makeInitialState(), { enableHistory: true });

function index(col: number, row: number): number {
  return row * COLS + col;
}

function inBounds(col: number, row: number): boolean {
  return col >= 0 && col < COLS && row >= 0 && row < ROWS;
}

function neighbors(col: number, row: number): Array<[number, number]> {
  const list: Array<[number, number]> = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dc === 0 && dr === 0) continue;
      const nc = col + dc;
      const nr = row + dr;
      if (inBounds(nc, nr)) list.push([nc, nr]);
    }
  }
  return list;
}

function placeMines(draft: GameState, safeCol: number, safeRow: number): void {
  const forbidden = new Set<number>([index(safeCol, safeRow)]);
  for (const [nc, nr] of neighbors(safeCol, safeRow)) {
    forbidden.add(index(nc, nr));
  }

  const candidates: number[] = [];
  for (let i = 0; i < draft.cells.length; i += 1) {
    if (!forbidden.has(i)) candidates.push(i);
  }

  for (let placed = 0; placed < draft.mineCount; placed += 1) {
    const pick = Math.floor(Math.random() * candidates.length);
    const cellIndex = candidates.splice(pick, 1)[0];
    draft.cells[cellIndex].isMine = true;
  }

  for (let row = 0; row < draft.rows; row += 1) {
    for (let col = 0; col < draft.cols; col += 1) {
      const cell = draft.cells[index(col, row)];
      if (cell.isMine) {
        cell.neighborMines = 0;
        continue;
      }
      let count = 0;
      for (const [nc, nr] of neighbors(col, row)) {
        if (draft.cells[index(nc, nr)].isMine) count += 1;
      }
      cell.neighborMines = count;
    }
  }

  draft.minesPlaced = true;
}

function revealCell(draft: GameState, col: number, row: number): void {
  if (draft.phase === 'won' || draft.phase === 'lost') return;

  const cellIndex = index(col, row);
  const cell = draft.cells[cellIndex];

  if (cell.state === 'revealed' || cell.state === 'flagged') return;

  if (!draft.minesPlaced) {
    placeMines(draft, col, row);
    draft.phase = 'playing';
  }

  if (cell.isMine) {
    cell.state = 'revealed';
    draft.phase = 'lost';
    for (const c of draft.cells) {
      if (c.isMine) c.state = 'revealed';
    }
    return;
  }

  const queue: Array<[number, number]> = [[col, row]];
  while (queue.length > 0) {
    const [c, r] = queue.shift()!;
    const i = index(c, r);
    const current = draft.cells[i];
    if (current.state === 'revealed' || current.state === 'flagged') continue;
    if (current.isMine) continue;

    current.state = 'revealed';
    draft.revealedSafe += 1;

    if (current.neighborMines === 0) {
      for (const [nc, nr] of neighbors(c, r)) {
        const neighbor = draft.cells[index(nc, nr)];
        if (neighbor.state === 'hidden' && !neighbor.isMine) {
          queue.push([nc, nr]);
        }
      }
    }
  }

  const totalSafe = draft.cols * draft.rows - draft.mineCount;
  if (draft.revealedSafe >= totalSafe) {
    draft.phase = 'won';
    for (const c of draft.cells) {
      if (c.isMine && c.state !== 'flagged') c.state = 'flagged';
    }
  }
}

function toggleFlag(draft: GameState, col: number, row: number): void {
  if (draft.phase === 'won' || draft.phase === 'lost') return;
  const cell = draft.cells[index(col, row)];
  if (cell.state === 'revealed') return;
  cell.state = cell.state === 'flagged' ? 'hidden' : 'flagged';
  if (draft.phase === 'ready') draft.phase = 'playing';
}

function restartGame(): void {
  commitChange('restart', (draft: GameState) => {
    Object.assign(draft, makeInitialState());
  });
}

function handleCellTap(col: number, row: number): void {
  commitChange('cell tap', (draft: GameState) => {
    if (draft.flagMode) {
      toggleFlag(draft, col, row);
      return;
    }
    revealCell(draft, col, row);
  });
}

function toggleFlagMode(): void {
  commitChange('flag mode', (draft: GameState) => {
    draft.flagMode = !draft.flagMode;
  });
}

function cellBackground(cell: Cell, phase: GameState['phase']): string {
  if (cell.state === 'flagged') return '#f59e0b';
  if (cell.state === 'hidden') return '#4b5563';
  if (cell.isMine) return phase === 'lost' ? '#ef4444' : '#fca5a5';
  return '#e5e7eb';
}

function cellLabel(cell: Cell): string {
  if (cell.state === 'flagged') return '🚩';
  if (cell.state === 'hidden') return '';
  if (cell.isMine) return '💣';
  if (cell.neighborMines === 0) return '';
  return String(cell.neighborMines);
}

function cellTextColor(cell: Cell): string {
  if (cell.state !== 'revealed' || cell.isMine || cell.neighborMines === 0) return '#ffffff';
  return NUMBER_COLORS[cell.neighborMines] ?? '#111827';
}

function Minesweeper() {
  const boardWidth = SCENE_WIDTH - BOARD_PADDING * 2;
  const boardHeight = SCENE_HEIGHT - HUD_HEIGHT - BOARD_PADDING * 2;
  const cellSize = Math.floor(Math.min(boardWidth / COLS, boardHeight / ROWS));
  const gridWidth = cellSize * COLS;
  const gridHeight = cellSize * ROWS;
  const originX = Math.floor((SCENE_WIDTH - gridWidth) / 2);
  const originY = HUD_HEIGHT + Math.floor((SCENE_HEIGHT - HUD_HEIGHT - gridHeight) / 2);

  const flagCount = store.cells.filter((c) => c.state === 'flagged').length;
  const statusText =
    store.phase === 'won'
      ? '胜利！'
      : store.phase === 'lost'
        ? '踩雷了'
        : store.flagMode
          ? '插旗模式'
          : '点开格子';

  return (
    <scene id="main" width={SCENE_WIDTH} height={SCENE_HEIGHT} backgroundColor="#0f172a">
      <text
        x={16}
        y={16}
        width={200}
        height={28}
        text={`扫雷 ${store.mineCount} 雷`}
        textColor="#f8fafc"
        textSize="22"
      />
      <text
        x={16}
        y={46}
        width={220}
        height={22}
        text={`旗: ${flagCount}  已开: ${store.revealedSafe}`}
        textColor="#94a3b8"
        textSize="16"
      />
      <text
        x={200}
        y={16}
        width={144}
        height={52}
        text={statusText}
        textAlign="right"
        textColor={store.phase === 'won' ? '#4ade80' : store.phase === 'lost' ? '#f87171' : '#fbbf24'}
        textSize="18"
      />

      <group x={originX} y={originY} width={gridWidth} height={gridHeight}>
        {store.cells.map((cell, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const x = col * cellSize;
          const y = row * cellSize;
          const gap = 2;
          const inner = cellSize - gap;

          return (
            <group
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              clickable
              onClick={() => handleCellTap(col, row)}
            >
              <node
                x={gap / 2}
                y={gap / 2}
                width={inner}
                height={inner}
                shape="roundedRect(4 4 4 4)"
                backgroundColor={cellBackground(cell, store.phase)}
                borderWidth={cell.state === 'hidden' ? 2 : 1}
                borderColor={cell.state === 'hidden' ? '#6b7280' : '#d1d5db'}
              />
              <text
                x={0}
                y={Math.floor((cellSize - 20) / 2)}
                width={cellSize}
                height={20}
                text={cellLabel(cell)}
                textAlign="center"
                textSize={cell.neighborMines > 0 && cell.state === 'revealed' ? '18' : '14'}
                textColor={cellTextColor(cell)}
              />
            </group>
          );
        })}
      </group>

      <group x={16} y={SCENE_HEIGHT - 64} width={156} height={48} clickable onClick={toggleFlagMode}>
        <node
          x={0}
          y={0}
          width={156}
          height={48}
          shape="roundedRect(10 10 10 10)"
          backgroundColor={store.flagMode ? '#d97706' : '#334155'}
        />
        <text
          x={0}
          y={12}
          width={156}
          height={24}
          text={store.flagMode ? '插旗中' : '插旗'}
          textAlign="center"
          textColor="#ffffff"
          textSize="18"
        />
      </group>

      <group x={188} y={SCENE_HEIGHT - 64} width={156} height={48} clickable onClick={restartGame}>
        <node x={0} y={0} width={156} height={48} shape="roundedRect(10 10 10 10)" backgroundColor="#2563eb" />
        <text x={0} y={12} width={156} height={24} text="重新开始" textAlign="center" textColor="#ffffff" textSize="18" />
      </group>

      <text
        x={16}
        y={SCENE_HEIGHT - 96}
        width={328}
        height={20}
        text="点击格子揭开 · 开启插旗后点击插旗"
        textColor="#64748b"
        textSize="14"
      />
    </scene>
  );
}

renderGame(() => <Minesweeper />, { bindStore: storeHistory });
