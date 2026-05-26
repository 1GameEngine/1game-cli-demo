import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'up' | 'down' | 'left' | 'right';

type Cell = {
  x: number;
  y: number;
};

type GameState = {
  phase: 'playing' | 'game-over';
  snake: Cell[];
  direction: Direction;
  pendingDirection: Direction;
  food: Cell;
  score: number;
  bestScore: number;
  seed: number;
  moveAccumulatorMs: number;
};

const GRID_COLS = 20;
const GRID_ROWS = 14;
const CELL_SIZE = 16;
const HUD_HEIGHT = 44;
const SCENE_WIDTH = GRID_COLS * CELL_SIZE;
const SCENE_HEIGHT = HUD_HEIGHT + GRID_ROWS * CELL_SIZE;
const MOVE_INTERVAL_MS = 120;
const INITIAL_SEED = 20260526;

const INITIAL_SNAKE: Cell[] = [
  { x: 8, y: 6 },
  { x: 7, y: 6 },
  { x: 6, y: 6 },
];

function nextSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function nextRandom(seed: number, maxExclusive: number): { value: number; seed: number } {
  const updatedSeed = nextSeed(seed);
  return { value: updatedSeed % maxExclusive, seed: updatedSeed };
}

function isSameCell(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}

function isOppositeDirection(current: Direction, incoming: Direction): boolean {
  return (
    (current === 'up' && incoming === 'down') ||
    (current === 'down' && incoming === 'up') ||
    (current === 'left' && incoming === 'right') ||
    (current === 'right' && incoming === 'left')
  );
}

function directionToVector(direction: Direction): Cell {
  if (direction === 'up') return { x: 0, y: -1 };
  if (direction === 'down') return { x: 0, y: 1 };
  if (direction === 'left') return { x: -1, y: 0 };
  return { x: 1, y: 0 };
}

function cloneSnake(snake: Cell[]): Cell[] {
  return snake.map((segment) => ({ x: segment.x, y: segment.y }));
}

function spawnFood(snake: Cell[], seed: number): { food: Cell; seed: number } {
  let currentSeed = seed;
  const maxAttempts = GRID_COLS * GRID_ROWS * 2;

  for (let i = 0; i < maxAttempts; i += 1) {
    const xPick = nextRandom(currentSeed, GRID_COLS);
    const yPick = nextRandom(xPick.seed, GRID_ROWS);
    currentSeed = yPick.seed;

    const candidate = { x: xPick.value, y: yPick.value };
    const occupied = snake.some((segment) => isSameCell(segment, candidate));
    if (!occupied) {
      return { food: candidate, seed: currentSeed };
    }
  }

  for (let y = 0; y < GRID_ROWS; y += 1) {
    for (let x = 0; x < GRID_COLS; x += 1) {
      const fallback = { x, y };
      const occupied = snake.some((segment) => isSameCell(segment, fallback));
      if (!occupied) {
        return { food: fallback, seed: currentSeed };
      }
    }
  }

  return { food: { x: 0, y: 0 }, seed: currentSeed };
}

function buildInitialState(bestScore = 0, seed = INITIAL_SEED): GameState {
  const snake = cloneSnake(INITIAL_SNAKE);
  const spawned = spawnFood(snake, seed);

  return {
    phase: 'playing',
    snake,
    direction: 'right',
    pendingDirection: 'right',
    food: spawned.food,
    score: 0,
    bestScore,
    seed: spawned.seed,
    moveAccumulatorMs: 0,
  };
}

const { store, commitChange, storeHistory } = createGameStore(buildInitialState(), { enableHistory: true });

function requestDirection(direction: Direction): void {
  commitChange(`input:${direction}`, (draft: GameState) => {
    if (draft.phase !== 'playing') return;
    if (isOppositeDirection(draft.direction, direction)) return;
    draft.pendingDirection = direction;
  });
}

function restartGame(): void {
  commitChange('restart', (draft: GameState) => {
    const nextState = buildInitialState(Math.max(draft.bestScore, draft.score), draft.seed);
    draft.phase = nextState.phase;
    draft.snake = nextState.snake;
    draft.direction = nextState.direction;
    draft.pendingDirection = nextState.pendingDirection;
    draft.food = nextState.food;
    draft.score = nextState.score;
    draft.bestScore = nextState.bestScore;
    draft.seed = nextState.seed;
    draft.moveAccumulatorMs = nextState.moveAccumulatorMs;
  });
}

function stepSnake(draft: GameState): void {
  draft.direction = draft.pendingDirection;
  const movement = directionToVector(draft.direction);
  const head = draft.snake[0];
  const nextHead = { x: head.x + movement.x, y: head.y + movement.y };

  const hitWall =
    nextHead.x < 0 || nextHead.y < 0 || nextHead.x >= GRID_COLS || nextHead.y >= GRID_ROWS;
  if (hitWall) {
    draft.phase = 'game-over';
    draft.bestScore = Math.max(draft.bestScore, draft.score);
    return;
  }

  const willEat = isSameCell(nextHead, draft.food);
  const hitBody = draft.snake.some((segment, index) => {
    if (!willEat && index === draft.snake.length - 1) return false;
    return isSameCell(segment, nextHead);
  });

  if (hitBody) {
    draft.phase = 'game-over';
    draft.bestScore = Math.max(draft.bestScore, draft.score);
    return;
  }

  draft.snake = [nextHead, ...draft.snake];
  if (willEat) {
    draft.score += 1;
    const spawned = spawnFood(draft.snake, draft.seed);
    draft.food = spawned.food;
    draft.seed = spawned.seed;
    return;
  }

  draft.snake.pop();
}

function Game() {
  useFrame((frame) => {
    const deltaMs = Math.min(frame.deltaSeconds, 0.2) * 1000;
    commitChange('tick', (draft: GameState) => {
      if (draft.phase !== 'playing') return;

      draft.moveAccumulatorMs += deltaMs;
      while (draft.moveAccumulatorMs >= MOVE_INTERVAL_MS && draft.phase === 'playing') {
        draft.moveAccumulatorMs -= MOVE_INTERVAL_MS;
        stepSnake(draft);
      }
    });
  });

  return (
    <scene
      id="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#0f172a"
      onKeyDown={(event) => {
        const code = event.detail?.code;
        if (code === 'ArrowUp' || code === 'KeyW') requestDirection('up');
        if (code === 'ArrowDown' || code === 'KeyS') requestDirection('down');
        if (code === 'ArrowLeft' || code === 'KeyA') requestDirection('left');
        if (code === 'ArrowRight' || code === 'KeyD') requestDirection('right');
        if (code === 'Space' && store.phase === 'game-over') restartGame();
      }}
    >
      <text x={10} y={8} width={190} height={20} text={`Score: ${store.score}`} textColor="#f8fafc" textSize="18" />
      <text
        x={200}
        y={8}
        width={110}
        height={20}
        text={`Best: ${store.bestScore}`}
        textColor="#93c5fd"
        textAlign="right"
        textSize="18"
      />

      <node x={0} y={HUD_HEIGHT} width={SCENE_WIDTH} height={GRID_ROWS * CELL_SIZE} backgroundColor="#111827" />

      <node
        x={store.food.x * CELL_SIZE + 2}
        y={HUD_HEIGHT + store.food.y * CELL_SIZE + 2}
        width={CELL_SIZE - 4}
        height={CELL_SIZE - 4}
        shape="circular"
        backgroundColor="#ef4444"
      />

      {store.snake.map((segment, index) => (
        <node
          x={segment.x * CELL_SIZE + 1}
          y={HUD_HEIGHT + segment.y * CELL_SIZE + 1}
          width={CELL_SIZE - 2}
          height={CELL_SIZE - 2}
          shape="roundedRect(4 4 4 4)"
          backgroundColor={index === 0 ? '#22c55e' : '#16a34a'}
        />
      ))}

      <group x={8} y={SCENE_HEIGHT - 36} width={72} height={28} clickable onClick={() => requestDirection('left')}>
        <node x={0} y={0} width={72} height={28} shape="roundedRect(6 6 6 6)" backgroundColor="#334155" />
        <text x={0} y={6} width={72} height={16} text="LEFT" textAlign="center" textColor="#f1f5f9" textSize="14" />
      </group>

      <group x={84} y={SCENE_HEIGHT - 36} width={72} height={28} clickable onClick={() => requestDirection('up')}>
        <node x={0} y={0} width={72} height={28} shape="roundedRect(6 6 6 6)" backgroundColor="#334155" />
        <text x={0} y={6} width={72} height={16} text="UP" textAlign="center" textColor="#f1f5f9" textSize="14" />
      </group>

      <group x={160} y={SCENE_HEIGHT - 36} width={72} height={28} clickable onClick={() => requestDirection('down')}>
        <node x={0} y={0} width={72} height={28} shape="roundedRect(6 6 6 6)" backgroundColor="#334155" />
        <text x={0} y={6} width={72} height={16} text="DOWN" textAlign="center" textColor="#f1f5f9" textSize="14" />
      </group>

      <group x={236} y={SCENE_HEIGHT - 36} width={72} height={28} clickable onClick={() => requestDirection('right')}>
        <node x={0} y={0} width={72} height={28} shape="roundedRect(6 6 6 6)" backgroundColor="#334155" />
        <text x={0} y={6} width={72} height={16} text="RIGHT" textAlign="center" textColor="#f1f5f9" textSize="14" />
      </group>

      {store.phase === 'game-over' && (
        <group x={56} y={112} width={208} height={72}>
          <node x={0} y={0} width={208} height={72} shape="roundedRect(10 10 10 10)" backgroundColor="#1e293b" />
          <text x={0} y={12} width={208} height={18} text="GAME OVER" textAlign="center" textColor="#f8fafc" textSize="18" />
          <text
            x={0}
            y={36}
            width={208}
            height={16}
            text="Press SPACE to restart"
            textAlign="center"
            textColor="#93c5fd"
            textSize="14"
          />
        </group>
      )}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
