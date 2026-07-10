#!/usr/bin/env node
/**
 * Record floors 0–1 playable experience (fixed input sequence, minimal queries).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const record = 'out/replay-floor01.1gamerecord';
const htmlOut = 'replays/floor01-replay.html';
fs.mkdirSync('out', { recursive: true });
fs.mkdirSync('replays', { recursive: true });
if (fs.existsSync(record)) fs.unlinkSync(record);

function run(cmd, args) {
  const res = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 40 * 1024 * 1024 });
  if (res.status !== 0) {
    console.error(res.stdout);
    console.error(res.stderr);
    process.exit(res.status || 1);
  }
  return res.stdout;
}

function parseJson(stdout) {
  return JSON.parse(stdout.slice(stdout.indexOf('{')));
}

function digState(obj) {
  if (!obj) return null;
  if (obj.phase && obj.player) return obj;
  if (obj.result?.select?.['store:state']) return digState(obj.result.select['store:state']);
  if (obj.result) return digState(obj.result);
  if (obj.select?.['store:state']) return digState(obj.select['store:state']);
  return obj;
}

function step(event) {
  run('npx', ['1gameplay', 'step', record, '--event', JSON.stringify(event)]);
}

function click(sid, x, y, ms = 160) {
  step({ type: 'click', sceneStableUid: sid, data: { x, y, ms } });
}

function key(sid, code, ms = 140) {
  step({ type: 'keypress', sceneStableUid: sid, data: { code, ms } });
}

function keys(sid, codes) {
  for (const c of codes) key(sid, c);
}

console.log('create...');
const created = parseJson(run('npx', ['1gameplay', 'create', '--entry', 'src/game.tsx', '--out', record]));
const sid = created.sceneStableUids[0];

click(sid, 208, 284); // start
click(sid, 200, 400); // intro

// Fairy dialog
key(sid, 'ArrowUp');
for (let i = 0; i < 18; i += 1) click(sid, 208, 320, 140);

// F0 -> stairs (left edge)
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

// F1 spawn (2,1): clear top row monsters + keys, loot left column, open door, explore
keys(sid, [
  // pick key + fight three slimes on row 1
  'ArrowRight',
  'ArrowRight',
  'ArrowRight',
  'ArrowRight',
  'ArrowRight',
  // back to (2,1)
  'ArrowLeft',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowLeft',
  // potion (1,3) + key (1,4)
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowDown',
  // back (2,1)
  'ArrowUp',
  'ArrowUp',
  'ArrowRight',
  'ArrowUp',
  // skeleton (2,4) then yellow door (2,5)
  'ArrowDown',
  'ArrowDown',
  'ArrowDown',
  'ArrowDown',
  'ArrowDown',
  // continue down corridor / explore
  'ArrowDown',
  'ArrowDown',
  'ArrowDown',
  // right toward more loot if path open
  'ArrowRight',
  'ArrowRight',
  'ArrowUp',
  'ArrowUp',
  'ArrowRight',
  'ArrowRight',
  'ArrowDown',
  'ArrowDown',
]);

const gs = digState(
  parseJson(
    run('npx', [
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
    ]),
  ),
);

console.log('final', {
  phase: gs.phase,
  floor: gs.floor,
  x: gs.player.x,
  y: gs.player.y,
  hp: gs.player.hp,
  gold: gs.player.gold,
  exp: gs.player.exp,
  yk: gs.player.yellowKey,
  removed: gs.removed?.length,
  fairy: gs.flags?.fairyIntroDone,
  maxFloor: gs.maxFloorReached,
});

if (gs.floor !== 1) throw new Error(`expected floor 1, got ${gs.floor}`);
if (!gs.flags?.fairyIntroDone) throw new Error('fairy intro missing');
if (gs.maxFloorReached < 1) throw new Error('maxFloor');
if ((gs.removed?.length || 0) < 4) throw new Error(`too little progress removed=${gs.removed?.length}`);

run('npx', [
  '1gameplay',
  'bundle-player-html',
  record,
  '--out',
  htmlOut,
  '--title',
  '魔塔21层 · 第0–1层体验回放',
]);

fs.copyFileSync(htmlOut, '/opt/cursor/artifacts/mota-floor01-replay.html');

// Screenshot final frame for walkthrough
run('npx', [
  '1gameplay',
  'frame',
  'screenshot',
  record,
  '--at',
  'last',
  '--out',
  '/opt/cursor/artifacts/screenshots/mota-floor01-end.png',
  '--scene-stable-uid',
  sid,
  '--width',
  '416',
  '--height',
  '704',
]);

console.log('RECORD OK ->', htmlOut);
