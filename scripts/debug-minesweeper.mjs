#!/usr/bin/env node
/**
 * Headless minesweeper regression via 1gameplay step + frame query.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const ARCHIVE = 'out/debug.1gamerecord';
const CELL = 35;
const GRID_Y = 26;

function run(cmd, args) {
  const out = execFileSync(cmd, args, { encoding: 'utf8', cwd: new URL('..', import.meta.url).pathname });
  return JSON.parse(out);
}

function cellCenter(col, row) {
  return { x: col * CELL + 17, y: GRID_Y + row * CELL + 17 };
}

function queryState() {
  const res = run('npx', [
    '1gameplay',
    'frame',
    'query',
    ARCHIVE,
    '--at',
    'last',
    '--select',
    'store:state',
    '--payload',
    'summary',
  ]);
  return res.result.select['store:state'];
}

function click(x, y) {
  run('npx', [
    '1gameplay',
    'step',
    ARCHIVE,
    '--ms',
    '16',
    '--event',
    JSON.stringify({ type: 'click', sceneId: 'main', data: { x, y } }),
  ]);
}

function countBoard(board) {
  let revealed = 0;
  let flagged = 0;
  let hidden = 0;
  let mines = 0;
  for (const row of board) {
    for (const c of row) {
      if (c.isMine) mines += 1;
      if (c.state === 'revealed') revealed += 1;
      if (c.state === 'flagged') flagged += 1;
      if (c.state === 'hidden') hidden += 1;
    }
  }
  return { revealed, flagged, hidden, mines };
}

const issues = [];

function assert(cond, msg) {
  if (!cond) issues.push(msg);
}

console.log('Creating archive...');
execFileSync('npm', ['run', 'gameplay:create', '-s'], { cwd: new URL('..', import.meta.url).pathname });

let s = queryState();
assert(s.phase === 'ready', `initial phase should be ready, got ${s.phase}`);
assert(s.minesPlaced === false, 'mines should not be placed initially');

// First reveal
const c = cellCenter(4, 4);
click(c.x, c.y);
s = queryState();
const afterFirst = countBoard(s.board);
assert(s.minesPlaced === true, 'mines should be placed after first click');
assert(s.board[4][4].state === 'revealed', 'clicked cell should be revealed');
assert(s.board[4][4].isMine === false, 'first click cell must not be mine');
assert(afterFirst.revealed > 1, 'flood fill should reveal multiple cells');
console.log('After first click:', afterFirst, 'phase:', s.phase);

// Flag mode + single flag
click(76, 470); // flag mode button
s = queryState();
assert(s.flagMode === true, 'flag mode should be on');

// Find a hidden cell
let hx = -1;
let hy = -1;
for (let y = 0; y < s.board.length; y += 1) {
  for (let x = 0; x < s.board[y].length; x += 1) {
    if (s.board[y][x].state === 'hidden') {
      hx = x;
      hy = y;
      break;
    }
  }
  if (hx >= 0) break;
}
const hc = cellCenter(hx, hy);
click(hc.x, hc.y);
s = queryState();
assert(s.flagsPlaced === 1, `flagsPlaced should be 1 after one flag, got ${s.flagsPlaced}`);
assert(s.board[hy][hx].state === 'flagged', 'target cell should be flagged');
console.log('After one flag: flagsPlaced=', s.flagsPlaced);

// Switch back to reveal mode and click a mine
let mx = -1;
let my = -1;
for (let y = 0; y < s.board.length; y += 1) {
  for (let x = 0; x < s.board[y].length; x += 1) {
    const cell = s.board[y][x];
    if (cell.isMine && cell.state === 'hidden') {
      mx = x;
      my = y;
      break;
    }
  }
  if (mx >= 0) break;
}
click(76, 470); // toggle flag mode off
s = queryState();
assert(s.flagMode === false, 'flag mode should be off');
const mc = cellCenter(mx, my);
click(mc.x, mc.y);
s = queryState();
assert(s.phase === 'lost', `should lose on mine click, got ${s.phase}`);
const lostMines = s.board.flat().filter((c) => c.isMine && c.state === 'revealed').length;
assert(lostMines === s.mineCount, `all mines should show on loss, got ${lostMines}/${s.mineCount}`);
console.log('After mine click: phase=', s.phase, 'revealed mines=', lostMines);

// Restart
click(244, 470); // restart button center
s = queryState();
assert(s.phase === 'ready', `restart should reset to ready, got ${s.phase}`);
assert(s.minesPlaced === false, 'restart should clear mines');
assert(s.flagsPlaced === 0, 'restart should clear flags');
const afterRestart = countBoard(s.board);
assert(afterRestart.revealed === 0, 'board should be fresh after restart');
console.log('After restart:', afterRestart, 'phase:', s.phase);

// Win scenario on fresh restart - reveal all safe cells programmatically via clicks
// Use fresh archive
console.log('\n--- Win test (new archive) ---');
execFileSync('rm', ['-f', ARCHIVE], { cwd: new URL('..', import.meta.url).pathname });
execFileSync('npm', ['run', 'gameplay:create', '-s'], { cwd: new URL('..', import.meta.url).pathname });

click(cellCenter(4, 4).x, cellCenter(4, 4).y);
s = queryState();

const toReveal = [];
for (let y = 0; y < s.board.length; y += 1) {
  for (let x = 0; x < s.board[y].length; x += 1) {
    const cell = s.board[y][x];
    if (!cell.isMine && cell.state === 'hidden') toReveal.push({ x, y });
  }
}
for (const { x, y } of toReveal) {
  const p = cellCenter(x, y);
  click(p.x, p.y);
  s = queryState();
  if (s.phase === 'won' || s.phase === 'lost') break;
}
const final = countBoard(s.board);
assert(s.phase === 'won', `should win after revealing all safe cells, got ${s.phase}`);
assert(final.hidden === s.mineCount, `only mines should remain hidden, hidden=${final.hidden} mines=${s.mineCount}`);
console.log('Win test: phase=', s.phase, 'counts=', final);

if (issues.length) {
  console.error('\nBUGS FOUND:');
  for (const i of issues) console.error(' -', i);
  process.exit(1);
}
console.log('\nAll checks passed.');
