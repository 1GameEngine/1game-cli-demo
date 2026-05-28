#!/usr/bin/env node
/**
 * 使用 1gameplay 生成得分达到 5 分的游戏录制。
 * 用法: node scripts/generate-score-5-record.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVE = join(ROOT, 'out/score-5.1gamerecord');
const TARGET_SCORE = 5;
const STEP_MS = 120;
const BOARD_COLS = 20;
const BOARD_ROWS = 20;

const OPPOSITE = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const DELTA = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function run(cmd, args) {
  const out = execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8' });
  return out.trim();
}

function queryState() {
  const raw = run('npx', [
    '1gameplay', 'frame', 'query', ARCHIVE,
    '--at', 'last',
    '--select', 'store:state',
    '--payload', 'full',
  ]);
  const json = JSON.parse(raw);
  return json.result.select['store:state'];
}

function step(ms, extraArgs = []) {
  run('npx', [
    '1gameplay', 'step', ARCHIVE,
    '--ms', String(ms),
    ...extraArgs,
  ]);
}

function keypress(code) {
  step(0, [
    '--event', JSON.stringify({
      type: 'keypress',
      sceneId: 'main',
      data: { code },
    }),
  ]);
}

function cellKey(c) {
  return `${c.x},${c.y}`;
}

function moveCell(cell, direction) {
  const d = DELTA[direction];
  return { x: cell.x + d.x, y: cell.y + d.y };
}

function isInsideBoard(cell) {
  return cell.x >= 0 && cell.x < BOARD_COLS && cell.y >= 0 && cell.y < BOARD_ROWS;
}

function cellEquals(a, b) {
  return a.x === b.x && a.y === b.y;
}

function simulateStep(snake, direction, food) {
  const head = snake[0];
  const nextHead = moveCell(head, direction);
  if (!isInsideBoard(nextHead)) return null;

  const willGrow = cellEquals(nextHead, food);
  const collisionBody = willGrow ? snake : snake.slice(0, -1);
  if (collisionBody.some((s) => cellEquals(s, nextHead))) return null;

  const nextSnake = [nextHead, ...snake];
  if (!willGrow) nextSnake.pop();
  return nextSnake;
}

function directionToKey(direction) {
  const map = {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
  };
  return map[direction];
}

function planDirections(state) {
  const head = state.snake[0];
  const food = state.food;
  const startDir = state.nextDirection;
  const queue = [{
    snake: state.snake,
    direction: startDir,
    moves: [],
  }];
  const visited = new Set();
  visited.add(`${cellKey(head)}|${state.snake.length}`);

  while (queue.length > 0) {
    const { snake, direction, moves } = queue.shift();
    const h = snake[0];
    if (cellEquals(h, food)) {
      return moves;
    }
    if (moves.length > 400) continue;

    for (const nextDir of ['up', 'down', 'left', 'right']) {
      if (snake.length > 1 && OPPOSITE[nextDir] === direction) continue;
      const nextSnake = simulateStep(snake, nextDir, food);
      if (!nextSnake) continue;
      const key = `${cellKey(nextSnake[0])}|${nextSnake.length}`;
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push({
        snake: nextSnake,
        direction: nextDir,
        moves: [...moves, nextDir],
      });
    }
  }
  return null;
}

function main() {
  mkdirSync(join(ROOT, 'out'), { recursive: true });
  run('npx', ['1gameplay', 'create', '--entry', 'src/game.tsx', '--out', ARCHIVE]);

  let state = queryState();
  console.log(`初始: score=${state.score}, head=(${state.snake[0].x},${state.snake[0].y}), food=(${state.food.x},${state.food.y})`);

  while (state.score < TARGET_SCORE && state.phase === 'playing') {
    const plan = planDirections(state);
    if (!plan || plan.length === 0) {
      throw new Error(`无法规划到食物的路径 (score=${state.score}, food=${state.food.x},${state.food.y})`);
    }

    for (const dir of plan) {
      if (state.phase !== 'playing') break;
      const code = directionToKey(dir);
      if (state.nextDirection !== dir) {
        keypress(code);
        state = queryState();
      }
      step(STEP_MS);
      state = queryState();
    }

    console.log(`得分 ${state.score}: head=(${state.snake[0].x},${state.snake[0].y}), food=(${state.food.x},${state.food.y}), phase=${state.phase}`);
    if (state.phase !== 'playing') {
      throw new Error(`游戏提前结束: phase=${state.phase}, score=${state.score}`);
    }
  }

  if (state.score < TARGET_SCORE) {
    throw new Error(`未达到目标分数: score=${state.score}`);
  }

  const frames = run('npx', ['1gameplay', 'frames', 'list', ARCHIVE]);
  console.log(`\n录制完成: ${ARCHIVE}`);
  console.log(`最终得分: ${state.score}, phase: ${state.phase}`);
  console.log(frames.split('\n').slice(0, 3).join('\n'));
}

main();
