#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const record = 'out/smoke.1gamerecord';
fs.mkdirSync('out', { recursive: true });
if (fs.existsSync(record)) fs.unlinkSync(record);

function run(cmd, args) {
  const res = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  if (res.status !== 0) {
    console.error(res.stdout);
    console.error(res.stderr);
    process.exit(res.status || 1);
  }
  return res.stdout;
}

function parseJson(stdout) {
  const start = stdout.indexOf('{');
  if (start < 0) throw new Error('no json in output');
  return JSON.parse(stdout.slice(start));
}

function digState(obj) {
  if (!obj) return null;
  if (obj.phase && obj.player) return obj;
  if (obj.result?.select?.['store:state']) return digState(obj.result.select['store:state']);
  if (obj.result) return digState(obj.result);
  if (obj.select?.['store:state']) return digState(obj.select['store:state']);
  return obj;
}

function queryState() {
  const out = run('npx', [
    '1gameplay',
    'frame',
    'query',
    record,
    '--at',
    'last',
    '--select',
    'store:state',
    '--payload',
    'full',
  ]);
  return digState(parseJson(out));
}

function stepEvent(event) {
  run('npx', ['1gameplay', 'step', record, '--event', JSON.stringify(event)]);
}

function click(sid, x, y) {
  stepEvent({ type: 'click', sceneStableUid: sid, data: { x, y, ms: 200 } });
}

function key(sid, code) {
  stepEvent({ type: 'keypress', sceneStableUid: sid, data: { code, ms: 160 } });
}

function keys(sid, codes) {
  for (const code of codes) key(sid, code);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log('create...');
const created = parseJson(run('npx', ['1gameplay', 'create', '--entry', 'src/game.tsx', '--out', record]));
const sid = created.result?.sceneStableUids?.[0] || created.sceneStableUids?.[0];
assert(sid, 'missing sceneStableUid');
console.log('sceneStableUid', sid);

click(sid, 208, 284);
click(sid, 200, 400);

keys(sid, [
  'ArrowDown',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowUp',
  'ArrowUp',
  'ArrowUp',
  'ArrowUp',
  'ArrowUp',
  'ArrowUp',
  'ArrowUp',
  'ArrowUp',
  'ArrowUp',
  'ArrowRight',
  'ArrowRight',
  'ArrowRight',
  'ArrowRight',
  'ArrowRight',
  'ArrowRight',
  'ArrowUp',
]);

// F1: pick yellow key (4,1), fight green slime (5,1)
keys(sid, ['ArrowRight', 'ArrowRight', 'ArrowRight']);

const gs = queryState();
console.log('final', {
  floor: gs.floor,
  x: gs.player.x,
  y: gs.player.y,
  hp: gs.player.hp,
  gold: gs.player.gold,
  exp: gs.player.exp,
  yk: gs.player.yellowKey,
  removed: gs.removed,
  toast: gs.toastText,
});

assert(gs.phase === 'playing', `phase ${gs.phase}`);
assert(gs.floor === 1, `floor ${gs.floor}`);
assert(gs.player.x === 5 && gs.player.y === 1, `pos ${gs.player.x},${gs.player.y}`);
assert(gs.player.yellowKey === 1, `yellowKey ${gs.player.yellowKey}`);
assert(gs.player.hp === 950, `hp ${gs.player.hp}`);
assert(gs.player.gold === 1 && gs.player.exp === 1, `loot gold=${gs.player.gold} exp=${gs.player.exp}`);
assert(Array.isArray(gs.removed) && gs.removed.length >= 2, 'removed entities');

console.log('SMOKE OK');
