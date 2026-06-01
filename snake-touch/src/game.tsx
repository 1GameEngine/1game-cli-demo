import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'up' | 'down' | 'left' | 'right';
type Point = { x: number; y: number };

type GameState = {
  phase: 'ready' | 'playing' | 'gameover';
  score: number;
  snake: Point[];
  direction: Direction;
  queuedDirection: Direction | null;
  food: Point;
  tickMs: number;
  elapsedMs: number;
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const HUD_HEIGHT = 52;
const CELL = 20;
const COLS = Math.floor(SCENE_WIDTH / CELL);
const ROWS = Math.floor((SCENE_HEIGHT - HUD_HEIGHT) / CELL);
const TICK_MS = 140;
const SWIPE_THRESHOLD = 28;

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const DIR_DELTA: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function randomFood(snake: Point[]): Point {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  const free: Point[] = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { x: 0, y: 0 };
  return free[Math.floor(Math.random() * free.length)]!;
}

function makeInitialState(): GameState {
  const head = { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) };
  const snake: Point[] = [
    head,
    { x: head.x - 1, y: head.y },
    { x: head.x - 2, y: head.y },
  ];
  return {
    phase: 'ready',
    score: 0,
    snake,
    direction: 'right',
    queuedDirection: null,
    food: randomFood(snake),
    tickMs: TICK_MS,
    elapsedMs: 0,
  };
}

const { store, commitChange, storeHistory } = createGameStore(makeInitialState(), { enableHistory: true });

let pointerStart: Point | null = null;

function queueDirection(dir: Direction): void {
  commitChange(`dir:${dir}`, (draft: GameState) => {
    if (draft.phase !== 'playing') return;
    if (OPPOSITE[draft.direction] === dir) return;
    draft.queuedDirection = dir;
  });
}

function applySwipe(dx: number, dy: number): void {
  if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
  if (Math.abs(dx) >= Math.abs(dy)) {
    queueDirection(dx > 0 ? 'right' : 'left');
  } else {
    queueDirection(dy > 0 ? 'down' : 'up');
  }
}

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

function stepSnake(draft: GameState): void {
  if (draft.queuedDirection && OPPOSITE[draft.direction] !== draft.queuedDirection) {
    draft.direction = draft.queuedDirection;
  }
  draft.queuedDirection = null;

  const delta = DIR_DELTA[draft.direction];
  const head = draft.snake[0]!;
  const next = { x: head.x + delta.x, y: head.y + delta.y };

  if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS) {
    draft.phase = 'gameover';
    return;
  }

  const bodySet = new Set(draft.snake.map((p) => `${p.x},${p.y}`));
  if (bodySet.has(`${next.x},${next.y}`)) {
    draft.phase = 'gameover';
    return;
  }

  const ate = next.x === draft.food.x && next.y === draft.food.y;
  draft.snake.unshift(next);

  if (ate) {
    draft.score += 1;
    draft.food = randomFood(draft.snake);
    if (draft.tickMs > 80) draft.tickMs = Math.max(80, draft.tickMs - 4);
  } else {
    draft.snake.pop();
  }
}

function Game() {
  useFrame((frame) => {
    const deltaMs = Math.min(frame.deltaSeconds, 0.05) * 1000;
    commitChange('tick', (draft: GameState) => {
      if (draft.phase !== 'playing') return;
      draft.elapsedMs += deltaMs;
      while (draft.elapsedMs >= draft.tickMs) {
        draft.elapsedMs -= draft.tickMs;
        stepSnake(draft);
        if (draft.phase !== 'playing') break;
      }
    });
  });

  const statusText =
    store.phase === 'ready'
      ? '滑动屏幕开始'
      : store.phase === 'gameover'
        ? '游戏结束 · 滑动重玩'
        : '滑动控制方向';

  return (
    <scene
      id="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#0b1f14"
      onPointerDown={(event) => {
        pointerStart = { x: event.x, y: event.y };
      }}
      onPointerUp={(event) => {
        if (!pointerStart) return;
        const dx = event.x - pointerStart.x;
        const dy = event.y - pointerStart.y;
        pointerStart = null;

        if (store.phase === 'ready') {
          startGame();
          applySwipe(dx, dy);
          return;
        }
        if (store.phase === 'gameover') {
          restartGame();
          applySwipe(dx, dy);
          return;
        }
        applySwipe(dx, dy);
      }}
      onPointerCancel={() => {
        pointerStart = null;
      }}
      onKeyDown={(event) => {
        const code = event.detail?.code;
        if (code === 'ArrowUp' || code === 'KeyW') queueDirection('up');
        if (code === 'ArrowDown' || code === 'KeyS') queueDirection('down');
        if (code === 'ArrowLeft' || code === 'KeyA') queueDirection('left');
        if (code === 'ArrowRight' || code === 'KeyD') queueDirection('right');
        if (code === 'Space' || code === 'Enter') {
          if (store.phase === 'ready') startGame();
          if (store.phase === 'gameover') restartGame();
        }
      }}
    >
      <group x={0} y={0} width={SCENE_WIDTH} height={HUD_HEIGHT}>
        <node x={0} y={0} width={SCENE_WIDTH} height={HUD_HEIGHT} shape="rect" backgroundColor="#132a1c" />
        <text
          x={16}
          y={10}
          width={160}
          height={24}
          text={`得分 ${store.score}`}
          textColor="#ecfdf5"
          textSize="20"
        />
        <text
          x={140}
          y={30}
          width={200}
          height={18}
          text={statusText}
          textAlign="right"
          textColor="#86efac"
          textSize="14"
        />
      </group>

      <group x={0} y={HUD_HEIGHT} width={SCENE_WIDTH} height={SCENE_HEIGHT - HUD_HEIGHT}>
        <node
          x={0}
          y={0}
          width={SCENE_WIDTH}
          height={SCENE_HEIGHT - HUD_HEIGHT}
          shape="rect"
          backgroundColor="#123522"
        />

        <node
          x={store.food.x * CELL + 2}
          y={store.food.y * CELL + 2}
          width={CELL - 4}
          height={CELL - 4}
          shape="circular"
          backgroundColor="#f87171"
        />

        {store.snake.map((segment, index) => (
          <node
            x={segment.x * CELL + (index === 0 ? 1 : 2)}
            y={segment.y * CELL + (index === 0 ? 1 : 2)}
            width={index === 0 ? CELL - 2 : CELL - 4}
            height={index === 0 ? CELL - 2 : CELL - 4}
            shape={index === 0 ? 'roundedRect(4 4 4 4)' : 'rect'}
            backgroundColor={index === 0 ? '#4ade80' : '#22c55e'}
            zIndex={store.snake.length - index}
          />
        ))}
      </group>
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
