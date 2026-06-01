#!/usr/bin/env node
/**
 * 1gameplay 自动化调试：验证扫雷状态不变量并探测 UI 点击区域
 */
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';

const ARCH = 'out/debug.1gamerecord';
const COLS = 9;
const ROWS = 12;
const CELL = 37;
const OX = 13;
// 与 game.tsx 布局一致
const HUD_HEIGHT = 118;
const BTN_Y = 74;
const BTN_H = 40;
const OY = 145; // HUD + 居中留白
const FLAG_BTN = { x: 94, y: BTN_Y + BTN_H / 2 };
const RESTART_BTN = { x: 266, y: BTN_Y + BTN_H / 2 };

function run(cmd) {
  return execSync(cmd, { cwd: new URL('..', import.meta.url).pathname, encoding: 'utf8' });
}

function queryState(at = 'last') {
  const out = run(
    `pnpm exec 1gameplay frame query ${ARCH} --at ${at} --select store:state --payload summary`,
  );
  return JSON.parse(out).result.select['store:state'];
}

function stepClick(x, y) {
  const event = JSON.stringify({ type: 'click', sceneId: 'main', data: { x, y } });
  run(`pnpm exec 1gameplay step ${ARCH} --ms 16 --event '${event.replace(/'/g, "'\\''")}'`);
}

function cellCenter(col, row) {
  return { x: OX + col * CELL + Math.floor(CELL / 2), y: OY + row * CELL + Math.floor(CELL / 2) };
}

function validateState(s, label) {
  const issues = [];
  const total = COLS * ROWS;
  const mines = s.cells.filter((c) => c.isMine).length;
  const revealed = s.cells.filter((c) => c.state === 'revealed');
  const flagged = s.cells.filter((c) => c.state === 'flagged');
  const hidden = s.cells.filter((c) => c.state === 'hidden');

  if (s.minesPlaced && mines !== s.mineCount) {
    issues.push(`${label}: 地雷数 ${mines} !== mineCount ${s.mineCount}`);
  }
  if (revealed.length + flagged.length + hidden.length !== total) {
    issues.push(`${label}: 格子状态计数之和 !== ${total}`);
  }

  const revealedNonMine = revealed.filter((c) => !c.isMine).length;
  if (s.revealedSafe !== revealedNonMine) {
    issues.push(
      `${label}: revealedSafe=${s.revealedSafe} 与已揭开非雷格 ${revealedNonMine} 不一致`,
    );
  }

  for (let i = 0; i < s.cells.length; i++) {
    const c = s.cells[i];
    if (!c.isMine && c.state === 'revealed') {
      let count = 0;
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dc && !dr) continue;
          const nc = col + dc;
          const nr = row + dr;
          if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
          if (s.cells[nr * COLS + nc].isMine) count++;
        }
      }
      if (count !== c.neighborMines) {
        issues.push(`${label}: 格 ${col},${row} 邻雷数错误: 存 ${c.neighborMines} 算 ${count}`);
      }
    }
  }

  if (s.phase === 'won') {
    const safeTotal = total - s.mineCount;
    if (revealedNonMine < safeTotal) {
      issues.push(`${label}: 胜利但非雷格未全开 (${revealedNonMine}/${safeTotal})`);
    }
  }

  return issues;
}

function hitAt(x, y) {
  const out = run(
    `pnpm exec 1gameplay frame query ${ARCH} --at last --select 'hit:point=${x},${y}:scene=main' --payload full`,
  );
  return JSON.parse(out).result.select[`hit:point=${x},${y}:scene=main`];
}

console.log('=== 重建 archive ===');
run('rm -f out/debug.1gamerecord');
run('pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord');

const allIssues = [];

let s = queryState();
allIssues.push(...validateState(s, '初始'));

console.log('\n=== 首击 (0,0) ===');
const c00 = cellCenter(0, 0);
stepClick(c00.x, c00.y);
s = queryState();
allIssues.push(...validateState(s, '首击后'));
console.log('  phase:', s.phase, 'revealedSafe:', s.revealedSafe);

console.log('\n=== 插旗模式 + 格 (8,0) ===');
stepClick(FLAG_BTN.x, FLAG_BTN.y);
stepClick(cellCenter(8, 0).x, cellCenter(8, 0).y);
s = queryState();
allIssues.push(...validateState(s, '插旗后'));
if (s.cells[8].state !== 'flagged') allIssues.push('插旗后: cell(8,0) 应为 flagged');

console.log('\n=== 关闭插旗，再点已插旗格（应用 frame diff 验证）===');
const seqBefore = Number(
  run(`pnpm exec 1gameplay frames list ${ARCH} 2>/dev/null`)
    .match(/"seq":\s*(\d+)/g)
    ?.pop()
    ?.match(/\d+/)?.[0] ?? 0,
);
stepClick(FLAG_BTN.x, FLAG_BTN.y);
stepClick(cellCenter(8, 0).x, cellCenter(8, 0).y);
const diffOut = run(
  `pnpm exec 1gameplay frame diff ${ARCH} --from ${seqBefore} --to last --select store:dump --payload summary`,
);
const dump = JSON.parse(diffOut).result.select['store:dump'];
if (!dump.equal) {
  const onlyFlag =
    dump.afterDigest?.includes('"flagMode"') &&
    !dump.afterDigest?.includes('"cells"') &&
    !dump.afterDigest?.includes('revealedSafe');
  if (!onlyFlag) {
    allIssues.push('点已插旗格后 store 变化超出 flagMode（疑似 bug）');
  }
}
s = queryState();
allIssues.push(...validateState(s, '点已插旗后'));

console.log('\n=== UI 重叠检测：顶栏按钮 vs 棋盘 ===');
const row11 = cellCenter(4, 11);
const hitRow11 = hitAt(row11.x, row11.y);
const hitFlag = hitAt(FLAG_BTN.x, FLAG_BTN.y);
console.log('  第11行中心', row11, '->', hitRow11.hit ? 'cell' : 'miss');
console.log('  插旗按钮', FLAG_BTN, '->', hitFlag.hit ? 'ui' : 'miss');
if (OY < HUD_HEIGHT) {
  allIssues.push(`UI重叠: 棋盘起点 y=${OY} 在 HUD (高 ${HUD_HEIGHT}) 内`);
}
// 插旗按钮 hit 链应较短（HUD 按钮），不应命中棋盘 group
if (hitFlag.hit && hitFlag.chain && hitFlag.chain.length > 4) {
  allIssues.push('插旗按钮点击命中深层节点，可能与棋盘 z-order 冲突');
}

console.log('\n=== 扫盘：逐格点击直到失败或胜利（新局）===');
run('rm -f out/debug.1gamerecord');
run('pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord');
stepClick(c00.x, c00.y); // 布雷

let clicks = 0;
let done = false;
for (let row = 0; row < ROWS && !done; row++) {
  for (let col = 0; col < COLS && !done; col++) {
    const { x, y } = cellCenter(col, row);
    stepClick(x, y);
    clicks++;
    s = queryState();
    if (s.phase === 'lost' || s.phase === 'won') {
      done = true;
      break;
    }
  }
}
allIssues.push(...validateState(s, '扫盘后'));
console.log('  点击次数:', clicks, 'phase:', s.phase, 'revealedSafe:', s.revealedSafe);

console.log('\n=== 踩雷检测：专门找雷格点击 ===');
run('rm -f out/debug.1gamerecord');
run('pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord');
stepClick(c00.x, c00.y);
s = queryState();
const mineIndices = s.cells.map((c, i) => (c.isMine ? i : -1)).filter((i) => i >= 0);
let hitMine = false;
for (const i of mineIndices) {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const { x, y } = cellCenter(col, row);
  stepClick(x, y);
  s = queryState();
  if (s.phase === 'lost') {
    hitMine = true;
    const revealedMines = s.cells.filter((c) => c.isMine && c.state === 'revealed').length;
    console.log('  踩雷成功, 显示地雷数:', revealedMines);
    if (revealedMines !== s.mineCount) {
      allIssues.push(`踩雷后: 仅显示 ${revealedMines}/${s.mineCount} 颗雷`);
    }
    break;
  }
}
if (!hitMine) allIssues.push('踩雷测试: 点击所有雷格仍未进入 lost');

console.log('\n========== 结果 ==========');
if (allIssues.length === 0) {
  console.log('未发现不变量违规或已知 UI 问题');
} else {
  console.log(`发现 ${allIssues.length} 个问题:`);
  for (const issue of allIssues) console.log(' -', issue);
  process.exitCode = 1;
}
