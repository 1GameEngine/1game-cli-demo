#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const record = process.argv[2] ?? 'out/to-16.1gamerecord';
const target = Number(process.argv[3] ?? 16);
const TICK_MS = 80;
const MAX_MOVES = 80;

const moves = [
  'ArrowLeft',
  'ArrowDown',
  'ArrowLeft',
  'ArrowDown',
  'ArrowRight',
  'ArrowDown',
  'ArrowLeft',
  'ArrowUp',
  'ArrowLeft',
  'ArrowUp',
  'ArrowRight',
  'ArrowRight',
  'ArrowDown',
  'ArrowLeft',
  'ArrowDown',
  'ArrowRight',
  'ArrowDown',
  'ArrowLeft',
  'ArrowDown',
  'ArrowRight',
  'ArrowRight',
  'ArrowUp',
  'ArrowLeft',
  'ArrowUp',
  'ArrowRight',
  'ArrowRight',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowUp',
  'ArrowUp',
  'ArrowRight',
  'ArrowRight',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowUp',
  'ArrowUp',
];

function queryState() {
  const out = execFileSync(
    'npx',
    ['1gameplay', 'frame', 'query', record, '--at', 'last', '--select', 'store:state', '--payload', 'summary'],
    { encoding: 'utf8' },
  );
  return JSON.parse(out).result.select['store:state'];
}

function tick(ms = TICK_MS) {
  execFileSync('npx', ['1gameplay', 'step', record, '--ms', String(ms)], { stdio: 'pipe' });
}

function waitUntilIdle(maxTicks = 12) {
  for (let i = 0; i < maxTicks; i++) {
    const state = queryState();
    if (state.animPhase === 'idle') return state;
    tick();
  }
  return queryState();
}

function stepMove(code) {
  waitUntilIdle();
  execFileSync(
    'npx',
    [
      '1gameplay',
      'step',
      record,
      '--ms',
      String(TICK_MS),
      '--event',
      JSON.stringify({ type: 'keypress', sceneId: 'main', data: { code } }),
    ],
    { stdio: 'pipe' },
  );
  return waitUntilIdle();
}

function summarize(state) {
  const max = Math.max(...state.tiles.filter((t) => !t.willRemove).map((t) => t.value));
  const board = Array.from({ length: 4 }, () => Array(4).fill('.'));
  for (const t of state.tiles) {
    if (!t.willRemove) board[t.row][t.col] = String(t.value);
  }
  return { max, score: state.score, phase: state.phase, animPhase: state.animPhase, board };
}

function printBoard(board) {
  return board.map((row) => row.map((c) => c.padStart(4, ' ')).join('')).join('\n');
}

let state = waitUntilIdle();
console.log('[start]', summarize(state));
console.log(printBoard(summarize(state).board));

for (let i = 0; i < Math.min(moves.length, MAX_MOVES); i++) {
  const code = moves[i];
  state = stepMove(code);
  const info = summarize(state);
  console.log(`\n[move ${i + 1}] ${code}  score=${info.score} max=${info.max}`);
  console.log(printBoard(info.board));
  if (info.max >= target) {
    console.log(`\n✓ 达成 ${target}，共 ${i + 1} 步有效移动`);
    process.exit(0);
  }
}

console.error(`\n未在 ${moves.length} 步内达成 ${target}，当前最大方块: ${summarize(state).max}`);
process.exit(1);
