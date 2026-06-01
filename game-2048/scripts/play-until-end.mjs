#!/usr/bin/env node
/** 随机方向游玩直至 won/lost，用于 1gameplay 压力测试 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ARCHIVE = path.join(ROOT, 'out/playtest.1gamerecord');
const EVENTS_DIR = path.join(ROOT, 'out/play-events');

const DIRS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

function run(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' });
}

function parseLastJson(out) {
  const blocks = [];
  let depth = 0;
  let start = -1;
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

function queryState() {
  const out = run(
    `pnpm exec 1gameplay frame query ${ARCHIVE} --at last --select store:state --payload summary`,
  );
  const j = parseLastJson(out);
  return j.result.select['store:state'];
}

function stepDir(code) {
  const file = path.join(EVENTS_DIR, `m-${code}.json`);
  run(
    `node node_modules/@1game/skill/skills/1game-game-dev/assets/keypress-arrow.mjs ${code} ${file}`,
  );
  const out = run(`pnpm exec 1gameplay step ${ARCHIVE} --ms 16 --repeat 1 --event-file ${file}`);
  const j = parseLastJson(out);
  if (!j.ok) throw new Error(`step failed: ${out}`);
}

fs.mkdirSync(EVENTS_DIR, { recursive: true });
run(`rm -f ${ARCHIVE}`);
run(`pnpm exec 1gameplay create --entry src/game.tsx --out ${ARCHIVE}`);

let state = queryState();
let moves = 0;
const maxMoves = 500;
const history = new Set();

while (state.phase === 'playing' && moves < maxMoves) {
  const code = DIRS[moves % DIRS.length];
  stepDir(code);
  moves++;
  state = queryState();
  const key = `${state.phase}:${state.score}:${state.grid.join(',')}`;
  if (history.has(key)) {
    // 简单循环检测
    console.log(`[playtest] 状态重复于第 ${moves} 步，可能陷入循环`);
    break;
  }
  history.add(key);
}

console.log(JSON.stringify({ moves, phase: state.phase, score: state.score, maxTile: Math.max(...state.grid) }, null, 2));

if (state.phase === 'lost') {
  // 输后不应再能移动
  const before = state.grid.join(',');
  stepDir('ArrowRight');
  const after = queryState();
  if (after.grid.join(',') !== before || after.score !== state.score) {
    console.error('BUG: lost 后仍可移动或改分');
    process.exit(1);
  }
  console.log('✓ lost 后移动被正确忽略');
}

if (state.phase === 'won') {
  const scoreBefore = state.score;
  stepDir('ArrowLeft');
  const after = queryState();
  console.log('[playtest] won 后移动:', {
    gridChanged: after.grid.join(',') !== state.grid.join(','),
    scoreChanged: after.score !== scoreBefore,
    phase: after.phase,
  });
}
