import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVE = join(ROOT, 'out/score-5.1gamerecord');
const STEP_MS = 16;

const DELTA = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const KEY_CODE = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
};

function pointsEqual(a, b) {
  return a.x === b.x && a.y === b.y;
}

function isOnSnake(snake, point, skipTail = false) {
  const body = skipTail ? snake.slice(0, -1) : snake;
  return body.some((segment) => pointsEqual(segment, point));
}

function bfsNextDirection(head, goal, snake, cols, rows) {
  const queue = [{ x: head.x, y: head.y, path: [] }];
  const visited = new Set([`${head.x},${head.y}`]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.x === goal.x && current.y === goal.y) {
      return current.path[0] ?? null;
    }

    for (const [dir, delta] of Object.entries(DELTA)) {
      const nx = current.x + delta.x;
      const ny = current.y + delta.y;
      const key = `${nx},${ny}`;

      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows || visited.has(key)) continue;

      const nextPoint = { x: nx, y: ny };
      const isTail = snake.length > 1 && pointsEqual(snake[snake.length - 1], nextPoint);
      if (isOnSnake(snake, nextPoint, isTail)) continue;

      visited.add(key);
      queue.push({ x: nx, y: ny, path: [...current.path, dir] });
    }
  }

  return null;
}

function run1gameplay(args) {
  return execFileSync('npx', ['1gameplay', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
  });
}

function queryState() {
  const output = run1gameplay([
    'frame',
    'query',
    ARCHIVE,
    '--at',
    'last',
    '--select',
    'store:state',
    '--payload',
    'summary',
  ]);
  return JSON.parse(output).result.select['store:state'];
}

function stepOnce(event, repeat) {
  const args = ['step', ARCHIVE, '--ms', String(STEP_MS), '--repeat', String(repeat)];
  if (event) args.push('--event', JSON.stringify(event));
  run1gameplay(args);
}

function main() {
  run1gameplay(['create', '--entry', 'src/game.tsx', '--out', ARCHIVE]);

  let lastDirection = null;
  let guard = 0;

  while (guard < 500) {
    guard += 1;
    const state = queryState();

    if (state.phase === 'lost') {
      throw new Error(`Game lost at score ${state.score}`);
    }
    if (state.score >= 5) break;

    const head = state.snake[0];
    const dir = bfsNextDirection(head, state.food, state.snake, state.cols, state.rows);
    if (!dir) {
      throw new Error(`No path to food (${state.food.x},${state.food.y}) at score ${state.score}`);
    }

    const event =
      dir !== lastDirection
        ? { type: 'keypress', sceneId: 'main', data: { code: KEY_CODE[dir] } }
        : null;

    const repeat = Math.max(1, Math.ceil((state.moveIntervalMs - state.moveTimerMs) / STEP_MS));
    stepOnce(event, repeat);
    lastDirection = dir;

    const after = queryState();
    console.log(
      `#${guard} score=${after.score} head=(${after.snake[0].x},${after.snake[0].y}) food=(${after.food.x},${after.food.y}) phase=${after.phase}`,
    );

    if (after.score >= 5 && after.phase === 'playing') break;
  }

  const finalState = queryState();
  console.log(`\nArchive: ${ARCHIVE}`);
  console.log(`Final score: ${finalState.score}, phase: ${finalState.phase}`);

  if (finalState.score < 5 || finalState.phase !== 'playing') {
    throw new Error(`Expected score 5 while playing, got ${finalState.score} (${finalState.phase})`);
  }

  run1gameplay([
    'comments',
    'add',
    ARCHIVE,
    '--at',
    'last',
    '--body',
    'Automated 1gameplay run: score reached 5',
    '--author-id',
    'agent',
  ]);

  console.log('Recording complete.');
}

main();
