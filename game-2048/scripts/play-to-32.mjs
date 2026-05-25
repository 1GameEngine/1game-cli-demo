#!/usr/bin/env node
/**
 * Simulate 2048 locally until max tile >= 32, then record moves into .1gamerecord.
 */
import { execFileSync } from 'node:child_process';
import { unlinkSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVE = join(ROOT, 'out/to32.1gamerecord');
const TARGET = 32;
const MAX_MOVES = 500;
const GRID = 4;
const SIZE = 16;

const CODE_TO_DIR = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
};

const DIRS = ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'];

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function nextSeed(seed) {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function emptyIndices(grid) {
  const out = [];
  for (let i = 0; i < SIZE; i++) if (grid[i] === 0) out.push(i);
  return out;
}

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

function moveGrid(grid, direction) {
  const next = [...grid];
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
  switch (direction) {
    case 'left':
      applyRows(false);
      break;
    case 'right':
      applyRows(true);
      break;
    case 'up':
      applyCols(false);
      break;
    case 'down':
      applyCols(true);
      break;
  }
  const changed = next.some((v, i) => v !== grid[i]);
  return { grid: next, score: totalScore, changed };
}

function spawnTile(grid, seed) {
  const empties = emptyIndices(grid);
  if (empties.length === 0) return { grid, seed };
  const rng = mulberry32(seed);
  const index = empties[Math.floor(rng() * empties.length)];
  const value = rng() < 0.9 ? 2 : 4;
  const next = [...grid];
  next[index] = value;
  return { grid: next, seed: nextSeed(seed) };
}

function createInitialGrid(seed) {
  let grid = Array(SIZE).fill(0);
  let s = seed;
  ({ grid, seed: s } = spawnTile(grid, s));
  ({ grid, seed: s } = spawnTile(grid, s));
  return { grid, seed: s };
}

function canMove(grid) {
  if (emptyIndices(grid).length > 0) return true;
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const v = grid[r * GRID + c];
      if (c + 1 < GRID && grid[r * GRID + c + 1] === v) return true;
      if (r + 1 < GRID && grid[(r + 1) * GRID + c] === v) return true;
    }
  }
  return false;
}

function maxTile(grid) {
  return Math.max(0, ...grid);
}

function pickMove(grid) {
  let best = null;
  let bestScore = -Infinity;
  for (const code of DIRS) {
    const dir = CODE_TO_DIR[code];
    const { grid: next, changed } = moveGrid(grid, dir);
    if (!changed) continue;
    const empties = next.filter((v) => v === 0).length;
    const max = maxTile(next);
    const corner = next[15];
    const s = max * 1000 + empties * 10 + corner + (code === 'ArrowDown' ? 2 : 0) + (code === 'ArrowLeft' ? 1 : 0);
    if (s > bestScore) {
      bestScore = s;
      best = code;
    }
  }
  return best ?? 'ArrowLeft';
}

function simulateTo32() {
  const initial = createInitialGrid(0x2048);
  let grid = initial.grid;
  let rngSeed = initial.seed;
  let score = 0;
  const moves = [];

  for (let n = 0; n < MAX_MOVES; n++) {
    if (maxTile(grid) >= TARGET) {
      return { moves, score, max: maxTile(grid), grid };
    }
    if (!canMove(grid)) break;

    const code = pickMove(grid);
    const dir = CODE_TO_DIR[code];
    const { grid: next, score: gained, changed } = moveGrid(grid, dir);
    if (!changed) continue;

    grid = next;
    score += gained;
    const spawned = spawnTile(grid, rngSeed);
    grid = spawned.grid;
    rngSeed = spawned.seed;
    moves.push(code);
  }

  return { moves, score, max: maxTile(grid), grid, failed: maxTile(grid) < TARGET };
}

function run1gameplay(args) {
  return execFileSync(join(ROOT, 'node_modules/.bin/1gameplay'), args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
}

function parseJson(stdout) {
  const trimmed = stdout.trim();
  const start = trimmed.indexOf('{');
  return JSON.parse(trimmed.slice(start));
}

console.log('[play-to-32] simulating locally...');
const sim = simulateTo32();
if (sim.failed) {
  console.error(JSON.stringify({ ok: false, reason: 'sim_failed', ...sim }));
  process.exit(1);
}
console.log(`[play-to-32] planned ${sim.moves.length} moves, max=${sim.max}, score=${sim.score}`);

if (existsSync(ARCHIVE)) unlinkSync(ARCHIVE);
run1gameplay(['create', '--entry', 'src/game.tsx', '--out', 'out/to32.1gamerecord', '--checkpoint-every', '60']);

function keyPayload(code, timeMs) {
  return JSON.stringify({
    type: 'keyboard',
    sceneId: 'main',
    data: [
      {
        time: timeMs,
        key: code,
        code,
        shift: false,
        meta: false,
        alt: false,
        ctrl: false,
      },
    ],
  });
}

let timeMs = 32;
for (let i = 0; i < sim.moves.length; i++) {
  const code = sim.moves[i];
  run1gameplay(['step', 'out/to32.1gamerecord', '--ms', '16', '--event', keyPayload(code, timeMs)]);
  timeMs += 16;
  run1gameplay([
    'step',
    'out/to32.1gamerecord',
    '--ms',
    '16',
    '--event',
    JSON.stringify({ type: 'keyboard', sceneId: 'main', data: [] }),
  ]);
  timeMs += 16;
  if ((i + 1) % 10 === 0) console.log(`[play-to-32] recorded ${i + 1}/${sim.moves.length}`);
}

const state = parseJson(
  run1gameplay([
    'frame',
    'query',
    'out/to32.1gamerecord',
    '--at',
    'last',
    '--select',
    'store:state',
    '--payload',
    'summary',
  ]),
).result.select['store:state'];

const recordedMax = maxTile(state.grid);
console.log(
  JSON.stringify({
    ok: recordedMax >= TARGET,
    moves: sim.moves.length,
    max: recordedMax,
    score: state.score,
    archive: ARCHIVE,
  }),
);
process.exit(recordedMax >= TARGET ? 0 : 1);
