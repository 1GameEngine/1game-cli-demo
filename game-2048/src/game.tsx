import { createGameStore, renderGame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'up' | 'down' | 'left' | 'right';

type GameState = {
  phase: 'ready' | 'playing' | 'won' | 'lost';
  grid: number[][];
  score: number;
  bestScore: number;
};

const GRID_SIZE = 4;
const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 520;
const PADDING = 24;
const GAP = 10;
const BOARD_SIZE = SCENE_WIDTH - PADDING * 2;
const CELL_SIZE = Math.floor((BOARD_SIZE - GAP * (GRID_SIZE - 1)) / GRID_SIZE);
const BOARD_ORIGIN_X = (SCENE_WIDTH - (CELL_SIZE * GRID_SIZE + GAP * (GRID_SIZE - 1))) / 2;
const BOARD_ORIGIN_Y = 108;

const TILE_STYLE: Record<number, { bg: string; fg: string; size: string }> = {
  0: { bg: '#cdc1b4', fg: '#776e65', size: '0' },
  2: { bg: '#eee4da', fg: '#776e65', size: '28' },
  4: { bg: '#ede0c8', fg: '#776e65', size: '28' },
  8: { bg: '#f2b179', fg: '#f9f6f2', size: '26' },
  16: { bg: '#f59563', fg: '#f9f6f2', size: '26' },
  32: { bg: '#f67c5f', fg: '#f9f6f2', size: '24' },
  64: { bg: '#f65e3b', fg: '#f9f6f2', size: '24' },
  128: { bg: '#edcf72', fg: '#f9f6f2', size: '22' },
  256: { bg: '#edcc61', fg: '#f9f6f2', size: '22' },
  512: { bg: '#edc850', fg: '#f9f6f2', size: '20' },
  1024: { bg: '#edc53f', fg: '#f9f6f2', size: '18' },
  2048: { bg: '#edc22e', fg: '#f9f6f2', size: '18' },
};

function emptyGrid(): number[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

function cloneGrid(grid: number[][]): number[][] {
  return grid.map((row) => [...row]);
}

function tileStyle(value: number) {
  return TILE_STYLE[value] ?? { bg: '#3c3a32', fg: '#f9f6f2', size: '16' };
}

function slideRowLeft(row: number[]): { row: number[]; gained: number } {
  const filtered = row.filter((v) => v !== 0);
  const merged: number[] = [];
  let gained = 0;
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const value = filtered[i] * 2;
      merged.push(value);
      gained += value;
      i += 2;
    } else {
      merged.push(filtered[i]);
      i += 1;
    }
  }
  while (merged.length < GRID_SIZE) merged.push(0);
  return { row: merged, gained };
}

function rowsEqual(a: number[], b: number[]): boolean {
  return a.every((v, i) => v === b[i]);
}

function gridsEqual(a: number[][], b: number[][]): boolean {
  return a.every((row, r) => rowsEqual(row, b[r]));
}

function moveGrid(grid: number[][], direction: Direction): { grid: number[][]; gained: number; moved: boolean } {
  const next = cloneGrid(grid);
  let gained = 0;

  if (direction === 'left') {
    for (let r = 0; r < GRID_SIZE; r++) {
      const result = slideRowLeft(next[r]);
      next[r] = result.row;
      gained += result.gained;
    }
  } else if (direction === 'right') {
    for (let r = 0; r < GRID_SIZE; r++) {
      const reversed = [...next[r]].reverse();
      const result = slideRowLeft(reversed);
      next[r] = result.row.reverse();
      gained += result.gained;
    }
  } else if (direction === 'up') {
    for (let c = 0; c < GRID_SIZE; c++) {
      const col = [next[0][c], next[1][c], next[2][c], next[3][c]];
      const result = slideRowLeft(col);
      for (let r = 0; r < GRID_SIZE; r++) next[r][c] = result.row[r];
      gained += result.gained;
    }
  } else {
    for (let c = 0; c < GRID_SIZE; c++) {
      const col = [next[3][c], next[2][c], next[1][c], next[0][c]];
      const result = slideRowLeft(col);
      const restored = result.row.reverse();
      for (let r = 0; r < GRID_SIZE; r++) next[r][c] = restored[r];
      gained += result.gained;
    }
  }

  return { grid: next, gained, moved: !gridsEqual(grid, next) };
}

function spawnTile(grid: number[][]): void {
  const empty: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) empty.push({ r, c });
    }
  }
  if (empty.length === 0) return;
  const pick = empty[Math.floor(Math.random() * empty.length)];
  grid[pick.r][pick.c] = Math.random() < 0.9 ? 2 : 4;
}

function canMove(grid: number[][]): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) return true;
      if (c + 1 < GRID_SIZE && grid[r][c] === grid[r][c + 1]) return true;
      if (r + 1 < GRID_SIZE && grid[r][c] === grid[r + 1][c]) return true;
    }
  }
  return false;
}

function hasWon(grid: number[][]): boolean {
  return grid.some((row) => row.some((v) => v >= 2048));
}

function makeInitialState(): GameState {
  const grid = emptyGrid();
  spawnTile(grid);
  spawnTile(grid);
  return { phase: 'ready', grid, score: 0, bestScore: 0 };
}

const { store, commitChange, storeHistory } = createGameStore(makeInitialState(), { enableHistory: true });

function startGame(): void {
  commitChange('start', (draft: GameState) => {
    Object.assign(draft, makeInitialState());
    draft.phase = 'playing';
  });
}

function restartGame(): void {
  commitChange('restart', (draft: GameState) => {
    Object.assign(draft, makeInitialState());
    draft.phase = 'playing';
  });
}

function move(direction: Direction): void {
  commitChange(`move:${direction}`, (draft: GameState) => {
    if (draft.phase !== 'playing') return;

    const { grid, gained, moved } = moveGrid(draft.grid, direction);
    if (!moved) return;

    draft.grid = grid;
    draft.score += gained;
    draft.bestScore = Math.max(draft.bestScore, draft.score);
    spawnTile(draft.grid);

    if (hasWon(draft.grid)) {
      draft.phase = 'won';
      return;
    }
    if (!canMove(draft.grid)) {
      draft.phase = 'lost';
    }
  });
}

function cellPosition(row: number, col: number): { x: number; y: number } {
  return {
    x: BOARD_ORIGIN_X + col * (CELL_SIZE + GAP),
    y: BOARD_ORIGIN_Y + row * (CELL_SIZE + GAP),
  };
}

function DirectionButton(props: { label: string; x: number; y: number; onPress: () => void }) {
  return (
    <group x={props.x} y={props.y} width={56} height={40} clickable onClick={props.onPress}>
      <node x={0} y={0} width={56} height={40} shape="roundedRect(8 8 8 8)" backgroundColor="#8f7a66" />
      <text
        x={0}
        y={9}
        width={56}
        height={22}
        text={props.label}
        textAlign="center"
        textColor="#f9f6f2"
        textSize="18"
      />
    </group>
  );
}

function Game() {
  const statusText =
    store.phase === 'ready'
      ? '点击开始'
      : store.phase === 'won'
        ? '达成 2048！'
        : store.phase === 'lost'
          ? '游戏结束'
          : '方向键移动';

  return (
    <scene
      id="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#faf8ef"
      onKeyDown={(event) => {
        const code = event.detail?.code;
        if (code === 'ArrowLeft') move('left');
        if (code === 'ArrowRight') move('right');
        if (code === 'ArrowUp') move('up');
        if (code === 'ArrowDown') move('down');
        if (code === 'Enter' || code === 'Space') {
          if (store.phase === 'ready') startGame();
          if (store.phase === 'won' || store.phase === 'lost') restartGame();
        }
      }}
    >
      <text
        x={PADDING}
        y={20}
        width={140}
        height={36}
        text="2048"
        textSize="32"
        textColor="#776e65"
      />
      <group x={SCENE_WIDTH - PADDING - 120} y={16} width={120} height={56}>
        <node x={0} y={0} width={120} height={56} shape="roundedRect(6 6 6 6)" backgroundColor="#bbada0" />
        <text x={8} y={6} width={104} height={16} text="分数" textAlign="center" textColor="#eee4da" textSize="12" />
        <text
          x={8}
          y={24}
          width={104}
          height={24}
          text={String(store.score)}
          textAlign="center"
          textColor="#ffffff"
          textSize="20"
        />
      </group>

      <text
        x={PADDING}
        y={64}
        width={SCENE_WIDTH - PADDING * 2}
        height={20}
        text={`最高分 ${store.bestScore} · ${statusText}`}
        textColor="#776e65"
        textSize="14"
      />

      <node
        x={BOARD_ORIGIN_X - GAP}
        y={BOARD_ORIGIN_Y - GAP}
        width={CELL_SIZE * GRID_SIZE + GAP * (GRID_SIZE + 1)}
        height={CELL_SIZE * GRID_SIZE + GAP * (GRID_SIZE + 1)}
        shape="roundedRect(8 8 8 8)"
        backgroundColor="#bbada0"
      />

      {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
        const row = Math.floor(index / GRID_SIZE);
        const col = index % GRID_SIZE;
        const pos = cellPosition(row, col);
        return (
          <node
            key={`cell-bg-${row}-${col}`}
            x={pos.x}
            y={pos.y}
            width={CELL_SIZE}
            height={CELL_SIZE}
            shape="roundedRect(4 4 4 4)"
            backgroundColor="#cdc1b4"
          />
        );
      })}

      {store.grid.flatMap((gridRow, row) =>
        gridRow.map((value, col) => {
          if (value === 0) return null;
          const pos = cellPosition(row, col);
          const style = tileStyle(value);
          return (
            <group key={`tile-${row}-${col}-${value}`} x={pos.x} y={pos.y} width={CELL_SIZE} height={CELL_SIZE}>
              <node
                x={0}
                y={0}
                width={CELL_SIZE}
                height={CELL_SIZE}
                shape="roundedRect(4 4 4 4)"
                backgroundColor={style.bg}
              />
              <text
                x={0}
                y={Math.floor((CELL_SIZE - Number(style.size)) / 2) - 2}
                width={CELL_SIZE}
                height={CELL_SIZE}
                text={String(value)}
                textAlign="center"
                textVerticalAlign="center"
                textColor={style.fg}
                textSize={style.size}
              />
            </group>
          );
        }),
      )}

      {store.phase === 'ready' && (
        <group
          x={BOARD_ORIGIN_X}
          y={BOARD_ORIGIN_Y}
          width={CELL_SIZE * GRID_SIZE + GAP * (GRID_SIZE - 1)}
          height={CELL_SIZE * GRID_SIZE + GAP * (GRID_SIZE - 1)}
          clickable
          onClick={startGame}
        >
          <node
            x={0}
            y={0}
            width={CELL_SIZE * GRID_SIZE + GAP * (GRID_SIZE - 1)}
            height={CELL_SIZE * GRID_SIZE + GAP * (GRID_SIZE - 1)}
            alpha={0.55}
            backgroundColor="#eee4da"
          />
          <text
            x={0}
            y={80}
            width={CELL_SIZE * GRID_SIZE + GAP * (GRID_SIZE - 1)}
            height={40}
            text="点击开始"
            textAlign="center"
            textColor="#776e65"
            textSize="28"
          />
        </group>
      )}

      {(store.phase === 'won' || store.phase === 'lost') && (
        <group
          x={BOARD_ORIGIN_X + 24}
          y={BOARD_ORIGIN_Y + 100}
          width={CELL_SIZE * GRID_SIZE + GAP * (GRID_SIZE - 1) - 48}
          height={120}
          clickable
          onClick={restartGame}
        >
          <node
            x={0}
            y={0}
            width={CELL_SIZE * GRID_SIZE + GAP * (GRID_SIZE - 1) - 48}
            height={120}
            shape="roundedRect(8 8 8 8)"
            backgroundColor="#8f7a66"
          />
          <text
            x={0}
            y={24}
            width={CELL_SIZE * GRID_SIZE + GAP * (GRID_SIZE - 1) - 48}
            height={32}
            text={store.phase === 'won' ? '你赢了！' : '没路了'}
            textAlign="center"
            textColor="#f9f6f2"
            textSize="22"
          />
          <text
            x={0}
            y={64}
            width={CELL_SIZE * GRID_SIZE + GAP * (GRID_SIZE - 1) - 48}
            height={24}
            text="再玩一次"
            textAlign="center"
            textColor="#eee4da"
            textSize="16"
          />
        </group>
      )}

      <DirectionButton label="↑" x={152} y={452} onPress={() => move('up')} />
      <DirectionButton label="←" x={88} y={496} onPress={() => move('left')} />
      <DirectionButton label="↓" x={152} y={496} onPress={() => move('down')} />
      <DirectionButton label="→" x={216} y={496} onPress={() => move('right')} />
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
