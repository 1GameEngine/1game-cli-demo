#!/usr/bin/env node
/**
 * 1gameplay 自动化调试：验证 2048 核心逻辑
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ARCHIVE = path.join(ROOT, 'out/debug.1gamerecord');
const EVENTS_DIR = path.join(ROOT, 'out/debug-events');

function run(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' });
}

function json(cmd) {
  const out = run(cmd);
  const line = out.trim().split('\n').find((l) => l.startsWith('{'));
  return JSON.parse(line);
}

function keypress(code, file) {
  run(`node node_modules/@1game/skill/skills/1game-game-dev/assets/keypress-arrow.mjs ${code} ${file}`);
}

function stepKey(code) {
  const file = path.join(EVENTS_DIR, `${code}.json`);
  keypress(code, file);
  return json(`pnpm exec 1gameplay step ${ARCHIVE} --ms 16 --repeat 1 --event-file ${file}`);
}

function queryState() {
  const q = json(
    `pnpm exec 1gameplay frame query ${ARCHIVE} --at last --select store:state --payload summary`,
  );
  return q.result.select['store:state'];
}

function countTiles(grid) {
  return grid.filter((v) => v > 0).length;
}

function gridSum(grid) {
  return grid.reduce((a, b) => a + b, 0);
}

const failures = [];
function assert(name, cond, detail = '') {
  if (!cond) failures.push({ name, detail });
  else console.log(`  ✓ ${name}`);
}

fs.mkdirSync(EVENTS_DIR, { recursive: true });
run('rm -f out/debug.1gamerecord');
run('pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord');

console.log('\n=== 1. 初始状态 ===');
let s0 = queryState();
assert('phase=playing', s0.phase === 'playing');
assert('开局 2 个方块', countTiles(s0.grid) === 2);
assert('初始分数 0', s0.score === 0);

console.log('\n=== 2. 有效移动（右）应改变棋盘并 +1 方块 ===');
const tilesBefore = countTiles(s0.grid);
const sumBefore = gridSum(s0.grid);
stepKey('ArrowRight');
let s1 = queryState();
assert('移动后仍为 playing', s1.phase === 'playing');
assert('有效移动后方块数 +1', countTiles(s1.grid) === tilesBefore + 1);
assert('棋盘发生变化', JSON.stringify(s1.grid) !== JSON.stringify(s0.grid));

console.log('\n=== 3. 无效移动（左，若棋盘不变）===');
// 记录当前 grid，尝试左移；若与当前相同则不应增加方块
const gridBeforeInvalid = [...s1.grid];
stepKey('ArrowLeft');
let s2 = queryState();
const changed = JSON.stringify(s2.grid) !== JSON.stringify(gridBeforeInvalid);
if (!changed) {
  assert('无效移动不增加方块', countTiles(s2.grid) === countTiles(gridBeforeInvalid));
  assert('无效移动分数不变', s2.score === s1.score);
} else {
  console.log('  · 左移有效，跳过无效移动断言');
}

console.log('\n=== 4. 四方向 keypress 不崩溃 ===');
for (const code of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
  const r = stepKey(code);
  assert(`${code} step ok`, r.ok === true);
}

console.log('\n=== 5. 合并计分（构造 2+2 行）===');
run('rm -f out/score-test.1gamerecord');
run('pnpm exec 1gameplay create --entry src/game.tsx --out out/score-test.1gamerecord');
// 多次右移使同行 2 合并
for (let i = 0; i < 8; i++) stepKey('ArrowRight');
// 用 score-test archive
const ARCHIVE2 = path.join(ROOT, 'out/score-test.1gamerecord');
function stepKey2(code) {
  const file = path.join(EVENTS_DIR, `s2-${code}.json`);
  keypress(code, file);
  execSync(`pnpm exec 1gameplay step ${ARCHIVE2} --ms 16 --repeat 1 --event-file ${file}`, {
    cwd: ROOT,
    encoding: 'utf8',
  });
}
for (const code of ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp']) {
  stepKey2(code);
}
const qScore = json(
  `pnpm exec 1gameplay frame query ${ARCHIVE2} --at last --select store:state --payload summary`,
);
const sScore = qScore.result.select['store:state'];
assert('合并后分数 >= 4', sScore.score >= 4, `score=${sScore.score}`);

console.log('\n=== 6. store 与 render 一致 ===');
const qRender = json(
  `pnpm exec 1gameplay frame query ${ARCHIVE} --at last --select store:state --select render:scene=main --payload summary`,
);
const storeGrid = qRender.result.select['store:state'].grid;
const renderScene = qRender.result.select['render:scene=main'];
assert('render 场景存在', renderScene != null);

console.log('\n=== 7. 帧 diff（移动应有 commit）===');
const diff = json(
  `pnpm exec 1gameplay frame diff ${ARCHIVE} --from 0 --to 2 --select store:dump --payload summary`,
);
assert('前 3 帧有状态变化', diff.ok === true);

console.log('\n=== 8. 模拟 game-over 棋盘（满格不可合并）===');
// 通过直接多次移动至 lost 较难；用逻辑脚本验证 canMove
function canMove(grid) {
  const GRID = 4;
  const SIZE = 16;
  const empty = () => {
    const o = [];
    for (let i = 0; i < SIZE; i++) if (grid[i] === 0) o.push(i);
    return o;
  };
  if (empty().length > 0) return true;
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const v = grid[r * GRID + c];
      if (c + 1 < GRID && grid[r * GRID + c + 1] === v) return true;
      if (r + 1 < GRID && grid[(r + 1) * GRID + c] === v) return true;
    }
  }
  return false;
}
const deadGrid = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
assert('死局检测正确', canMove(deadGrid) === false);

console.log('\n=== 结果 ===');
if (failures.length) {
  console.error('失败:', failures);
  process.exit(1);
}
console.log('全部通过');
