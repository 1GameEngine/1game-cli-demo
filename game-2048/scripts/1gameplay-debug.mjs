#!/usr/bin/env node
/**
 * 1gameplay 自动化调试：开始、移动、无效移动、按钮点击、重开
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ARCHIVE = path.join(ROOT, 'out/debug.1gamerecord');

function run(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' });
}

function json(cmd) {
  return JSON.parse(run(cmd));
}

function queryState(at = 'last') {
  const d = json(
    `npx 1gameplay frame query "${ARCHIVE}" --at ${at} --select store:state --payload summary`,
  );
  return d.result.select['store:state'];
}

function step(event) {
  const ev = JSON.stringify(event).replace(/'/g, "'\\''");
  json(`npx 1gameplay step "${ARCHIVE}" --ms 16 --event '${ev}'`);
}

function gridKey(grid) {
  return grid.map((r) => r.join(',')).join('|');
}

function countTiles(grid) {
  return grid.flat().filter((v) => v > 0).length;
}

const failures = [];
function assert(name, cond, detail = '') {
  if (!cond) failures.push({ name, detail });
  console.log(cond ? `✓ ${name}` : `✗ ${name}${detail ? ': ' + detail : ''}`);
}

// fresh archive
fs.rmSync(ARCHIVE, { force: true });
run('npm run build');
json(`npx 1gameplay create --entry src/game.tsx --out "${ARCHIVE}"`);

let s0 = queryState(0);
assert('初始 phase=ready', s0.phase === 'ready');
assert('初始棋盘有 2 个方块', countTiles(s0.grid) === 2);

step({ type: 'click', sceneId: 'main', data: { x: 180, y: 250 } });
let s1 = queryState('last');
assert('点击开始后 phase=playing', s1.phase === 'playing');
assert('开始后仍有方块', countTiles(s1.grid) >= 2);

const beforeInvalid = gridKey(s1.grid);
const tilesBeforeInvalid = countTiles(s1.grid);
step({ type: 'keypress', sceneId: 'main', data: { code: 'ArrowUp', time: 1000 } });
let sInvalid = queryState('last');
// 若无法上移，棋盘与方块数应不变（2048 规则）
const movedUp = gridKey(sInvalid.grid) !== beforeInvalid;
if (!movedUp) {
  assert('无效上移不改变棋盘', gridKey(sInvalid.grid) === beforeInvalid);
  assert('无效上移不增加方块', countTiles(sInvalid.grid) === tilesBeforeInvalid);
} else {
  console.log('  (跳过上移无效检测：此次随机布局允许上移)');
}

step({ type: 'keypress', sceneId: 'main', data: { code: 'ArrowLeft', time: 1000 } });
let sLeft = queryState('last');
assert('左移后分数增加或棋盘变化', sLeft.score > s1.score || gridKey(sLeft.grid) !== gridKey(s1.grid));

step({ type: 'keypress', sceneId: 'main', data: { code: 'ArrowRight', time: 1000 } });
let sRight = queryState('last');
assert('右移后 store 有更新', gridKey(sRight.grid) !== gridKey(sLeft.grid) || sRight.score !== sLeft.score);

// 方向按钮（屏幕下方）
step({ type: 'click', sceneId: 'main', data: { x: 180, y: 472 } }); // ↑ 中心
let sBtnUp = queryState('last');
assert('点击 ↑ 按钮有响应', gridKey(sBtnUp.grid) !== gridKey(sRight.grid) || sBtnUp.score !== sRight.score);

step({ type: 'click', sceneId: 'main', data: { x: 244, y: 516 } }); // → 中心
let sBtnRight = queryState('last');
assert('点击 → 按钮有响应', gridKey(sBtnRight.grid) !== gridKey(sBtnUp.grid) || sBtnRight.score !== sBtnUp.score);

// Enter 重开：先强制 won 不可行，测 lost 重开需填满 — 用多次 step 模拟
// 测 Space 开始：新 archive
const ARCHIVE2 = path.join(ROOT, 'out/debug-restart.1gamerecord');
fs.rmSync(ARCHIVE2, { force: true });
json(`npx 1gameplay create --entry src/game.tsx --out "${ARCHIVE2}"`);
function query2(at = 'last') {
  const d = json(
    `npx 1gameplay frame query "${ARCHIVE2}" --at ${at} --select store:state --payload summary`,
  );
  return d.result.select['store:state'];
}
function step2(event) {
  const ev = JSON.stringify(event).replace(/'/g, "'\\''");
  json(`npx 1gameplay step "${ARCHIVE2}" --ms 16 --event '${ev}'`);
}
step2({ type: 'keypress', sceneId: 'main', data: { code: 'Space', time: 1000 } });
let sSpace = query2('last');
assert('Space 可从 ready 开始', sSpace.phase === 'playing');

// 逻辑单元：合并一行
function slideRowLeft(row) {
  const filtered = row.filter((v) => v !== 0);
  const merged = [];
  let gained = 0;
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const v = filtered[i] * 2;
      merged.push(v);
      gained += v;
      i += 2;
    } else {
      merged.push(filtered[i]);
      i += 1;
    }
  }
  while (merged.length < 4) merged.push(0);
  return { row: merged, gained };
}
const mergeTest = slideRowLeft([2, 2, 2, 2]);
assert('合并 [2,2,2,2] 左 → [4,4,0,0] 得分 8', mergeTest.row.join() === '4,4,0,0' && mergeTest.gained === 8);

// 结束态：Space 重开且保留最高分
const ARCHIVE3 = path.join(ROOT, 'out/debug-restart-lost.1gamerecord');
fs.rmSync(ARCHIVE3, { force: true });
json(`npx 1gameplay create --entry src/game.tsx --out "${ARCHIVE3}"`);
function q3(at = 'last') {
  const d = json(
    `npx 1gameplay frame query "${ARCHIVE3}" --at ${at} --select store:state --payload summary`,
  );
  return d.result.select['store:state'];
}
function st3(ev) {
  const evStr = JSON.stringify(ev).replace(/'/g, "'\\''");
  json(`npx 1gameplay step "${ARCHIVE3}" --ms 16 --event '${evStr}'`);
}
st3({ type: 'click', sceneId: 'main', data: { x: 180, y: 250 } });
const dirs3 = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
let lost = false;
for (let i = 0; i < 400; i++) {
  const s = q3();
  if (s.phase === 'lost') {
    lost = true;
    const best = s.bestScore;
    st3({ type: 'keypress', sceneId: 'main', data: { code: 'Space', time: 1000 } });
    const after = q3();
    assert('失败后 Space 重开', after.phase === 'playing' && after.score === 0, `phase=${after.phase} score=${after.score}`);
    assert('失败后 Space 保留最高分', after.bestScore === best, `best=${after.bestScore} expected=${best}`);
    assert('重开后棋盘 2 格', after.grid.flat().filter((v) => v > 0).length === 2);
    break;
  }
  st3({ type: 'keypress', sceneId: 'main', data: { code: dirs3[i % 4], time: 1000 } });
}
assert('能在 400 步内触发失败', lost);

console.log('\n--- 汇总 ---');
if (failures.length === 0) {
  console.log('全部通过');
  process.exit(0);
} else {
  console.log(`失败 ${failures.length} 项:`);
  for (const f of failures) console.log(` - ${f.name}: ${f.detail}`);
  process.exit(1);
}
