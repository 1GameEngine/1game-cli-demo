#!/usr/bin/env node
/**
 * Headless 2048 playtest via 1gameplay CLI.
 * Runs moves, validates grid invariants, reports anomalies.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ARCHIVE = path.join(ROOT, 'out/playtest.1gamerecord');
const GRID = 4;
const SIZE = GRID * GRID;

const DIRECTIONS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

function run(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', maxBuffer: 20 * 1024 * 1024 });
}

function parseJson(stdout) {
  const start = stdout.indexOf('{');
  if (start < 0) throw new Error(`No JSON in output:\n${stdout}`);
  return JSON.parse(stdout.slice(start));
}

function queryState() {
  const out = run(
    `pnpm exec 1gameplay frame query "${ARCHIVE}" --at last --select store:state --payload full`,
  );
  const j = parseJson(out);
  if (!j.ok) throw new Error(`query failed: ${JSON.stringify(j)}`);
  return j.result.select['store:state'];
}

function writeKeypress(code, file) {
  const payload = [{ type: 'keypress', sceneId: 'main', data: { code, time: 1000 } }];
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
}

function move(code) {
  const ev = path.join(ROOT, 'out', `ev-${code}.json`);
  writeKeypress(code, ev);
  const out = run(`pnpm exec 1gameplay step "${ARCHIVE}" --ms 16 --event-file "${ev}"`);
  const j = parseJson(out);
  if (!j.ok) throw new Error(`step failed for ${code}: ${JSON.stringify(j)}`);
}

function gridStr(grid) {
  const rows = [];
  for (let r = 0; r < GRID; r++) {
    rows.push(grid.slice(r * GRID, r * GRID + GRID).map((v) => String(v || '.').padStart(5)).join(' '));
  }
  return rows.join('\n');
}

function emptyCount(grid) {
  return grid.filter((v) => v === 0).length;
}

function maxTile(grid) {
  return Math.max(...grid, 0);
}

function totalTiles(grid) {
  return grid.filter((v) => v > 0).length;
}

function validateGrid(grid, label) {
  const issues = [];
  if (grid.length !== SIZE) issues.push(`${label}: grid length ${grid.length} !== ${SIZE}`);
  for (let i = 0; i < grid.length; i++) {
    const v = grid[i];
    if (!Number.isInteger(v) || v < 0) issues.push(`${label}: invalid cell[${i}]=${v}`);
    if (v > 0 && v !== 0 && (v & (v - 1)) !== 0) issues.push(`${label}: non-power-of-2 at [${i}]=${v}`);
  }
  return issues;
}

function cloneGrid(grid) {
  return [...grid];
}

// --- pure 2048 logic mirror for move validation ---
function moveLine(line) {
  const filtered = line.filter((c) => c !== 0);
  const result = [];
  let score = 0;
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      result.push(merged);
      score += merged;
      i += 2;
    } else {
      result.push(filtered[i]);
      i += 1;
    }
  }
  while (result.length < GRID) result.push(0);
  return { line: result.slice(0, GRID), score };
}

function getRow(grid, row) {
  const out = [];
  for (let c = 0; c < GRID; c++) out.push(grid[row * GRID + c]);
  return out;
}
function setRow(grid, row, values) {
  for (let c = 0; c < GRID; c++) grid[row * GRID + c] = values[c];
}
function getCol(grid, col) {
  const out = [];
  for (let r = 0; r < GRID; r++) out.push(grid[r * GRID + col]);
  return out;
}
function setCol(grid, col, values) {
  for (let r = 0; r < GRID; r++) grid[r * GRID + col] = values[r];
}

function moveGridPure(grid, direction) {
  const next = cloneGrid(grid);
  let totalScore = 0;
  const applyRows = (reverse) => {
    for (let r = 0; r < GRID; r++) {
      let row = getRow(next, r);
      if (reverse) row = [...row].reverse();
      const { line, score } = moveLine(row);
      totalScore += score;
      setRow(next, r, reverse ? [...line].reverse() : line);
    }
  };
  const applyCols = (reverse) => {
    for (let c = 0; c < GRID; c++) {
      let col = getCol(next, c);
      if (reverse) col = [...col].reverse();
      const { line, score } = moveLine(col);
      totalScore += score;
      setCol(next, c, reverse ? [...line].reverse() : line);
    }
  };
  const map = { ArrowLeft: () => applyRows(false), ArrowRight: () => applyRows(true), ArrowUp: () => applyCols(false), ArrowDown: () => applyCols(true) };
  map[direction]?.();
  const changed = next.some((v, i) => v !== grid[i]);
  return { grid: next, score: totalScore, changed };
}

function gridsEqual(a, b) {
  return a.every((v, i) => v === b[i]);
}

// --- main ---
console.log('[playtest] creating archive...');
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
if (fs.existsSync(ARCHIVE)) fs.unlinkSync(ARCHIVE);
run(`pnpm exec 1gameplay create --entry src/game.tsx --out "${ARCHIVE}"`);

let state = queryState();
console.log('[playtest] initial grid:\n' + gridStr(state.grid));
console.log(`[playtest] initial tiles=${totalTiles(state.grid)} empties=${emptyCount(state.grid)}`);

const bugs = [];
let moves = 0;
const MOVE_LIMIT = 80;

for (let n = 0; n < MOVE_LIMIT && state.phase === 'playing'; n++) {
  const dir = DIRECTIONS[n % DIRECTIONS.length];
  const before = cloneGrid(state.grid);
  const beforeScore = state.score;
  const beforeTiles = totalTiles(state.grid);
  const beforeEmpties = emptyCount(state.grid);
  const pure = moveGridPure(before, dir);

  move(dir);
  state = queryState();

  bugs.push(...validateGrid(state.grid, `after move ${n + 1}`));

  if (pure.changed) {
    // After valid move: tile count should increase by 1 (spawn) unless board was full before spawn
    const afterTiles = totalTiles(state.grid);
    const afterEmpties = emptyCount(state.grid);

    // Score must increase by merge amount
    const expectedScoreDelta = pure.score;
    const actualScoreDelta = state.score - beforeScore;
    if (actualScoreDelta !== expectedScoreDelta) {
      bugs.push(
        `move ${n + 1} ${dir}: score delta ${actualScoreDelta} !== expected merge score ${expectedScoreDelta}`,
      );
    }

    // Grid after move (before spawn) should match pure move; we can't separate spawn easily,
    // but tile count: before merge reduces tiles, spawn adds 1
    // Multiple merges in one move can free more than one cell before spawn.
    if (afterTiles > beforeTiles + 1) {
      bugs.push(`move ${n + 1} ${dir}: tile count jumped ${beforeTiles} -> ${afterTiles}`);
    }
    moves++;
  } else {
    // Invalid move: state should be unchanged
    if (!gridsEqual(state.grid, before)) {
      bugs.push(`move ${n + 1} ${dir}: grid changed on invalid move\nbefore:\n${gridStr(before)}\nafter:\n${gridStr(state.grid)}`);
    }
    if (state.score !== beforeScore) {
      bugs.push(`move ${n + 1} ${dir}: score changed on invalid move`);
    }
    if (totalTiles(state.grid) !== beforeTiles) {
      bugs.push(`move ${n + 1} ${dir}: tile spawned on invalid move`);
    }
  }

  if (state.phase === 'won' && !state.wonAcknowledged) {
    console.log(`[playtest] won at move ${n + 1}, max tile=${maxTile(state.grid)}`);
  }
  if (state.phase === 'lost') {
    console.log(`[playtest] lost at move ${n + 1}`);
    break;
  }
}

console.log('\n[playtest] final state:');
console.log(`  phase=${state.phase} score=${state.score} best=${state.bestScore} max=${maxTile(state.grid)}`);
console.log(gridStr(state.grid));
console.log(`[playtest] valid moves executed: ${moves}`);

// Test click restart area (approx coords from game.tsx)
console.log('\n[playtest] testing click restart button...');
const beforeRestart = cloneGrid(state.grid);
const clickEv = path.join(ROOT, 'out/ev-restart-click.json');
fs.writeFileSync(
  clickEv,
  JSON.stringify([{ type: 'click', sceneId: 'main', data: { x: 48, y: 478 } }]),
);
const stepOut = run(`pnpm exec 1gameplay step "${ARCHIVE}" --ms 16 --event-file "${clickEv}"`);
parseJson(stepOut);
state = queryState();
if (state.phase !== 'playing' || state.score !== 0) {
  bugs.push(`restart click: expected phase=playing score=0, got phase=${state.phase} score=${state.score}`);
}
if (gridsEqual(state.grid, beforeRestart)) {
  bugs.push('restart click: grid unchanged (click may have missed hit region)');
}
if (totalTiles(state.grid) < 2) {
  bugs.push(`restart click: expected 2 starting tiles, got ${totalTiles(state.grid)}`);
} else {
  console.log('[playtest] restart click OK');
}

// Render sanity
const renderOut = run(
  `pnpm exec 1gameplay frame query "${ARCHIVE}" --at last --select render:scene=main --payload summary`,
);
const renderJ = parseJson(renderOut);
if (!renderJ.ok) bugs.push('render query failed');

console.log('\n========== PLAYTEST REPORT ==========');
if (bugs.length === 0) {
  console.log('No bugs detected in automated playtest.');
  process.exit(0);
} else {
  console.log(`Found ${bugs.length} issue(s):`);
  for (const b of bugs) console.log('  -', b);
  process.exit(1);
}
