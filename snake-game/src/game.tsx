import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'up' | 'down' | 'left' | 'right';
type Phase = 'ready' | 'playing' | 'gameover';
type Cell = { x: number; y: number };

type GameState = {
  phase: Phase;
  score: number;
  snake: Cell[];
  direction: Direction;
  nextDirection: Direction;
  food: Cell;
  tickMs: number;
  swipeStart: { x: number; y: number } | null;
  swipeLast: { x: number; y: number } | null;
};

const SCENE_WIDTH = 320;
const SCENE_HEIGHT = 400;
const HUD_HEIGHT = 36;
const CELL = 16;
const COLS = SCENE_WIDTH / CELL;
const ROWS = (SCENE_HEIGHT - HUD_HEIGHT) / CELL;
const TICK_MS = 140;
const MIN_SWIPE = 28;

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

function randomFood(snake: Cell[]): Cell {
  const occupied = new Set(snake.map((c) => `${c.x},${c.y}`));
  const empty: Cell[] = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) empty.push({ x, y });
    }
  }
  return empty[Math.floor(Math.random() * empty.length)] ?? { x: 0, y: 0 };
}

function makeInitialState(): GameState {
  const head = { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) };
  const snake: Cell[] = [
    head,
    { x: head.x - 1, y: head.y },
    { x: head.x - 2, y: head.y },
  ];
  return {
    phase: 'ready',
    score: 0,
    snake,
    direction: 'right',
    nextDirection: 'right',
    food: randomFood(snake),
    tickMs: 0,
    swipeStart: null,
    swipeLast: null,
  };
}

const { store, commitChange, storeHistory } = createGameStore(makeInitialState(), { enableHistory: true });

function setDirection(draft: GameState, dir: Direction): void {
  if (draft.phase !== 'playing') return;
  if (OPPOSITE[draft.direction] === dir) return;
  draft.nextDirection = dir;
}

function stepSnake(draft: GameState): void {
  draft.direction = draft.nextDirection;

  const head = draft.snake[0];
  const delta: Record<Direction, Cell> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const move = delta[draft.direction];
  const nextHead = { x: head.x + move.x, y: head.y + move.y };

  if (nextHead.x < 0 || nextHead.x >= COLS || nextHead.y < 0 || nextHead.y >= ROWS) {
    draft.phase = 'gameover';
    return;
  }

  const ateFood = nextHead.x === draft.food.x && nextHead.y === draft.food.y;
  const bodyForHitTest = ateFood ? draft.snake : draft.snake.slice(0, -1);
  const hitsSelf = bodyForHitTest.some((seg) => seg.x === nextHead.x && seg.y === nextHead.y);
  if (hitsSelf) {
    draft.phase = 'gameover';
    return;
  }
  draft.snake.unshift(nextHead);

  if (ateFood) {
    draft.score += 1;
    draft.food = randomFood(draft.snake);
  } else {
    draft.snake.pop();
  }
}

function handleSwipe(draft: GameState, dx: number, dy: number): void {
  if (Math.abs(dx) < MIN_SWIPE && Math.abs(dy) < MIN_SWIPE) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    setDirection(draft, dx > 0 ? 'right' : 'left');
  } else {
    setDirection(draft, dy > 0 ? 'down' : 'up');
  }
}

function startPlaying(draft: GameState): void {
  draft.phase = 'playing';
  draft.tickMs = 0;
}

function restart(draft: GameState): void {
  Object.assign(draft, makeInitialState());
  draft.phase = 'ready';
}

function Game() {
  useFrame((frame) => {
    const deltaMs = Math.min(frame.deltaSeconds, 0.05) * 1000;
    commitChange('tick', (draft: GameState) => {
      if (draft.phase !== 'playing') return;
      draft.tickMs += deltaMs;
      while (draft.tickMs >= TICK_MS) {
        draft.tickMs -= TICK_MS;
        stepSnake(draft);
        if (draft.phase !== 'playing') break;
      }
    });
  });

  const statusText =
    store.phase === 'ready'
      ? '滑动或点击开始'
      : store.phase === 'gameover'
        ? `游戏结束 · 得分 ${store.score} · 点击重玩`
        : `得分 ${store.score} · 滑动转向`;

  return (
    <scene
      id="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#0f172a"
      onPointerDown={(event) => {
        commitChange('pointer down', (draft: GameState) => {
          draft.swipeStart = { x: event.x, y: event.y };
          draft.swipeLast = { x: event.x, y: event.y };
        });
      }}
      onPointerMove={(event) => {
        commitChange('pointer move', (draft: GameState) => {
          if (draft.swipeStart) draft.swipeLast = { x: event.x, y: event.y };
        });
      }}
      onPointerUp={(event) => {
        commitChange('pointer up', (draft: GameState) => {
          if (!draft.swipeStart) return;
          const end = draft.swipeLast ?? { x: event.x, y: event.y };
          const dx = end.x - draft.swipeStart.x;
          const dy = end.y - draft.swipeStart.y;
          draft.swipeStart = null;
          draft.swipeLast = null;

          if (draft.phase === 'ready') {
            startPlaying(draft);
            handleSwipe(draft, dx, dy);
            return;
          }
          if (draft.phase === 'gameover') {
            restart(draft);
            return;
          }
          handleSwipe(draft, dx, dy);
        });
      }}
      onKeyDown={(event) => {
        const code = event.detail?.code;
        commitChange('key down', (draft: GameState) => {
          if (draft.phase === 'ready') startPlaying(draft);
          if (draft.phase === 'gameover') return;
          if (code === 'ArrowUp' || code === 'KeyW') setDirection(draft, 'up');
          if (code === 'ArrowDown' || code === 'KeyS') setDirection(draft, 'down');
          if (code === 'ArrowLeft' || code === 'KeyA') setDirection(draft, 'left');
          if (code === 'ArrowRight' || code === 'KeyD') setDirection(draft, 'right');
        });
      }}
    >
      <node x={0} y={0} width={SCENE_WIDTH} height={HUD_HEIGHT} backgroundColor="#1e293b" />
      <text
        x={12}
        y={8}
        width={SCENE_WIDTH - 24}
        height={22}
        text={statusText}
        textColor="#e2e8f0"
        textSize="14"
        textAlign="center"
      />

      <node
        x={0}
        y={HUD_HEIGHT}
        width={SCENE_WIDTH}
        height={ROWS * CELL}
        backgroundColor="#020617"
      />

      <node
        x={store.food.x * CELL + 2}
        y={HUD_HEIGHT + store.food.y * CELL + 2}
        width={CELL - 4}
        height={CELL - 4}
        shape="circular"
        backgroundColor="#f87171"
      />

      {store.snake.map((seg, index) => (
        <node
          x={seg.x * CELL + (index === 0 ? 1 : 2)}
          y={HUD_HEIGHT + seg.y * CELL + (index === 0 ? 1 : 2)}
          width={CELL - (index === 0 ? 2 : 4)}
          height={CELL - (index === 0 ? 2 : 4)}
          shape={index === 0 ? 'roundedRect(4 4 4 4)' : 'roundedRect(3 3 3 3)'}
          backgroundColor={index === 0 ? '#4ade80' : '#22c55e'}
        />
      ))}

      {store.phase !== 'playing' && (
        <node
          x={48}
          y={HUD_HEIGHT + Math.floor(ROWS / 2) * CELL - 28}
          width={SCENE_WIDTH - 96}
          height={56}
          shape="roundedRect(12 12 12 12)"
          backgroundColor="#1e293bcc"
          alpha={0.92}
        />
      )}
      {store.phase === 'ready' && (
        <text
          x={48}
          y={HUD_HEIGHT + Math.floor(ROWS / 2) * CELL - 18}
          width={SCENE_WIDTH - 96}
          height={36}
          text="🐍 贪吃蛇"
          textAlign="center"
          textColor="#f8fafc"
          textSize="20"
        />
      )}
      {store.phase === 'gameover' && (
        <text
          x={48}
          y={HUD_HEIGHT + Math.floor(ROWS / 2) * CELL - 14}
          width={SCENE_WIDTH - 96}
          height={32}
          text="撞车了!"
          textAlign="center"
          textColor="#fca5a5"
          textSize="18"
        />
      )}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
