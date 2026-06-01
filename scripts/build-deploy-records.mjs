#!/usr/bin/env node
/**
 * Build 1gameplay archives + single-file replay HTML for Vercel deploy.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const ARCHIVE = join(ROOT, 'out/records/full-regression.1gamerecord');
const DEPLOY = join(ROOT, 'deploy');
const CELL = 35;
const GRID_Y = 26;

function run(cmd, args) {
  execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
}

function runJson(cmd, args) {
  return JSON.parse(execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8' }));
}

function cellCenter(col, row) {
  return { x: col * CELL + 17, y: GRID_Y + row * CELL + 17 };
}

function click(archive, x, y, label) {
  run('npx', [
    '1gameplay',
    'step',
    archive,
    '--ms',
    '16',
    '--event',
    JSON.stringify({ type: 'click', sceneId: 'main', data: { x, y } }),
  ]);
  if (label) {
    run('npx', ['1gameplay', 'comments', 'add', archive, '--at', 'last', '--body', label]);
  }
}

function queryState(archive) {
  const res = runJson('npx', [
    '1gameplay',
    'frame',
    'query',
    archive,
    '--at',
    'last',
    '--select',
    'store:state',
    '--payload',
    'summary',
  ]);
  return res.result.select['store:state'];
}

mkdirSync(join(ROOT, 'out/records'), { recursive: true });
mkdirSync(DEPLOY, { recursive: true });
mkdirSync(join(DEPLOY, 'replay'), { recursive: true });
mkdirSync(join(DEPLOY, 'records'), { recursive: true });

console.log('[deploy] create archive...');
run('npx', ['1gameplay', 'create', '--entry', 'src/game.tsx', '--out', ARCHIVE]);

const log = [];

function snap(step, note) {
  const s = queryState(ARCHIVE);
  const counts = { revealed: 0, flagged: 0, hidden: 0 };
  for (const row of s.board) {
    for (const c of row) {
      if (c.state === 'revealed') counts.revealed += 1;
      if (c.state === 'flagged') counts.flagged += 1;
      if (c.state === 'hidden') counts.hidden += 1;
    }
  }
  log.push({ step, note, phase: s.phase, flagsPlaced: s.flagsPlaced, flagMode: s.flagMode, ...counts });
  console.log(`[deploy] ${step}: ${note} -> phase=${s.phase}`);
}

snap(0, '初始状态');

click(ARCHIVE, cellCenter(4, 4).x, cellCenter(4, 4).y, '首次点击 (4,4) 泛洪展开');
snap(1, '首次揭开后');

click(ARCHIVE, 76, 470, '切换插旗模式');
click(ARCHIVE, cellCenter(7, 0).x, cellCenter(7, 0).y, '插旗 (7,0)');
snap(2, '插旗后');

click(ARCHIVE, 76, 470, '切回揭开模式');
let s = queryState(ARCHIVE);
let mineX = -1;
let mineY = -1;
for (let y = 0; y < s.board.length; y++) {
  for (let x = 0; x < s.board[y].length; x++) {
    if (s.board[y][x].isMine && s.board[y][x].state === 'hidden') {
      mineX = x;
      mineY = y;
      break;
    }
  }
  if (mineX >= 0) break;
}
const mc = cellCenter(mineX, mineY);
click(ARCHIVE, mc.x, mc.y, `踩雷 (${mineX},${mineY})`);
snap(3, '失败后');

click(ARCHIVE, 244, 470, '点击重新开始');
snap(4, '重启后');

click(ARCHIVE, cellCenter(4, 4).x, cellCenter(4, 4).y, '新局首次点击');
s = queryState(ARCHIVE);
const toReveal = [];
for (let y = 0; y < s.board.length; y++) {
  for (let x = 0; x < s.board[y].length; x++) {
    const c = s.board[y][x];
    if (!c.isMine && c.state === 'hidden') toReveal.push({ x, y });
  }
}
for (const { x, y } of toReveal) {
  const p = cellCenter(x, y);
  click(ARCHIVE, p.x, p.y);
  s = queryState(ARCHIVE);
  if (s.phase === 'won') break;
}
run('npx', ['1gameplay', 'comments', 'add', ARCHIVE, '--at', 'last', '--body', '自动揭开所有安全格 — 胜利']);
snap(5, '胜利');

const frames = runJson('npx', ['1gameplay', 'frames', 'list', ARCHIVE]);
const frameRows = frames.result.rows;

writeFileSync(
  join(DEPLOY, 'debug-log.json'),
  JSON.stringify(
    {
      title: '扫雷 1gameplay 调试记录',
      archive: 'records/full-regression.1gamerecord',
      frameCount: frameRows.length,
      steps: log,
      frames: frameRows,
    },
    null,
    2,
  ),
);

console.log('[deploy] bundle replay HTML...');
run('npx', [
  '1gameplay',
  'bundle-player-html',
  ARCHIVE,
  '--out',
  join(DEPLOY, 'replay/full-regression.html'),
  '--single-html',
  '--title',
  '扫雷调试回放 — 完整回归',
]);

copyFileSync(ARCHIVE, join(DEPLOY, 'records/full-regression.1gamerecord'));

console.log('[deploy] done:', frameRows.length, 'frames');
