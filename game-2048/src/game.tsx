import { createGameStore, renderGame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'up' | 'down' | 'left' | 'right';

type GameState = {
  phase: 'playing' | 'won' | 'lost';
  grid: number[];
  score: number;
  rngSeed: number;
};

const GRID = 4;
const SIZE = GRID * GRID;
const SCENE_W = 360;
const SCENE_H = 520;
const BOARD_X = 16;
const BOARD_Y = 96;
const BOARD_SIZE = 328;
const BOARD_PAD = 10;
const GAP = 10;
const CELL = (BOARD_SIZE - BOARD_PAD * 2 - GAP * (GRID - 1)) / GRID;

const TILE_BG: Record<number, string> = {
  0: '#cdc1b4',
  2: '#eee4da',
  4: '#ede0c8',
  8: '#f2b179',
  16: '#f59563',
  32: '#f67c5f',
  64: '#f65e3b',
  128: '#edcf72',
  256: '#edcc61',
  512: '#edc850',
  1024: '#edc53f',
  2048: '#edc22e',
};

function tileBackground(value: number): string {
  return TILE_BG[value] ?? '#3c3a32';
}

function tileForeground(value: number): string {
  return value <= 4 ? '#776e65' : '#f9f6f2';
}

function tileFontSize(value: number): string {
  if (value < 100) return '28';
  if (value < 1000) return '24';
  return '20';
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function nextSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function emptyIndices(grid: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < SIZE; i++) {
    if (grid[i] === 0) out.push(i);
  }
  return out;
}

function gridsEqual(a: number[], b: number[]): boolean {
  for (let i = 0; i < SIZE; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function moveLine(line: number[]): { line: number[]; score: number } {
  const filtered = line.filter((c) => c !== 0);
  const result: number[] = [];
  let score = 0;
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      result.push(merged);
      score += merged;
      i += 2;
    } else {
      result.push(filtered[i]);
      i += 1;
    }
  }
  while (result.length < GRID) result.push(0);
  return { line: result.slice(0, GRID), score };
}

function getRow(grid: number[], row: number): number[] {
  const out: number[] = [];
  for (let c = 0; c < GRID; c++) out.push(grid[row * GRID + c]);
  return out;
}

function setRow(grid: number[], row: number, values: number[]): void {
  for (let c = 0; c < GRID; c++) grid[row * GRID + c] = values[c];
}

function getCol(grid: number[], col: number): number[] {
  const out: number[] = [];
  for (let r = 0; r < GRID; r++) out.push(grid[r * GRID + col]);
  return out;
}

function setCol(grid: number[], col: number, values: number[]): void {
  for (let r = 0; r < GRID; r++) grid[r * GRID + col] = values[r];
}

function moveGrid(grid: number[], direction: Direction): { grid: number[]; score: number; changed: boolean } {
  const next = [...grid];
  let totalScore = 0;

  const applyRows = (reverse: boolean) => {
    for (let r = 0; r < GRID; r++) {
      let row = getRow(next, r);
      if (reverse) row = [...row].reverse();
      const { line, score } = moveLine(row);
      totalScore += score;
      const out = reverse ? [...line].reverse() : line;
      setRow(next, r, out);
    }
  };

  const applyCols = (reverse: boolean) => {
    for (let c = 0; c < GRID; c++) {
      let col = getCol(next, c);
      if (reverse) col = [...col].reverse();
      const { line, score } = moveLine(col);
      totalScore += score;
      const out = reverse ? [...line].reverse() : line;
      setCol(next, c, out);
    }
  };

  switch (direction) {
    case 'left':
      applyRows(false);
      break;
    case 'right':
      applyRows(true);
      break;
    case 'up':
      applyCols(false);
      break;
    case 'down':
      applyCols(true);
      break;
  }

  return { grid: next, score: totalScore, changed: !gridsEqual(grid, next) };
}

function spawnTile(grid: number[], seed: number): { grid: number[]; seed: number } {
  const empties = emptyIndices(grid);
  if (empties.length === 0) return { grid, seed };

  const rng = mulberry32(seed);
  const index = empties[Math.floor(rng() * empties.length)];
  const value = rng() < 0.9 ? 2 : 4;
  const next = [...grid];
  next[index] = value;
  return { grid: next, seed: nextSeed(seed) };
}

function has2048(grid: number[]): boolean {
  return grid.some((v) => v >= 2048);
}

function canMove(grid: number[]): boolean {
  if (emptyIndices(grid).length > 0) return true;
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const v = grid[r * GRID + c];
      if (c + 1 < GRID && grid[r * GRID + c + 1] === v) return true;
      if (r + 1 < GRID && grid[(r + 1) * GRID + c] === v) return true;
    }
  }
  return false;
}

function createInitialGrid(seed: number): { grid: number[]; seed: number } {
  let grid = Array<number>(SIZE).fill(0);
  let s = seed;
  ({ grid, seed: s } = spawnTile(grid, s));
  ({ grid, seed: s } = spawnTile(grid, s));
  return { grid, seed: s };
}

const initial = createInitialGrid(0x2048);

const { store, commitChange, storeHistory } = createGameStore(
  {
    phase: 'playing',
    grid: initial.grid,
    score: 0,
    rngSeed: initial.seed,
  } satisfies GameState,
  { enableHistory: true },
);

function tryMove(direction: Direction): void {
  commitChange(`move:${direction}`, (draft: GameState) => {
    if (draft.phase !== 'playing') return;

    const { grid, score, changed } = moveGrid(draft.grid, direction);
    if (!changed) return;

    draft.grid = grid;
    draft.score += score;

    const spawned = spawnTile(draft.grid, draft.rngSeed);
    draft.grid = spawned.grid;
    draft.rngSeed = spawned.seed;

    if (has2048(draft.grid)) draft.phase = 'won';
    else if (!canMove(draft.grid)) draft.phase = 'lost';
  });
}

function restart(): void {
  commitChange('restart', (draft: GameState) => {
    const fresh = createInitialGrid(0x2048 + (draft.rngSeed & 0xffff));
    draft.phase = 'playing';
    draft.grid = fresh.grid;
    draft.score = 0;
    draft.rngSeed = fresh.seed;
  });
}

function handleKey(code: string | undefined): void {
  if (!code) return;
  const map: Record<string, Direction> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    KeyW: 'up',
    KeyS: 'down',
    KeyA: 'left',
    KeyD: 'right',
  };
  const dir = map[code];
  if (dir) tryMove(dir);
}

function cellPosition(index: number): { x: number; y: number } {
  const row = Math.floor(index / GRID);
  const col = index % GRID;
  const x = BOARD_X + BOARD_PAD + col * (CELL + GAP);
  const y = BOARD_Y + BOARD_PAD + row * (CELL + GAP);
  return { x, y };
}

function DirectionButton(props: { label: string; x: number; y: number; onPress: () => void }) {
  return (
    <group x={props.x} y={props.y} width={52} height={40} clickable onClick={props.onPress}>
      <node x={0} y={0} width={52} height={40} shape="roundedRect(8 8 8 8)" backgroundColor="#8f7a66" />
      <text x={0} y={8} width={52} height={24} text={props.label} textAlign="center" textColor="#f9f6f2" textSize="18" />
    </group>
  );
}

function Game() {
  const hint =
    store.phase === 'won' ? '恭喜达成 2048！' : store.phase === 'lost' ? '游戏结束' : '方向键 / WASD 滑动合并';

  return (
    <scene
      id="main"
      width={SCENE_W}
      height={SCENE_H}
      backgroundColor="#faf8ef"
      onKeyDown={(event) => handleKey(event.detail?.code)}
    >
      <text x={16} y={16} width={200} height={32} text="2048" textSize="32" textColor="#776e65" fontWeight="bold" />
      <text x={16} y={52} width={328} height={20} text={hint} textSize="14" textColor="#8f7a66" />

      <group x={16} y={72} width={120} height={28}>
        <node x={0} y={0} width={120} height={28} shape="roundedRect(6 6 6 6)" backgroundColor="#bbada0" />
        <text x={8} y={4} width={104} height={12} text="分数" textSize="11" textColor="#eee4da" />
        <text x={8} y={14} width={104} height={14} text={String(store.score)} textSize="16" textColor="#ffffff" fontWeight="bold" />
      </group>

      <group x={260} y={72} width={84} height={28} clickable onClick={restart}>
        <node x={0} y={0} width={84} height={28} shape="roundedRect(6 6 6 6)" backgroundColor="#8f7a66" />
        <text x={0} y={5} width={84} height={18} text="重来" textAlign="center" textColor="#f9f6f2" textSize="14" />
      </group>

      <node x={BOARD_X} y={BOARD_Y} width={BOARD_SIZE} height={BOARD_SIZE} shape="roundedRect(8 8 8 8)" backgroundColor="#bbada0" />

      {store.grid.map((value, index) => {
        const { x, y } = cellPosition(index);
        const bg = value === 0 ? TILE_BG[0] : tileBackground(value);
        return (
          <group x={x} y={y} width={CELL} height={CELL}>
            <node x={0} y={0} width={CELL} height={CELL} shape="roundedRect(6 6 6 6)" backgroundColor={bg} />
            {value > 0 ? (
              <text
                x={0}
                y={value < 100 ? 18 : 20}
                width={CELL}
                height={32}
                text={String(value)}
                textAlign="center"
                textColor={tileForeground(value)}
                textSize={tileFontSize(value)}
                fontWeight="bold"
              />
            ) : null}
          </group>
        );
      })}

      <DirectionButton label="↑" x={154} y={440} onPress={() => tryMove('up')} />
      <DirectionButton label="←" x={94} y={488} onPress={() => tryMove('left')} />
      <DirectionButton label="↓" x={154} y={488} onPress={() => tryMove('down')} />
      <DirectionButton label="→" x={214} y={488} onPress={() => tryMove('right')} />

      {store.phase !== 'playing' ? (
        <group x={0} y={0} width={SCENE_W} height={SCENE_H} zIndex={100}>
          <node x={0} y={0} width={SCENE_W} height={SCENE_H} backgroundColor="#00000055" />
          <group x={48} y={200} width={264} height={100}>
            <node x={0} y={0} width={264} height={100} shape="roundedRect(12 12 12 12)" backgroundColor="#faf8ef" />
            <text
              x={16}
              y={20}
              width={232}
              height={28}
              text={store.phase === 'won' ? '你赢了！' : '无法继续移动'}
              textAlign="center"
              textSize="22"
              textColor="#776e65"
              fontWeight="bold"
            />
            <text x={16} y={52} width={232} height={20} text={`得分 ${store.score}`} textAlign="center" textSize="14" textColor="#8f7a66" />
            <group x={72} y={68} width={120} height={28} clickable onClick={restart}>
              <node x={0} y={0} width={120} height={28} shape="roundedRect(6 6 6 6)" backgroundColor="#8f7a66" />
              <text x={0} y={5} width={120} height={18} text="再玩一次" textAlign="center" textColor="#f9f6f2" textSize="14" />
            </group>
          </group>
        </group>
      ) : null}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
