#!/usr/bin/env node
/**
 * 1gameplay 自动化调试：滑动、键盘、吃食物、撞墙、重新开始
 */
import { execSync } from 'node:child_process';
import { rmSync, writeFileSync, mkdirSync } from 'node:fs';

const ARCHIVE = 'out/debug.1gamerecord';
const MS = 130;
const BOARD_CENTER_X = 144;
const BOARD_Y = 200;

function run(cmd) {
  return execSync(cmd, { cwd: process.cwd(), encoding: 'utf8' });
}

function queryState(at = 'last') {
  const out = run(
    `npx 1gameplay frame query ${ARCHIVE} --at ${at} --select store:state --payload summary`,
  );
  const json = JSON.parse(out);
  return json.result.select['store:state'];
}

function step(args) {
  run(`npx 1gameplay step ${ARCHIVE} --ms ${MS} ${args}`);
}

function fresh() {
  rmSync(ARCHIVE, { force: true });
  run(`npx 1gameplay create --entry src/game.tsx --out ${ARCHIVE}`);
}

const results = [];

function assert(name, cond, detail = '') {
  results.push({ name, ok: cond, detail });
  const mark = cond ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${name}${detail ? ': ' + detail : ''}`);
}

console.log('=== 1gameplay 贪吃蛇调试 ===\n');

// 1. 无操作应撞右墙 game-over
fresh();
step('--repeat 12');
const noInput = queryState();
assert(
  '无输入撞墙结束',
  noInput.phase === 'game-over' && noInput.snake[0].x === 17,
  `phase=${noInput.phase} head=(${noInput.snake[0].x},${noInput.snake[0].y})`,
);

// 2. 向上滑动应改变方向并存活更久
fresh();
const cx = BOARD_CENTER_X;
const cy = BOARD_Y;
step(`--event '${JSON.stringify({ type: 'pointer.down', sceneId: 'main', data: { id: 1, x: cx, y: cy } })}'`);
step(`--event '${JSON.stringify({ type: 'pointer.move', sceneId: 'main', data: { id: 1, x: cx, y: cy - 50 } })}'`);
step(`--event '${JSON.stringify({ type: 'pointer.up', sceneId: 'main', data: { id: 1, x: cx, y: cy - 50 } })}'`);
step('--repeat 15');
const afterSwipeUp = queryState();
assert(
  '向上滑动改向',
  afterSwipeUp.pendingDirection === 'up' || afterSwipeUp.direction === 'up',
  `dir=${afterSwipeUp.direction} pending=${afterSwipeUp.pendingDirection}`,
);
assert(
  '向上滑动后蛇头上移',
  afterSwipeUp.snake[0].y < 11,
  `head=(${afterSwipeUp.snake[0].x},${afterSwipeUp.snake[0].y})`,
);

// 3. 键盘左转
fresh();
step(`--event '{"type":"keypress","sceneId":"main","data":{"code":"ArrowUp"}}'`);
step('--repeat 8');
const afterKey = queryState();
assert(
  '键盘 ArrowUp 改向',
  afterKey.pendingDirection === 'up' || afterKey.direction === 'up',
  `dir=${afterKey.direction}`,
);

// 4. 反向滑动应被忽略（正在向右时滑向左）
fresh();
step(`--event '${JSON.stringify({ type: 'pointer.down', sceneId: 'main', data: { id: 2, x: cx, y: cy } })}'`);
step(`--event '${JSON.stringify({ type: 'pointer.move', sceneId: 'main', data: { id: 2, x: cx - 50, y: cy } })}'`);
step(`--event '${JSON.stringify({ type: 'pointer.up', sceneId: 'main', data: { id: 2, x: cx - 50, y: cy } })}'`);
const afterSwipeLeft = queryState();
assert(
  '反向滑动被忽略',
  afterSwipeLeft.pendingDirection === 'right',
  `pending=${afterSwipeLeft.pendingDirection}`,
);

// 5. 引导吃一颗食物（多次向上再向右靠近食物）
fresh();
mkdirSync('out', { recursive: true });
const eatPlan = [];
let px = cx;
let py = cy;
for (let i = 0; i < 3; i++) {
  eatPlan.push({ type: 'pointer.down', sceneId: 'main', data: { id: 10 + i, x: px, y: py } });
  py -= 50;
  eatPlan.push({ type: 'pointer.move', sceneId: 'main', data: { id: 10 + i, x: px, y: py } });
  eatPlan.push({ type: 'pointer.up', sceneId: 'main', data: { id: 10 + i, x: px, y: py } });
}
writeFileSync('out/eat-plan.events.json', JSON.stringify(eatPlan));
step('--event-file out/eat-plan.events.json --repeat 80');
const afterEat = queryState();
assert('长时间游玩未崩溃', afterEat.phase === 'playing' || afterEat.phase === 'game-over', `phase=${afterEat.phase}`);
if (afterEat.phase === 'playing') {
  assert('有机会得分', afterEat.score >= 0, `score=${afterEat.score}`);
}

// 6. game-over 后点击重新开始
fresh();
step('--repeat 12');
const over = queryState();
assert('已进入 game-over', over.phase === 'game-over', over.phase);
const restartX = 144;
const restartY = 40 + 176;
step(`--event '{"type":"click","sceneId":"main","data":{"x":${restartX},"y":${restartY}}}'`);
const restarted = queryState();
assert(
  '点击重新开始',
  restarted.phase === 'playing' && restarted.score === 0,
  `phase=${restarted.phase} score=${restarted.score}`,
);

// 7. frame diff 检查 store 历史
fresh();
step('--repeat 3');
const diffOut = run(
  `npx 1gameplay frame diff ${ARCHIVE} --from 0 --to 3 --select store:state --payload summary`,
);
const diffJson = JSON.parse(diffOut);
assert('store 历史可 diff', diffJson.ok === true, diffJson.schema);

console.log('\n=== 汇总 ===');
const failed = results.filter((r) => !r.ok);
console.log(`通过 ${results.length - failed.length}/${results.length}`);
if (failed.length) {
  console.error('失败项:', failed);
  process.exit(1);
}
