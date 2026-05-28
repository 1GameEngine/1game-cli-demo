import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'up' | 'down' | 'left' | 'right';
type Phase = 'playing' | 'lost';

type Point = { x: number; y: number };

type GameState = {
  phase: Phase;
  score: number;
  cols: number;
  rows: number;
  cellSize: number;
  snake: Point[];
  direction: Direction;
  pendingDirection: Direction;
  food: Point;
  moveTimerMs: number;
  moveIntervalMs: number;
  rngSeed: number;
};

const SCENE_WIDTH = 320;
const SCENE_HEIGHT = 222;
const HUD_HEIGHT = 22;
const CONTROLS_HEIGHT = 40;
const CELL_SIZE = 10;
const COLS = SCENE_WIDTH / CELL_SIZE;
const ROWS = (SCENE_HEIGHT - HUD_HEIGHT - CONTROLS_HEIGHT) / CELL_SIZE;
const GRID_OFFSET_Y = HUD_HEIGHT;
const MOVE_INTERVAL_MS = 140;

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const DIRECTION_DELTA: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function nextRng(seed: number): [number, number] {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return [next, next / 0x100000000];
}

function pointsEqual(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function isOnSnake(snake: Point[], point: Point): boolean {
  return snake.some((segment) => pointsEqual(segment, point));
}

function spawnFood(draft: GameState): void {
  let attempts = 0;
  let seed = draft.rngSeed;

  while (attempts < COLS * ROWS) {
    let rand: number;
    [seed, rand] = nextRng(seed);
    const x = Math.floor(rand * draft.cols);
    [seed, rand] = nextRng(seed);
    const y = Math.floor(rand * draft.rows);
    const candidate = { x, y };

    if (!isOnSnake(draft.snake, candidate)) {
      draft.food = candidate;
      draft.rngSeed = seed;
      return;
    }

    attempts += 1;
  }

  draft.food = { x: -1, y: -1 };
  draft.rngSeed = seed;
}

function createInitialState(): GameState {
  const snake: Point[] = [
    { x: 8, y: 8 },
    { x: 7, y: 8 },
    { x: 6, y: 8 },
  ];

  const state: GameState = {
    phase: 'playing',
    score: 0,
    cols: COLS,
    rows: ROWS,
    cellSize: CELL_SIZE,
    snake,
    direction: 'right',
    pendingDirection: 'right',
    food: { x: 14, y: 8 },
    moveTimerMs: 0,
    moveIntervalMs: MOVE_INTERVAL_MS,
    rngSeed: 42,
  };

  spawnFood(state);
  return state;
}

function setDirection(draft: GameState, direction: Direction): void {
  if (draft.phase !== 'playing') return;
  if (direction === OPPOSITE[draft.direction]) return;
  draft.pendingDirection = direction;
}

function restartGame(draft: GameState): void {
  const fresh = createInitialState();
  draft.phase = fresh.phase;
  draft.score = fresh.score;
  draft.snake = fresh.snake;
  draft.direction = fresh.direction;
  draft.pendingDirection = fresh.pendingDirection;
  draft.food = fresh.food;
  draft.moveTimerMs = fresh.moveTimerMs;
  draft.rngSeed = fresh.rngSeed;
}

function moveSnake(draft: GameState): void {
  if (draft.phase !== 'playing') return;

  draft.direction = draft.pendingDirection;
  const delta = DIRECTION_DELTA[draft.direction];
  const head = draft.snake[0];
  const nextHead = { x: head.x + delta.x, y: head.y + delta.y };

  if (nextHead.x < 0 || nextHead.x >= draft.cols || nextHead.y < 0 || nextHead.y >= draft.rows) {
    draft.phase = 'lost';
    return;
  }

  if (isOnSnake(draft.snake, nextHead)) {
    draft.phase = 'lost';
    return;
  }

  draft.snake.unshift(nextHead);

  if (pointsEqual(nextHead, draft.food)) {
    draft.score += 1;
    spawnFood(draft);
    draft.moveIntervalMs = Math.max(70, MOVE_INTERVAL_MS - draft.score * 4);
  } else {
    draft.snake.pop();
  }
}

function tickGame(draft: GameState, deltaSeconds: number): void {
  if (draft.phase !== 'playing') return;

  draft.moveTimerMs += deltaSeconds * 1000;
  while (draft.moveTimerMs >= draft.moveIntervalMs) {
    draft.moveTimerMs -= draft.moveIntervalMs;
    moveSnake(draft);
    if (draft.phase !== 'playing') break;
  }
}

const { store, commitChange, storeHistory } = createGameStore(createInitialState(), { enableHistory: true });

function handleKeyDown(code: string | undefined): void {
  if (code === 'ArrowUp' || code === 'KeyW') {
    commitChange('input:up', (draft: GameState) => setDirection(draft, 'up'));
  }
  if (code === 'ArrowDown' || code === 'KeyS') {
    commitChange('input:down', (draft: GameState) => setDirection(draft, 'down'));
  }
  if (code === 'ArrowLeft' || code === 'KeyA') {
    commitChange('input:left', (draft: GameState) => setDirection(draft, 'left'));
  }
  if (code === 'ArrowRight' || code === 'KeyD') {
    commitChange('input:right', (draft: GameState) => setDirection(draft, 'right'));
  }
  if (code === 'Space' || code === 'Enter') {
    commitChange('restart', (draft: GameState) => {
      if (draft.phase === 'lost') restartGame(draft);
    });
  }
}

function DirectionButton(props: { label: string; x: number; y: number; direction: Direction }): unknown {
  return (
    <group
      x={props.x}
      y={props.y}
      width={36}
      height={28}
      clickable
      onPointerDown={() => {
        commitChange(`touch:${props.direction}`, (draft: GameState) => setDirection(draft, props.direction));
      }}
    >
      <node x={0} y={0} width={36} height={28} shape="roundedRect(6 6 6 6)" backgroundColor="#374151" />
      <text x={0} y={5} width={36} height={18} text={props.label} textAlign="center" textColor="#fff" textSize="14" />
    </group>
  );
}

function Game(): unknown {
  useFrame((frame) => {
    const deltaSeconds = Math.min(frame.deltaSeconds, 0.05);
    commitChange('tick', (draft: GameState) => tickGame(draft, deltaSeconds));
  });

  return (
    <scene
      id="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#0b1220"
      onKeyDown={(event) => handleKeyDown(event.detail?.code)}
    >
      <text x={8} y={6} width={160} height={18} text={`得分: ${store.score}`} textColor="#e2e8f0" textSize="14" />
      <text
        x={160}
        y={6}
        width={152}
        height={18}
        text={store.phase === 'lost' ? '游戏结束' : '方向键 / WASD'}
        textAlign="right"
        textColor={store.phase === 'lost' ? '#f87171' : '#94a3b8'}
        textSize="14"
      />

      <node x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} shape="rect" backgroundColor="#111827" zIndex={-1} />

      {store.snake.map((segment, index) => (
        <node
          x={segment.x * store.cellSize + 1}
          y={GRID_OFFSET_Y + segment.y * store.cellSize + 1}
          width={store.cellSize - 2}
          height={store.cellSize - 2}
          shape={index === 0 ? 'roundedRect(2 2 2 2)' : 'rect'}
          backgroundColor={index === 0 ? '#4ade80' : '#22c55e'}
          zIndex={1}
        />
      ))}

      {store.food.x >= 0 && (
        <node
          x={store.food.x * store.cellSize + 1}
          y={GRID_OFFSET_Y + store.food.y * store.cellSize + 1}
          width={store.cellSize - 2}
          height={store.cellSize - 2}
          shape="circular"
          backgroundColor="#f87171"
          zIndex={2}
        />
      )}

      {store.phase === 'lost' && (
        <group
          x={80}
          y={GRID_OFFSET_Y + 40}
          width={160}
          height={40}
          clickable
          onClick={() => commitChange('restart', (draft: GameState) => restartGame(draft))}
          zIndex={10}
        >
          <node x={0} y={0} width={160} height={40} shape="roundedRect(8 8 8 8)" backgroundColor="#2563eb" />
          <text x={0} y={10} width={160} height={20} text="重新开始" textAlign="center" textColor="#fff" textSize="16" />
        </group>
      )}

      <DirectionButton label="↑" x={142} y={182} direction="up" />
      <DirectionButton label="←" x={106} y={196} direction="left" />
      <DirectionButton label="↓" x={142} y={196} direction="down" />
      <DirectionButton label="→" x={178} y={196} direction="right" />
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
