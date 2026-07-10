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

console.log('create...');
const createOut = run('npx', ['1gameplay', 'create', '--entry', 'src/game.tsx', '--out', record]);
const created = parseJson(createOut);
const uid = created.result?.sceneStableUids?.[0] || created.sceneStableUids?.[0];
if (!uid) {
  console.error('create result', createOut);
  throw new Error('missing sceneStableUid');
}
console.log('sceneStableUid', uid);

function stepEvent(event) {
  const out = run('npx', ['1gameplay', 'step', record, '--event', JSON.stringify(event)]);
  return parseJson(out);
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
  return parseJson(out);
}

// Click 开始游戏
stepEvent({ type: 'click', sceneStableUid: uid, data: { x: 208, y: 284, ms: 200 } });
let state = queryState();
let gs = state.result?.selections?.['store:state'] || state.result?.store?.state || state.selections?.['store:state'];
// envelope shapes vary; dig
function digState(obj) {
  if (!obj) return null;
  if (obj.phase && obj.player) return obj;
  if (obj.result?.select?.['store:state']) return digState(obj.result.select['store:state']);
  if (obj.result) return digState(obj.result);
  if (obj.select?.['store:state']) return digState(obj.select['store:state']);
  if (obj.selections) {
    const v = obj.selections['store:state'] || Object.values(obj.selections)[0];
    return digState(v);
  }
  if (obj.state) return digState(obj.state);
  if (obj.payload) return digState(obj.payload);
  if (obj.value) return digState(obj.value);
  return obj;
}
gs = digState(state);
console.log('after start phase', gs?.phase);
if (gs?.phase !== 'intro' && gs?.phase !== 'playing') {
  console.log(JSON.stringify(state, null, 2).slice(0, 2000));
}

// finish intro
stepEvent({ type: 'click', sceneStableUid: uid, data: { x: 200, y: 400, ms: 200 } });
state = queryState();
gs = digState(state);
console.log('after intro', gs?.phase, 'hp', gs?.player?.hp, 'floor', gs?.floor);

if (gs?.phase !== 'playing') throw new Error('expected playing');
if (gs.player.hp !== 1000 || gs.player.atk !== 10 || gs.player.def !== 10) {
  throw new Error(`bad initial stats ${JSON.stringify(gs.player)}`);
}

// move up a few times
for (let i = 0; i < 3; i += 1) {
  stepEvent({ type: 'keypress', sceneStableUid: uid, data: { code: 'ArrowUp', ms: 140 } });
}
state = queryState();
gs = digState(state);
console.log('after moves', { x: gs.player.x, y: gs.player.y, floor: gs.floor, phase: gs.phase });

console.log('SMOKE OK');
