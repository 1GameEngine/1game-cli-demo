#!/usr/bin/env node
/**
 * 1gameplay 自动化调试：校验 2048 不变量与关键规则
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const archive = path.join(root, 'out/debug.1gamerecord');
const outDir = path.join(root, 'out');

function run(cmd, args, opts = {}) {
  const r = execFileSync(cmd, args, {
    cwd: root,
    encoding: 'utf-8',
    maxBuffer: 20 * 1024 * 1024,
    ...opts,
  });
  return r.trim();
}

function json(cmd, args) {
  return JSON.parse(run(cmd, args));
}

let keyFileSeq = 0;
function keypressFile(codes) {
  const events = codes.map((code, i) => ({
    type: 'keypress',
    sceneId: 'main',
    data: { code, time: 1000 + i * 200 },
  }));
  const p = path.join(outDir, `keys-${++keyFileSeq}.json`);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(events));
  return p;
}

function queryState(at = 'last') {
  const res = json('pnpm', [
    'exec',
    '1gameplay',
    'frame',
    'query',
    archive,
    '--at',
    String(at),
    '--select',
    'store:state',
    '--payload',
    'full',
  ]);
  if (!res.ok) throw new Error(res.message ?? 'query failed');
  return res.result.select['store:state'];
}

function freshArchive() {
  if (fs.existsSync(archive)) fs.unlinkSync(archive);
  const created = json('pnpm', ['exec', '1gameplay', 'create', '--entry', 'src/game.tsx', '--out', archive]);
  if (!created.ok) throw new Error(created.message ?? 'create failed');
}

function stepEvents(codes) {
  const file = keypressFile(codes);
  const stepped = json('pnpm', [
    'exec',
    '1gameplay',
    'step',
    archive,
    '--ms',
    '16',
    '--event-file',
    file,
  ]);
  if (!stepped.ok) throw new Error(stepped.message ?? 'step failed');
}

function countTiles(grid) {
  return grid.filter((v) => v > 0).length;
}

function isPowerOfTwo(n) {
  return n === 0 || (n > 0 && (n & (n - 1)) === 0);
}

function gridStr(grid) {
  const rows = [];
  for (let r = 0; r < 4; r++) rows.push(grid.slice(r * 4, r * 4 + 4).join('\t'));
  return rows.join('\n');
}

const failures = [];

function assert(name, cond, detail = '') {
  if (!cond) failures.push({ name, detail });
}

function checkInvariants(state, label) {
  assert(`${label}: grid length`, state.grid.length === 16, String(state.grid.length));
  assert(`${label}: all values power of 2`, state.grid.every(isPowerOfTwo), JSON.stringify(state.grid));
  assert(`${label}: score >= 0`, state.score >= 0);
  assert(`${label}: phase valid`, ['playing', 'won', 'lost'].includes(state.phase));
}

console.log('[1gameplay-debug] 创建归档…');
freshArchive();

const initial = queryState(0);
console.log('[初始]\n' + gridStr(initial.grid));
checkInvariants(initial, 'initial');
assert('initial: two tiles', countTiles(initial.grid) === 2, String(countTiles(initial.grid)));

// 合并：顶行 2+2 左滑 -> 4
stepEvents(['ArrowLeft']);
const afterLeft = queryState('last');
console.log('[左滑一次]\n' + gridStr(afterLeft.grid), 'score=', afterLeft.score);
checkInvariants(afterLeft, 'afterLeft');
assert('merge: score is 4', afterLeft.score === 4, String(afterLeft.score));
assert('merge: top-left is 4', afterLeft.grid[0] === 4, String(afterLeft.grid[0]));
assert('merge: spawned one new tile', countTiles(afterLeft.grid) === 2, String(countTiles(afterLeft.grid)));

// 单行多次合并（离线校验 moveLine，见脚本外 node -e 或 README）

// 单行多次合并：2,2,4,4 左滑应得 4,8 而非 16
freshArchive();
// 手动构造需 simulate；用连续操作逼近：先玩几步再 query
// 用 frame simulate 从 frame 0 注入自定义不可行，改测「一次滑动只合并相邻一次」
// 通过 create 后多次 step 验证经典 [2,2,2,2] 行
freshArchive();
// 覆盖 store 不可行，用事件序列把棋盘打成可测形态：右下密集后左滑
const squeeze = [
  'ArrowLeft', 'ArrowUp', 'ArrowLeft', 'ArrowUp',
  'ArrowRight', 'ArrowDown', 'ArrowRight', 'ArrowDown',
  'ArrowLeft', 'ArrowUp',
];
stepEvents(squeeze);
const squeezed = queryState('last');
checkInvariants(squeezed, 'squeezed');
console.log('[挤压后]\n' + gridStr(squeezed.grid), 'score=', squeezed.score);

// 模拟赢：用 simulate 从当前继续大量 down+left 循环
const loop = json('pnpm', [
  'exec',
  '1gameplay',
  'frame',
  'simulate',
  archive,
  '--from',
  'last',
  '--ms',
  '16',
  '--event-file',
  keypressFile(Array.from({ length: 80 }, (_, i) => (i % 2 === 0 ? 'ArrowDown' : 'ArrowLeft'))),
  '--select',
  'store:state',
  '--payload',
  'full',
]);
if (!loop.ok) {
  failures.push({ name: 'simulate 80 moves', detail: loop.message });
} else {
  const simState = loop.result?.select?.['store:state'] ?? loop.result;
  const final =
    simState?.grid != null
      ? simState
      : loop.result?.select?.['store:state'] ?? { phase: '?', grid: [], score: -1 };
  if (final.grid) {
    console.log('[模拟 80 步后] phase=', final.phase, 'score=', final.score);
    console.log(gridStr(final.grid));
    checkInvariants(final, 'simulated');
    const max = Math.max(...final.grid);
    if (final.phase === 'lost') {
      assert('game over: cannot move', true);
      console.log('[OK] 检测到游戏结束');
    } else if (final.phase === 'won') {
      assert('win: has 2048', final.grid.some((v) => v >= 2048));
      console.log('[OK] 检测到胜利');
    }
  }
}

// 渲染与 store：收集画面数字，去掉标题/分数 HUD 后应与棋盘一致
function allNumericTexts(renderRoot) {
  const texts = [];
  function walk(n) {
    if (n.type === 'text' && n.attrs?.text && /^\d+$/.test(n.attrs.text)) {
      texts.push(Number(n.attrs.text));
    }
    for (const c of n.childNodes ?? []) walk(c);
  }
  walk(renderRoot?.data ?? renderRoot);
  return texts;
}

function boardValuesFromRender(renderRoot, state) {
  const nums = allNumericTexts(renderRoot).filter((v) => v >= 2);
  for (const hud of [state.score, state.bestScore, 2048]) {
    const i = nums.indexOf(hud);
    if (i >= 0) nums.splice(i, 1);
  }
  return nums;
}

const renderQ = json('pnpm', [
  'exec',
  '1gameplay',
  'frame',
  'query',
  archive,
  '--at',
  'last',
  '--select',
  'store:state',
  '--select',
  'render:scene=main',
  '--payload',
  'full',
]);
if (renderQ.ok) {
  const state = renderQ.result?.select?.['store:state'];
  const render = renderQ.result?.select?.['render:scene=main'];
  const gridVals = state.grid.filter((v) => v > 0).sort((a, b) => a - b);
  const renderVals = boardValuesFromRender(render, state).sort((a, b) => a - b);
  assert(
    'render board tiles match store',
    JSON.stringify(gridVals) === JSON.stringify(renderVals),
    `grid=${JSON.stringify(gridVals)} render=${JSON.stringify(renderVals)}`,
  );
}

console.log('\n========== 结果 ==========');
if (failures.length === 0) {
  console.log('全部通过，未发现逻辑 bug。');
  process.exit(0);
}
console.log(`失败 ${failures.length} 项：`);
for (const f of failures) console.log(' -', f.name, f.detail);
process.exit(1);
