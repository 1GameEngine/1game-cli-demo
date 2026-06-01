import { createGameStore, useFrame, renderGame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'up' | 'down' | 'left' | 'right';
type Phase = 'ready' | 'playing' | 'gameover';

type GameState = {
  phase: Phase;
  score: number;
  direction: Direction;
  nextDirection: Direction;
  snake: { x: number; y: number }[];
  food: { x: number; y: number };
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const COLS = 18;
const ROWS = 32;
const CELL = SCENE_WIDTH / COLS;
const TICK_MS = 140;
const MIN_SWIPE = 24;

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const DIR_DELTA: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

function makeInitialState(): GameState {
  const head = { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) };
  return {
    phase: 'ready',
    score: 0,
    direction: 'right',
    nextDirection: 'right',
    snake: [head, { x: head.x - 1, y: head.y }, { x: head.x - 2, y: head.y }],
    food: { x: head.x + 5, y: head.y },
  };
}

function randomFood(snake: { x: number; y: number }[]): { x: number; y: number } {
  const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
  let x = 0;
  let y = 0;
  do {
    x = Math.floor(Math.random() * COLS);
    y = Math.floor(Math.random() * ROWS);
  } while (occupied.has(`${x},${y}`));
  return { x, y };
}

function tickSnake(draft: GameState): void {
  if (draft.phase !== 'playing') return;

  draft.direction = draft.nextDirection;
  const { dx, dy } = DIR_DELTA[draft.direction];
  const head = draft.snake[0];
  const next = { x: head.x + dx, y: head.y + dy };

  if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS) {
    draft.phase = 'gameover';
    return;
  }

  const eating = next.x === draft.food.x && next.y === draft.food.y;
  const collisionBody = eating ? draft.snake : draft.snake.slice(0, -1);
  if (collisionBody.some((seg) => seg.x === next.x && seg.y === next.y)) {
    draft.phase = 'gameover';
    return;
  }

  draft.snake.unshift(next);

  if (eating) {
    draft.score += 1;
    draft.food = randomFood(draft.snake);
  } else {
    draft.snake.pop();
  }
}

const { store, commitChange, storeHistory } = createGameStore(makeInitialState(), {
  enableHistory: true,
});

function queueDirection(dir: Direction): void {
  commitChange(`dir:${dir}`, (draft: GameState) => {
    const current = draft.phase === 'playing' ? draft.nextDirection : draft.direction;
    if (dir === OPPOSITE[current]) return;
    draft.nextDirection = dir;
  });
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

function App() {
  let tickAccMs = 0;
  let swipeStartX = 0;
  let swipeStartY = 0;

  useFrame((frame) => {
    const dtMs = Math.min(frame.deltaSeconds, 0.05) * 1000;
    tickAccMs += dtMs;
    while (tickAccMs >= TICK_MS) {
      tickAccMs -= TICK_MS;
      commitChange('tick', (draft: GameState) => tickSnake(draft));
    }
  });

  const handleSwipeEnd = (endX: number, endY: number) => {
    const dx = endX - swipeStartX;
    const dy = endY - swipeStartY;
    if (Math.abs(dx) < MIN_SWIPE && Math.abs(dy) < MIN_SWIPE) {
      if (store.phase === 'ready') startGame();
      else if (store.phase === 'gameover') restartGame();
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) >= MIN_SWIPE) queueDirection(dx > 0 ? 'right' : 'left');
    } else if (Math.abs(dy) >= MIN_SWIPE) {
      queueDirection(dy > 0 ? 'down' : 'up');
    }
  };

  const statusText =
    store.phase === 'ready'
      ? '滑动控制方向 · 轻触开始'
      : store.phase === 'gameover'
        ? `游戏结束 · 得分 ${store.score} · 轻触重来`
        : `得分 ${store.score}`;

  return (
    <scene
      id="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#0d1117"
      onPointerDown={(e) => {
        swipeStartX = e.x;
        swipeStartY = e.y;
      }}
      onPointerUp={(e) => {
        handleSwipeEnd(e.x, e.y);
      }}
    >
      <text
        x={0}
        y={8}
        width={SCENE_WIDTH}
        height={28}
        text={statusText}
        textAlign="center"
        textSize="18"
        textColor="#e6edf3"
        zIndex={10}
      />

      <group x={0} y={40} width={SCENE_WIDTH} height={ROWS * CELL} zIndex={1}>
        <node
          x={0}
          y={0}
          width={SCENE_WIDTH}
          height={ROWS * CELL}
          shape="rect"
          backgroundColor="#161b22"
          borderWidth={2}
          borderColor="#30363d"
        />

        <node
          x={store.food.x * CELL + 2}
          y={store.food.y * CELL + 2}
          width={CELL - 4}
          height={CELL - 4}
          shape="circular"
          backgroundColor="#f85149"
        />

        {store.snake.map((seg, i) => (
          <node
            x={seg.x * CELL + 1}
            y={seg.y * CELL + 1}
            width={CELL - 2}
            height={CELL - 2}
            shape={i === 0 ? 'roundedRect(4 4 4 4)' : 'rect'}
            backgroundColor={i === 0 ? '#3fb950' : '#238636'}
            zIndex={2}
          />
        ))}
      </group>

      {store.phase === 'ready' && (
        <text
          x={20}
          y={SCENE_HEIGHT - 120}
          width={SCENE_WIDTH - 40}
          height={80}
          text="在屏幕上滑动：上/下/左/右改变蛇头方向"
          textAlign="center"
          textSize="16"
          textColor="#8b949e"
          autoWrap
          zIndex={10}
        />
      )}
    </scene>
  );
}

renderGame(() => <App />, { bindStore: storeHistory });
