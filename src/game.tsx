import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Direction = 'up' | 'down' | 'left' | 'right';
type Point = { x: number; y: number };
type Phase = 'playing' | 'gameover';

type GameState = {
  phase: Phase;
  score: number;
  snake: Point[];
  direction: Direction;
  nextDirection: Direction;
  food: Point;
  moveTimerMs: number;
  rngSeed: number;
};

const SCENE_WIDTH = 320;
const SCENE_HEIGHT = 180;
const CELL = 10;
const COLS = SCENE_WIDTH / CELL;
const ROWS = SCENE_HEIGHT / CELL;
const MOVE_INTERVAL_MS = 130;

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const DELTA: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function nextRandom(seed: number): [number, number] {
  const next = (seed * 1103515245 + 12345) & 0x7fffffff;
  return [next, next];
}

function spawnFood(draft: GameState): void {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    let value: number;
    [draft.rngSeed, value] = nextRandom(draft.rngSeed);
    const x = value % COLS;
    [draft.rngSeed, value] = nextRandom(draft.rngSeed);
    const y = value % ROWS;
    const occupied = draft.snake.some((seg) => seg.x === x && seg.y === y);
    if (!occupied) {
      draft.food = { x, y };
      return;
    }
  }
}

function createInitialState(): GameState {
  const snake: Point[] = [
    { x: 8, y: 9 },
    { x: 7, y: 9 },
    { x: 6, y: 9 },
  ];
  return {
    phase: 'playing',
    score: 0,
    snake,
    direction: 'right',
    nextDirection: 'right',
    food: { x: 14, y: 5 },
    moveTimerMs: 0,
    rngSeed: 42,
  };
}

function tickSnake(draft: GameState, deltaMs: number): void {
  if (draft.phase !== 'playing') return;

  draft.moveTimerMs += deltaMs;
  if (draft.moveTimerMs < MOVE_INTERVAL_MS) return;
  draft.moveTimerMs -= MOVE_INTERVAL_MS;

  if (OPPOSITE[draft.direction] !== draft.nextDirection) {
    draft.direction = draft.nextDirection;
  }

  const head = draft.snake[0];
  const delta = DELTA[draft.direction];
  const newHead: Point = { x: head.x + delta.x, y: head.y + delta.y };

  if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
    draft.phase = 'gameover';
    return;
  }

  const ateFood = newHead.x === draft.food.x && newHead.y === draft.food.y;
  const bodyToCheck = ateFood ? draft.snake : draft.snake.slice(0, -1);
  if (bodyToCheck.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
    draft.phase = 'gameover';
    return;
  }

  draft.snake.unshift(newHead);
  if (ateFood) {
    draft.score += 1;
    spawnFood(draft);
  } else {
    draft.snake.pop();
  }
}

const { store, commitChange, storeHistory } = createGameStore(createInitialState(), { enableHistory: true });

function setDirection(dir: Direction): void {
  commitChange(`direction:${dir}`, (draft: GameState) => {
    if (draft.phase !== 'playing') return;
    if (OPPOSITE[draft.direction] === dir) return;
    draft.nextDirection = dir;
  });
}

function restartGame(): void {
  commitChange('restart', () => createInitialState());
}

function Game() {
  useFrame((frame) => {
    const deltaMs = Math.min(frame.deltaSeconds, 0.05) * 1000;
    commitChange('tick', (draft: GameState) => tickSnake(draft, deltaMs));
  });

  const statusText =
    store.phase === 'gameover' ? `游戏结束  得分: ${store.score}  按空格重开` : `得分: ${store.score}`;

  return (
    <scene
      id="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#0b1220"
      onKeyDown={(event) => {
        const code = event.detail?.code;
        if (code === 'ArrowUp' || code === 'KeyW') setDirection('up');
        if (code === 'ArrowDown' || code === 'KeyS') setDirection('down');
        if (code === 'ArrowLeft' || code === 'KeyA') setDirection('left');
        if (code === 'ArrowRight' || code === 'KeyD') setDirection('right');
        if (code === 'Space' && store.phase === 'gameover') restartGame();
      }}
    >
      <text x={8} y={6} width={304} height={18} text={statusText} textColor="#e2e8f0" textSize="14" />

      <node
        x={store.food.x * CELL}
        y={store.food.y * CELL}
        width={CELL}
        height={CELL}
        shape="circular"
        backgroundColor="#ef4444"
      />

      {store.snake.map((seg, index) => (
        <node
          x={seg.x * CELL}
          y={seg.y * CELL}
          width={CELL}
          height={CELL}
          shape={index === 0 ? 'roundedRect(3 3 3 3)' : 'rect'}
          backgroundColor={index === 0 ? '#4ade80' : '#22c55e'}
        />
      ))}

      <group x={8} y={148} width={72} height={28} clickable onClick={() => setDirection('left')}>
        <node x={0} y={0} width={72} height={28} shape="roundedRect(6 6 6 6)" backgroundColor="#334155" />
        <text x={0} y={5} width={72} height={18} text="←" textAlign="center" textColor="#f8fafc" textSize="16" />
      </group>

      <group x={88} y={148} width={72} height={28} clickable onClick={() => setDirection('up')}>
        <node x={0} y={0} width={72} height={28} shape="roundedRect(6 6 6 6)" backgroundColor="#334155" />
        <text x={0} y={5} width={72} height={18} text="↑" textAlign="center" textColor="#f8fafc" textSize="16" />
      </group>

      <group x={168} y={148} width={72} height={28} clickable onClick={() => setDirection('down')}>
        <node x={0} y={0} width={72} height={28} shape="roundedRect(6 6 6 6)" backgroundColor="#334155" />
        <text x={0} y={5} width={72} height={18} text="↓" textAlign="center" textColor="#f8fafc" textSize="16" />
      </group>

      <group x={248} y={148} width={64} height={28} clickable onClick={() => setDirection('right')}>
        <node x={0} y={0} width={64} height={28} shape="roundedRect(6 6 6 6)" backgroundColor="#334155" />
        <text x={0} y={5} width={64} height={18} text="→" textAlign="center" textColor="#f8fafc" textSize="16" />
      </group>

      {store.phase === 'gameover' && (
        <group x={80} y={70} width={160} height={40} clickable onClick={restartGame}>
          <node x={0} y={0} width={160} height={40} shape="roundedRect(8 8 8 8)" backgroundColor="#2563eb" />
          <text x={0} y={10} width={160} height={20} text="再来一局" textAlign="center" textColor="#fff" textSize="16" />
        </group>
      )}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
