#!/usr/bin/env node
/**
 * 用 1gameplay 自动操控贪吃蛇，生成得分达到 5 分的 .1gamerecord
 */
import { execSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;
const ARCHIVE = 'out/score5.1gamerecord';
const COLS = 32;
const ROWS = 18;
const TARGET_SCORE = 5;
const STEP_MS = 130;
const STEPS_PER_CELL = 1;

const KEY = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
};

const DELTAS = [
  ['up', 0, -1],
  ['down', 0, 1],
  ['left', -1, 0],
  ['right', 1, 0],
];

function run(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: ['pipe', 'pipe', 'inherit'], encoding: 'utf8' });
}

function runJson(cmd) {
  const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8' });
  return JSON.parse(out);
}

function queryState() {
  const json = runJson(
    `pnpm exec 1gameplay frame query ${ARCHIVE} --at last --select store:state --payload summary`,
  );
  return json.result.select['store:state'];
}

function snakeKey(snake) {
  return snake.map((p) => `${p.x},${p.y}`).join('|');
}

function cloneSnake(snake) {
  return snake.map((p) => ({ x: p.x, y: p.y }));
}

/** 在完整蛇身状态下 BFS，模拟吃食物后变长 */
function bfs(snake, food) {
  const start = cloneSnake(snake);
  const queue = [{ snake: start, path: [] }];
  const visited = new Set([snakeKey(start)]);

  while (queue.length > 0) {
    const { snake: s, path } = queue.shift();
    const head = s[0];
    if (head.x === food.x && head.y === food.y) return path;

    for (const [dir, dx, dy] of DELTAS) {
      const nx = head.x + dx;
      const ny = head.y + dy;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;

      const ate = nx === food.x && ny === food.y;
      const body = ate ? s : s.slice(0, -1);
      if (body.some((seg) => seg.x === nx && seg.y === ny)) continue;

      const next = [{ x: nx, y: ny }, ...s];
      if (!ate) next.pop();

      const key = snakeKey(next);
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push({ snake: next, path: [...path, dir] });
    }
  }
  return null;
}

function stepKeypress(code, repeat = STEPS_PER_CELL) {
  const event = JSON.stringify({ type: 'keypress', sceneId: 'main', data: { code } });
  run(`pnpm exec 1gameplay step ${ARCHIVE} --ms ${STEP_MS} --repeat ${repeat} --event '${event}'`);
}

function main() {
  const archivePath = `${ROOT}/${ARCHIVE}`;
  if (existsSync(archivePath)) unlinkSync(archivePath);

  console.log('[score5] creating archive...');
  run(`pnpm exec 1gameplay create --entry src/game.tsx --out ${ARCHIVE} --checkpoint-every 120`);

  let safety = 0;
  while (safety < 500) {
    safety += 1;
    const state = queryState();
    console.log(`[score5] score=${state.score} head=(${state.snake[0].x},${state.snake[0].y}) food=(${state.food.x},${state.food.y})`);

    if (state.score >= TARGET_SCORE) {
      console.log(`[score5] done: score ${state.score}`);
      break;
    }
    if (state.phase === 'gameover') {
      throw new Error(`game over at score ${state.score}`);
    }

    const path = bfs(state.snake, state.food);
    if (!path || path.length === 0) {
      throw new Error(`no path to food at (${state.food.x},${state.food.y})`);
    }

    // 每格重新规划，避免步进误差累积导致撞墙
    stepKeypress(KEY[path[0]]);
  }

  if (safety >= 500) throw new Error('safety limit exceeded');

  const final = queryState();
  console.log(`[score5] archive: ${ARCHIVE}, final score: ${final.score}, phase: ${final.phase}`);
}

main();
