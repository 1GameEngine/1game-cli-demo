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

// HUD click targets (must match src/logic/types + Hud layout)
const SCENE_W = 13 * 32;
const MAP_Y = 108;
const SCENE_SAVE_X = SCENE_W - 78 + 35;
const SCENE_LOAD_X = SCENE_W - 156 + 35;
const SCENE_SAVE_Y = 8 + 14;
const SCENE_SLOT_X = 16 + 20 + (SCENE_W - 72) / 2;
const SCENE_SLOT_Y = MAP_Y + 40 + 50 + 21;

console.log('create...');
const created = parseJson(run('npx', ['1gameplay', 'create', '--entry', 'src/game.tsx', '--out', record]));
const sid = created.result?.sceneStableUids?.[0] || created.sceneStableUids?.[0];
assert(sid, 'missing sceneStableUid');
console.log('sceneStableUid', sid);

click(sid, 208, 284);
click(sid, 200, 400);

// F0 left-edge path to stairs -> F1 spawn (2,1)
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

// No yellow key: fight skeleton (2,4), then yellow door (2,5) must block
keys(sid, ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown']);

// Back to spawn (2,1), pick yellow key (4,1), fight green slime (5,1)
keys(sid, [
  'ArrowUp',
  'ArrowUp',
  'ArrowUp',
  'ArrowRight',
  'ArrowRight',
  'ArrowRight',
]);

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
// skeleton: dmg 315 gold+5 exp+4; slime: dmg 50 gold+1 exp+1; key still held
assert(gs.player.yellowKey === 1, `yellowKey ${gs.player.yellowKey}`);
assert(gs.player.hp === 1000 - 315 - 50, `hp ${gs.player.hp}`);
assert(gs.player.gold === 6 && gs.player.exp === 5, `loot gold=${gs.player.gold} exp=${gs.player.exp}`);
assert(Array.isArray(gs.removed) && gs.removed.length >= 3, 'removed entities');
assert(!gs.removed.includes('f1_tile_yellowDoor_2_5_47'), 'yellow door should remain without key');

// Save / load round-trip (phase 4 acceptance)
const savedHp = gs.player.hp;
const savedX = gs.player.x;
const savedY = gs.player.y;
const savedRemoved = gs.removed.length;

// Click 存档 button then slot 1
click(sid, SCENE_SAVE_X, SCENE_SAVE_Y);
click(sid, SCENE_SLOT_X, SCENE_SLOT_Y);

let afterSave = queryState();
assert(afterSave.saves?.[0]?.snapshot, 'save slot 1 should have snapshot');
assert(afterSave.phase === 'playing', 'should return to playing after save');

// Move away to dirty state
key(sid, 'ArrowLeft');
afterSave = queryState();
assert(afterSave.player.x !== savedX, 'should have moved after save');

// Click 读档 then slot 1
click(sid, SCENE_LOAD_X, SCENE_SAVE_Y);
click(sid, SCENE_SLOT_X, SCENE_SLOT_Y);

const loaded = queryState();
console.log('loaded', {
  x: loaded.player.x,
  y: loaded.player.y,
  hp: loaded.player.hp,
  removed: loaded.removed?.length,
  phase: loaded.phase,
});
assert(loaded.phase === 'playing', 'playing after load');
assert(loaded.player.x === savedX && loaded.player.y === savedY, `pos restored ${loaded.player.x},${loaded.player.y}`);
assert(loaded.player.hp === savedHp, `hp restored ${loaded.player.hp}`);
assert(loaded.floor === 1, 'floor restored');
assert(loaded.removed.length === savedRemoved, 'removed list restored');

console.log('SMOKE OK');
