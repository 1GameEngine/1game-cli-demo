#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVE = 'out/merge16.1gamerecord';

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8', cwd: ROOT });
}

function queryState() {
  const out = run(
    `npx 1gameplay frame query ${ARCHIVE} --at last --select store:state --payload summary`,
  );
  return JSON.parse(out).result.select['store:state'];
}

function maxTileValue(state) {
  return state.tiles.reduce((max, t) => Math.max(max, t.value), 0);
}

function doMove(code) {
  const event = JSON.stringify({ type: 'keypress', sceneId: 'main', data: { code } });
  run(`npx 1gameplay step ${ARCHIVE} --ms 220 --event '${event.replace(/'/g, "'\\''")}'`);
  run(`npx 1gameplay step ${ARCHIVE} --ms 220 --repeat 3`);
}

// Corner strategy: prefer left then down (classic 2048 heuristic)
const STRATEGY = [
  'ArrowLeft', 'ArrowDown',
  'ArrowLeft', 'ArrowDown',
  'ArrowLeft', 'ArrowDown',
  'ArrowRight', 'ArrowDown',
  'ArrowLeft', 'ArrowDown',
  'ArrowLeft', 'ArrowDown',
  'ArrowUp', 'ArrowLeft',
  'ArrowDown', 'ArrowLeft',
  'ArrowDown', 'ArrowLeft',
  'ArrowDown', 'ArrowRight',
  'ArrowDown', 'ArrowLeft',
  'ArrowLeft', 'ArrowDown',
  'ArrowLeft', 'ArrowDown',
  'ArrowLeft', 'ArrowDown',
  'ArrowDown', 'ArrowLeft',
  'ArrowDown', 'ArrowLeft',
  'ArrowDown', 'ArrowLeft',
  'ArrowLeft', 'ArrowDown',
  'ArrowLeft', 'ArrowDown',
  'ArrowUp', 'ArrowLeft',
  'ArrowDown', 'ArrowLeft',
  'ArrowDown', 'ArrowLeft',
  'ArrowDown', 'ArrowLeft',
  'ArrowLeft', 'ArrowDown',
  'ArrowLeft', 'ArrowDown',
  'ArrowDown', 'ArrowLeft',
  'ArrowDown', 'ArrowLeft',
  'ArrowDown', 'ArrowLeft',
  'ArrowLeft', 'ArrowDown',
];

run(`npx 1gameplay create --entry src/game.tsx --out ${ARCHIVE}`);

const moveLog = [];
let state = queryState();
console.log(`[start] max=${maxTileValue(state)}`);

for (const dir of STRATEGY) {
  if (maxTileValue(state) >= 16) break;
  const beforeScore = state.score;
  doMove(dir);
  state = queryState();
  moveLog.push(dir);
  const maxVal = maxTileValue(state);
  console.log(`[${moveLog.length}] ${dir} -> max=${maxVal} score=${state.score} (+${state.score - beforeScore})`);
  if (maxVal >= 16) break;
}

// Extra rounds if not yet 16
for (let i = 0; i < 30 && maxTileValue(state) < 16; i++) {
  const dir = i % 2 === 0 ? 'ArrowLeft' : 'ArrowDown';
  doMove(dir);
  state = queryState();
  moveLog.push(dir);
  console.log(`[extra ${i + 1}] ${dir} -> max=${maxTileValue(state)} score=${state.score}`);
}

state = queryState();
const maxVal = maxTileValue(state);
console.log('\n=== Final ===');
console.log('Max tile:', maxVal);
console.log('Score:', state.score);
console.log('Tiles:', state.tiles.map((t) => `${t.value}@(${t.row},${t.col})`).join(', '));
console.log('Total moves:', moveLog.length);

run(
  `npx 1gameplay comments add ${ARCHIVE} --at last --body "调试回放：最高方块 ${maxVal}，分数 ${state.score}，共 ${moveLog.length} 步操作" --author-id debug-agent`,
);

run(
  `npx 1gameplay bundle-player-html ${ARCHIVE} --out out/replay-merge16.html --single-html --title "2048 调试回放 - 合并至${maxVal}"`,
);

// Export move list for reference
import fs from 'node:fs';
fs.writeFileSync(
  path.join(ROOT, 'out/merge16-moves.json'),
  JSON.stringify({ maxVal, score: state.score, moves: moveLog, tiles: state.tiles }, null, 2),
);

console.log('\n生成文件:');
console.log('  out/merge16.1gamerecord       回放记录');
console.log('  out/replay-merge16.html       单文件 HTML 回放（浏览器打开）');
console.log('  out/merge16-moves.json        操作步骤 JSON');
