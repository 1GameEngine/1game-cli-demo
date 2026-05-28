/** Plan keypress + step sequence to reach score 5 (deterministic snake). */

const GRID_COLS = 20;
const GRID_ROWS = 14;
const MOVE_INTERVAL_MS = 120;
const INITIAL_SEED = 20260528;

const INITIAL_SNAKE = [
  { x: 8, y: 6 },
  { x: 7, y: 6 },
  { x: 6, y: 6 },
];

function nextSeed(seed) {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function nextRandom(seed, maxExclusive) {
  const updatedSeed = nextSeed(seed);
  return { value: updatedSeed % maxExclusive, seed: updatedSeed };
}

function isSameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function isOppositeDirection(current, incoming) {
  return (
    (current === 'up' && incoming === 'down') ||
    (current === 'down' && incoming === 'up') ||
    (current === 'left' && incoming === 'right') ||
    (current === 'right' && incoming === 'left')
  );
}

function directionToVector(direction) {
  if (direction === 'up') return { x: 0, y: -1 };
  if (direction === 'down') return { x: 0, y: 1 };
  if (direction === 'left') return { x: -1, y: 0 };
  return { x: 1, y: 0 };
}

function cloneSnake(snake) {
  return snake.map((s) => ({ x: s.x, y: s.y }));
}

function spawnFood(snake, seed) {
  let currentSeed = seed;
  for (let i = 0; i < GRID_COLS * GRID_ROWS * 2; i += 1) {
    const xPick = nextRandom(currentSeed, GRID_COLS);
    const yPick = nextRandom(xPick.seed, GRID_ROWS);
    currentSeed = yPick.seed;
    const candidate = { x: xPick.value, y: yPick.value };
    if (!snake.some((segment) => isSameCell(segment, candidate))) {
      return { food: candidate, seed: currentSeed };
    }
  }
  for (let y = 0; y < GRID_ROWS; y += 1) {
    for (let x = 0; x < GRID_COLS; x += 1) {
      const fallback = { x, y };
      if (!snake.some((segment) => isSameCell(segment, fallback))) {
        return { food: fallback, seed: currentSeed };
      }
    }
  }
  return { food: { x: 0, y: 0 }, seed: currentSeed };
}

function buildInitialState() {
  const snake = cloneSnake(INITIAL_SNAKE);
  const spawned = spawnFood(snake, INITIAL_SEED);
  return {
    phase: 'playing',
    snake,
    direction: 'right',
    pendingDirection: 'right',
    food: spawned.food,
    score: 0,
    seed: spawned.seed,
    moveAccumulatorMs: 0,
  };
}

function stepSnake(state) {
  state.direction = state.pendingDirection;
  const movement = directionToVector(state.direction);
  const head = state.snake[0];
  const nextHead = { x: head.x + movement.x, y: head.y + movement.y };

  if (nextHead.x < 0 || nextHead.y < 0 || nextHead.x >= GRID_COLS || nextHead.y >= GRID_ROWS) {
    state.phase = 'game-over';
    return false;
  }

  const willEat = isSameCell(nextHead, state.food);
  const hitBody = state.snake.some((segment, index) => {
    if (!willEat && index === state.snake.length - 1) return false;
    return isSameCell(segment, nextHead);
  });

  if (hitBody) {
    state.phase = 'game-over';
    return false;
  }

  state.snake = [nextHead, ...state.snake];
  if (willEat) {
    state.score += 1;
    const spawned = spawnFood(state.snake, state.seed);
    state.food = spawned.food;
    state.seed = spawned.seed;
    return true;
  }
  state.snake.pop();
  return true;
}

function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

const DIR_CODES = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
};

function pickDirection(state) {
  const head = state.snake[0];
  const food = state.food;
  const options = ['up', 'down', 'left', 'right'];
  const ranked = options
    .filter((d) => !isOppositeDirection(state.direction, d))
    .map((d) => {
      const v = directionToVector(d);
      const next = { x: head.x + v.x, y: head.y + v.y };
      const dist = manhattan(next, food);
      const wall =
        next.x < 0 || next.y < 0 || next.x >= GRID_COLS || next.y >= GRID_ROWS;
      const bodyHit = state.snake.some((s, i) => {
        if (i === state.snake.length - 1) return false;
        return isSameCell(s, next);
      });
      return { d, dist, wall, bodyHit, next };
    })
    .filter((x) => !x.wall && !x.bodyHit)
    .sort((a, b) => a.dist - b.dist);

  if (ranked.length === 0) return state.direction;
  return ranked[0].d;
}

function simulateToScore(targetScore) {
  const state = buildInitialState();
  const plan = [];
  let lastDir = state.pendingDirection;
  let ticksSinceKey = 0;

  const maxTicks = 5000;
  for (let t = 0; t < maxTicks && state.score < targetScore && state.phase === 'playing'; t += 1) {
    const want = pickDirection(state);
    if (want !== lastDir) {
      if (ticksSinceKey > 0) {
        plan.push({ type: 'step', ms: MOVE_INTERVAL_MS, repeat: ticksSinceKey });
      }
      plan.push({ type: 'keypress', code: DIR_CODES[want] });
      lastDir = want;
      state.pendingDirection = want;
      ticksSinceKey = 0;
    }
    if (!stepSnake(state)) break;
    ticksSinceKey += 1;
  }

  if (ticksSinceKey > 0) {
    plan.push({ type: 'step', ms: MOVE_INTERVAL_MS, repeat: ticksSinceKey });
  }

  return { state, plan };
}

const { state, plan } = simulateToScore(5);
console.log(JSON.stringify({ score: state.score, phase: state.phase, food: state.food, plan }, null, 2));

if (state.score < 5) {
  process.exit(1);
}
