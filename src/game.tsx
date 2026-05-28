import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'up' | 'down' | 'left' | 'right';
type GamePhase = 'playing' | 'won' | 'lost';
type Cell = {
  x: number;
  y: number;
};

type GameState = {
  phase: GamePhase;
  score: number;
  snake: Cell[];
  direction: Direction;
  nextDirection: Direction;
  food: Cell;
  tickRemainderMs: number;
  rngSeed: number;
};

const BOARD_COLS = 20;
const BOARD_ROWS = 20;
const CELL_SIZE = 16;
const HUD_HEIGHT = 48;
const SCENE_WIDTH = BOARD_COLS * CELL_SIZE;
const SCENE_HEIGHT = HUD_HEIGHT + BOARD_ROWS * CELL_SIZE;
const STEP_MS = 120;
const INITIAL_SEED = 20260528;

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
};

function isOpposite(a: Direction, b: Direction): boolean {
  return (a === 'up' && b === 'down')
    || (a === 'down' && b === 'up')
    || (a === 'left' && b === 'right')
    || (a === 'right' && b === 'left');
}

function cellEquals(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}

function moveCell(cell: Cell, direction: Direction): Cell {
  if (direction === 'up') return { x: cell.x, y: cell.y - 1 };
  if (direction === 'down') return { x: cell.x, y: cell.y + 1 };
  if (direction === 'left') return { x: cell.x - 1, y: cell.y };
  return { x: cell.x + 1, y: cell.y };
}

function isInsideBoard(cell: Cell): boolean {
  return cell.x >= 0 && cell.x < BOARD_COLS && cell.y >= 0 && cell.y < BOARD_ROWS;
}

function nextSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function createInitialSnake(): Cell[] {
  const centerX = Math.floor(BOARD_COLS / 2);
  const centerY = Math.floor(BOARD_ROWS / 2);
  return [
    { x: centerX, y: centerY },
    { x: centerX - 1, y: centerY },
    { x: centerX - 2, y: centerY },
  ];
}

function spawnFood(snake: Cell[], seed: number): { food: Cell; seed: number } {
  const occupied = new Set(snake.map((segment) => `${segment.x}:${segment.y}`));
  const freeCells: Cell[] = [];
  for (let y = 0; y < BOARD_ROWS; y += 1) {
    for (let x = 0; x < BOARD_COLS; x += 1) {
      if (!occupied.has(`${x}:${y}`)) {
        freeCells.push({ x, y });
      }
    }
  }

  if (freeCells.length === 0) {
    return { food: { x: 0, y: 0 }, seed };
  }

  const updatedSeed = nextSeed(seed);
  const index = updatedSeed % freeCells.length;
  return { food: freeCells[index], seed: updatedSeed };
}

function createInitialState(seed: number): GameState {
  const snake = createInitialSnake();
  const spawned = spawnFood(snake, seed);
  return {
    phase: 'playing',
    score: 0,
    snake,
    direction: 'right',
    nextDirection: 'right',
    food: spawned.food,
    tickRemainderMs: 0,
    rngSeed: spawned.seed,
  };
}

function resetGame(draft: GameState): void {
  const next = createInitialState(draft.rngSeed || INITIAL_SEED);
  draft.phase = next.phase;
  draft.score = next.score;
  draft.snake = next.snake;
  draft.direction = next.direction;
  draft.nextDirection = next.nextDirection;
  draft.food = next.food;
  draft.tickRemainderMs = next.tickRemainderMs;
  draft.rngSeed = next.rngSeed;
}

function queueDirectionChange(draft: GameState, requested: Direction): void {
  if (draft.phase !== 'playing') return;
  if (isOpposite(requested, draft.nextDirection) && draft.snake.length > 1) return;
  draft.nextDirection = requested;
}

function stepSnake(draft: GameState): void {
  const direction = draft.nextDirection;
  const head = draft.snake[0];
  const nextHead = moveCell(head, direction);
  draft.direction = direction;

  if (!isInsideBoard(nextHead)) {
    draft.phase = 'lost';
    return;
  }

  const willGrow = cellEquals(nextHead, draft.food);
  const collisionBody = willGrow ? draft.snake : draft.snake.slice(0, -1);
  if (collisionBody.some((segment) => cellEquals(segment, nextHead))) {
    draft.phase = 'lost';
    return;
  }

  const nextSnake = [nextHead, ...draft.snake];
  if (!willGrow) {
    nextSnake.pop();
  }
  draft.snake = nextSnake;

  if (!willGrow) return;

  draft.score += 1;
  if (nextSnake.length === BOARD_COLS * BOARD_ROWS) {
    draft.phase = 'won';
    return;
  }

  const spawned = spawnFood(nextSnake, draft.rngSeed);
  draft.food = spawned.food;
  draft.rngSeed = spawned.seed;
}

function advanceGame(draft: GameState, deltaMs: number): void {
  if (draft.phase !== 'playing') return;
  draft.tickRemainderMs += deltaMs;
  while (draft.tickRemainderMs >= STEP_MS && draft.phase === 'playing') {
    draft.tickRemainderMs -= STEP_MS;
    stepSnake(draft);
  }
}

const { store, commitChange, storeHistory } = createGameStore(createInitialState(INITIAL_SEED), { enableHistory: true });

function setDirection(direction: Direction): void {
  commitChange(`direction:${direction}`, (draft: GameState) => {
    queueDirectionChange(draft, direction);
  });
}

function statusText(phase: GamePhase): string {
  if (phase === 'won') return 'YOU WIN!';
  if (phase === 'lost') return 'GAME OVER';
  return 'Use Arrows / WASD';
}

function Game() {
  useFrame((frame) => {
    const deltaMs = Math.min(frame.deltaSeconds, 0.05) * 1000;
    commitChange('tick', (draft: GameState) => {
      advanceGame(draft, deltaMs);
    });
  });

  return (
    <scene
      id="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#0b1020"
      onKeyDown={(event) => {
        const code = event.detail?.code;
        if (!code) return;
        const direction = KEY_TO_DIRECTION[code];
        if (direction) {
          setDirection(direction);
        }
      }}
    >
      <node x={0} y={0} width={SCENE_WIDTH} height={HUD_HEIGHT} backgroundColor="#111a34" />
      <text
        x={10}
        y={8}
        width={170}
        height={20}
        text={`Score: ${store.score}`}
        textSize="16"
        textColor="#f8fafc"
      />
      <text
        x={180}
        y={8}
        width={130}
        height={20}
        text={statusText(store.phase)}
        textAlign="right"
        textSize="14"
        textColor={store.phase === 'playing' ? '#fcd34d' : '#f87171'}
      />

      <group
        x={10}
        y={26}
        width={110}
        height={18}
        clickable
        onClick={() => {
          commitChange('restart', (draft: GameState) => {
            resetGame(draft);
          });
        }}
      >
        <node x={0} y={0} width={110} height={18} shape="roundedRect(6 6 6 6)" backgroundColor="#2563eb" />
        <text x={0} y={2} width={110} height={14} text="Restart" textAlign="center" textSize="12" textColor="#ffffff" />
      </group>

      <group x={0} y={HUD_HEIGHT} width={SCENE_WIDTH} height={SCENE_WIDTH}>
        <node x={0} y={0} width={SCENE_WIDTH} height={SCENE_WIDTH} backgroundColor="#0f172a" />

        <node
          x={store.food.x * CELL_SIZE + 2}
          y={store.food.y * CELL_SIZE + 2}
          width={CELL_SIZE - 4}
          height={CELL_SIZE - 4}
          shape="circular"
          backgroundColor="#f97316"
        />

        {store.snake.map((segment, index) => (
          <node
            x={segment.x * CELL_SIZE + 1}
            y={segment.y * CELL_SIZE + 1}
            width={CELL_SIZE - 2}
            height={CELL_SIZE - 2}
            shape="roundedRect(4 4 4 4)"
            backgroundColor={index === 0 ? '#22d3ee' : '#14b8a6'}
          />
        ))}
      </group>
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
