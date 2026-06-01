#!/usr/bin/env node
import { execSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ARCHIVE = path.join(ROOT, 'out/lost-test.1gamerecord');
const dirs = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

function run(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' });
}

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

function query() {
  const out = run(
    `pnpm exec 1gameplay frame query ${ARCHIVE} --at last --select store:state --payload summary`,
  );
  return parseLastJson(out).result.select['store:state'];
}

function step(code) {
  const file = path.join(ROOT, 'out', `lt-${code}.json`);
  run(
    `node node_modules/@1game/skill/skills/1game-game-dev/assets/keypress-arrow.mjs ${code} ${file}`,
  );
  run(`pnpm exec 1gameplay step ${ARCHIVE} --ms 16 --repeat 1 --event-file ${file}`);
}

run(`rm -f ${ARCHIVE}`);
run(`pnpm exec 1gameplay create --entry src/game.tsx --out ${ARCHIVE}`);

for (let i = 0; i < 3000; i++) {
  step(dirs[(i * 7 + 3) % 4]);
  const s = query();
  if (s.phase === 'lost') {
    console.log('lost at step', i + 1, 'score', s.score);
    const digest = JSON.stringify({ grid: s.grid, score: s.score, phase: s.phase });
    step('ArrowRight');
    const after = query();
    const digest2 = JSON.stringify({ grid: after.grid, score: after.score, phase: after.phase });
    if (digest === digest2 && after.phase === 'lost') {
      console.log('✓ lost 后按键不改变状态');
    } else if (after.phase === 'lost') {
      console.log('? lost 后按键改变了 grid 但仍是 lost');
    } else {
      console.error('BUG: lost 后按键导致', after.phase, after);
      process.exit(1);
    }
    process.exit(0);
  }
}
console.log('未在 3000 步内达到 lost');
process.exit(1);
