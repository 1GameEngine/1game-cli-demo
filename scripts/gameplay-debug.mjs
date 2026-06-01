#!/usr/bin/env node
/**
 * Headless minesweeper checks via 1gameplay CLI.
 * Run: node scripts/gameplay-debug.mjs
 */
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';

const ARCHIVE = 'out/debug.1gamerecord';
const COLS = 9;
const ROWS = 8;
const CELL_SIZE = 26;
const SCENE_WIDTH = 320;
const SCENE_HEIGHT = 300;
const HUD_HEIGHT = 36;
const TOOLBAR_HEIGHT = 44;
const GRID_WIDTH = COLS * CELL_SIZE;
const GRID_HEIGHT = ROWS * CELL_SIZE;
const GRID_OFFSET_X = Math.floor((SCENE_WIDTH - GRID_WIDTH) / 2);
const GRID_OFFSET_Y = HUD_HEIGHT + Math.floor((SCENE_HEIGHT - HUD_HEIGHT - TOOLBAR_HEIGHT - GRID_HEIGHT) / 2);

function run(cmd, args) {
  const out = execFileSync(cmd, args, { encoding: 'utf8', cwd: new URL('..', import.meta.url).pathname.replace(/\/$/, '') });
  return JSON.parse(out);
}

function cellCenter(x, y) {
  return {
    x: GRID_OFFSET_X + x * CELL_SIZE + Math.floor(CELL_SIZE / 2),
    y: GRID_OFFSET_Y + y * CELL_SIZE + Math.floor(CELL_SIZE / 2),
  };
}

function click(archive, x, y) {
  return run('pnpm', [
    'exec',
    '1gameplay',
    'step',
    archive,
    '--ms',
    '16',
    '--event',
    JSON.stringify({ type: 'click', sceneId: 'main', data: { x, y } }),
  ]);
}

function queryState(archive) {
  const res = run('pnpm', [
    'exec',
    '1gameplay',
    'frame',
    'query',
    archive,
    '--at',
    'last',
    '--select',
    'store:state',
    '--payload',
    'full',
  ]);
  return res.result.select['store:state'];
}

function countDisplay(cells, display) {
  return cells.filter((c) => c.display === display).length;
}

function mineCount(cells) {
  return cells.filter((c) => c.mine).length;
}

function validateAdjacent(cells) {
  const errors = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const i = y * COLS + x;
      if (cells[i].mine) continue;
      let expected = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
          if (cells[ny * COLS + nx].mine) expected += 1;
        }
      }
      if (cells[i].adjacent !== expected) {
        errors.push(`(${x},${y}) adjacent=${cells[i].adjacent} expected=${expected}`);
      }
    }
  }
  return errors;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const issues = [];
const pass = (name) => console.log(`✓ ${name}`);

try {
  rmSync(ARCHIVE, { force: true });
  run('pnpm', ['exec', '1gameplay', 'create', '--entry', 'src/game.tsx', '--out', ARCHIVE]);

  let state = queryState(ARCHIVE);
  assert(state.phase === 'playing', 'initial phase');
  assert(!state.minesPlaced, 'mines not placed initially');
  assert(countDisplay(state.cells, 'hidden') === COLS * ROWS, 'all hidden');
  pass('fresh archive');

  const mid = cellCenter(4, 4);
  click(ARCHIVE, mid.x, mid.y);
  state = queryState(ARCHIVE);
  assert(state.minesPlaced, 'mines placed after first reveal');
  assert(mineCount(state.cells) === 12, `expected 12 mines, got ${mineCount(state.cells)}`);
  assert(state.cells[4 * COLS + 4].display === 'revealed', 'center revealed');
  assert(state.cells[4 * COLS + 4].mine === false, 'first click cell must not be mine');
  const adjErrors = validateAdjacent(state.cells);
  assert(adjErrors.length === 0, `adjacent mismatch: ${adjErrors.join('; ')}`);
  pass('first click: safe reveal + mine layout');

  const mineCell = state.cells.findIndex((c) => c.mine && c.display === 'hidden');
  assert(mineCell >= 0, 'need hidden mine');
  const mx = mineCell % COLS;
  const my = Math.floor(mineCell / COLS);
  const mpt = cellCenter(mx, my);
  click(ARCHIVE, mpt.x, mpt.y);
  state = queryState(ARCHIVE);
  assert(state.phase === 'lost', `expected lost, got ${state.phase}`);
  const revealedMines = state.cells.filter((c) => c.mine && c.display === 'revealed').length;
  assert(revealedMines === 12, `all mines shown on loss, got ${revealedMines}`);
  pass('click mine -> lose');

  const restartPt = { x: 258, y: SCENE_HEIGHT - TOOLBAR_HEIGHT + 6 + 16 };
  click(ARCHIVE, restartPt.x, restartPt.y);
  state = queryState(ARCHIVE);
  assert(state.phase === 'playing', 'restarted phase');
  assert(!state.minesPlaced, 'restarted: mines cleared');
  assert(countDisplay(state.cells, 'hidden') === COLS * ROWS, 'restarted: all hidden');
  pass('restart resets board');

  rmSync(ARCHIVE, { force: true });
  run('pnpm', ['exec', '1gameplay', 'create', '--entry', 'src/game.tsx', '--out', ARCHIVE]);
  const flagBtn = { x: 62, y: SCENE_HEIGHT - TOOLBAR_HEIGHT + 6 + 16 };
  click(ARCHIVE, flagBtn.x, flagBtn.y);
  state = queryState(ARCHIVE);
  assert(state.flagMode === true, 'flag mode on');
  const c00 = cellCenter(0, 0);
  click(ARCHIVE, c00.x, c00.y);
  state = queryState(ARCHIVE);
  assert(state.cells[0].display === 'flagged', 'cell flagged');
  assert(state.flagsPlaced === 1, 'flag count');
  assert(!state.minesPlaced, 'flag before first reveal should not place mines');
  pass('flag mode before mines placed');

  click(ARCHIVE, c00.x, c00.y);
  state = queryState(ARCHIVE);
  assert(state.cells[0].display === 'hidden', 'unflag');
  assert(state.flagsPlaced === 0, 'flag count cleared');
  pass('toggle flag off');

  rmSync(ARCHIVE, { force: true });
  run('pnpm', ['exec', '1gameplay', 'create', '--entry', 'src/game.tsx', '--out', ARCHIVE]);
  click(ARCHIVE, mid.x, mid.y);
  state = queryState(ARCHIVE);
  const revealedBefore = countDisplay(state.cells, 'revealed');
  click(ARCHIVE, mid.x, mid.y);
  state = queryState(ARCHIVE);
  assert(countDisplay(state.cells, 'revealed') === revealedBefore, 're-click revealed cell is no-op');
  pass('re-click revealed cell');

  rmSync(ARCHIVE, { force: true });
  run('pnpm', ['exec', '1gameplay', 'create', '--entry', 'src/game.tsx', '--out', ARCHIVE]);
  click(ARCHIVE, mid.x, mid.y);
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const i = y * COLS + x;
      const cell = queryState(ARCHIVE).cells[i];
      if (!cell.mine && cell.display === 'hidden') {
        const pt = cellCenter(x, y);
        click(ARCHIVE, pt.x, pt.y);
      }
    }
  }
  state = queryState(ARCHIVE);
  assert(state.phase === 'won', `expected won, got ${state.phase}`);
  assert(countDisplay(state.cells, 'hidden') === mineCount(state.cells), 'only mines remain hidden');
  pass('reveal all safe cells -> win');

  console.log('\nAll gameplay checks passed.');
} catch (e) {
  console.error('\nFAIL:', e.message);
  process.exit(1);
}
