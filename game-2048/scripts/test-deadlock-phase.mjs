#!/usr/bin/env node
/**
 * 检测「死局但仍为 playing」的潜在 bug：
 * 标准 2048 应在无法移动时结束，当前实现仅在「有效移动+生成」后检查 canMove。
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// 从 game.tsx 复制的核心逻辑
const GRID = 4;
const SIZE = 16;

function emptyIndices(grid) {
  const out = [];
  for (let i = 0; i < SIZE; i++) if (grid[i] === 0) out.push(i);
  return out;
}

function canMove(grid) {
  if (emptyIndices(grid).length > 0) return true;
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const v = grid[r * GRID + c];
      if (c + 1 < GRID && grid[r * GRID + c + 1] === v) return true;
      if (r + 1 < GRID && grid[(r + 1) * GRID + c] === v) return true;
    }
  }
  return false;
}

// 已知死局（无空格、无相邻相同）
const deadGrid = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
console.log('死局 canMove:', canMove(deadGrid));

// 用 1gameplay 无法直接注入 grid；用逻辑说明 + 尝试在真实对局中复现
const ROOT = path.resolve(import.meta.dirname, '..');

function parseLastJson(out) {
  let depth = 0,
    start = -1,
    blocks = [];
  for (let i = 0; i < out.length; i++) {
    if (out[i] === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (out[i] === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        blocks.push(out.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return JSON.parse(blocks[blocks.length - 1]);
}

function query(archive) {
  const out = execSync(
    `pnpm exec 1gameplay frame query ${archive} --at last --select store:state --payload summary`,
    { cwd: ROOT, encoding: 'utf8' },
  );
  return parseLastJson(out).result.select['store:state'];
}

// 快速对局：随机直到 lost 或 3000 步
const ARCHIVE = path.join(ROOT, 'out/deadlock-hunt.1gamerecord');
const dirs = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
execSync(`rm -f ${ARCHIVE}`, { cwd: ROOT });
execSync(`pnpm exec 1gameplay create --entry src/game.tsx --out ${ARCHIVE}`, { cwd: ROOT });

for (let i = 0; i < 3000; i++) {
  const code = dirs[(i * 7 + 3) % 4];
  const file = path.join(ROOT, 'out', `dh-${i}.json`);
  execSync(
    `node node_modules/@1game/skill/skills/1game-game-dev/assets/keypress-arrow.mjs ${code} ${file}`,
    { cwd: ROOT },
  );
  execSync(`pnpm exec 1gameplay step ${ARCHIVE} --ms 16 --repeat 1 --event-file ${file}`, {
    cwd: ROOT,
    stdio: 'pipe',
  });
  const s = query(ARCHIVE);
  if (s.phase === 'lost') {
    console.log(`第 ${i + 1} 步触发 lost，score=${s.score}`);
    process.exit(0);
  }
  if (!canMove(s.grid) && s.phase === 'playing') {
    console.error('BUG 复现: 棋盘已死局但 phase=playing', s);
    process.exit(1);
  }
}
console.log('3000 步内未触发 lost，maxTile=', Math.max(...query(ARCHIVE).grid));
