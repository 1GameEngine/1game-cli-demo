#!/usr/bin/env node
/** 角落策略：反复 Down+Left，争取合成 2048 或触发 game over */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ARCHIVE = path.join(ROOT, 'out/corner.1gamerecord');

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

function queryState() {
  const out = run(
    `pnpm exec 1gameplay frame query ${ARCHIVE} --at last --select store:state --payload summary`,
  );
  return parseLastJson(out).result.select['store:state'];
}

function step(code) {
  const file = path.join(ROOT, 'out', `corner-${code}.json`);
  run(
    `node node_modules/@1game/skill/skills/1game-game-dev/assets/keypress-arrow.mjs ${code} ${file}`,
  );
  run(`pnpm exec 1gameplay step ${ARCHIVE} --ms 16 --repeat 1 --event-file ${file}`);
}

run(`rm -f ${ARCHIVE}`);
run(`pnpm exec 1gameplay create --entry src/game.tsx --out ${ARCHIVE}`);

const pattern = ['ArrowDown', 'ArrowLeft', 'ArrowDown', 'ArrowLeft'];
for (let i = 0; i < 800; i++) {
  step(pattern[i % pattern.length]);
  const s = queryState();
  if (s.phase !== 'playing') {
    console.log(JSON.stringify({ moves: i + 1, phase: s.phase, score: s.score, maxTile: Math.max(...s.grid), grid: s.grid }, null, 2));
    process.exit(0);
  }
  if ((i + 1) % 100 === 0) {
    console.log(`step ${i + 1} score=${s.score} max=${Math.max(...s.grid)}`);
  }
}
const s = queryState();
console.log(JSON.stringify({ moves: 800, phase: s.phase, score: s.score, maxTile: Math.max(...s.grid) }, null, 2));
