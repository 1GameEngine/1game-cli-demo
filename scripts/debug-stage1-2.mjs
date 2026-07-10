#!/usr/bin/env node
/**
 * Debug Stage 1 & 2: create records, drive gameplay, assert key state, export replays.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outDir = resolve(root, 'out');
const artDir = '/opt/cursor/artifacts';

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { encoding: 'utf8', cwd: root, ...opts });
  if (res.status !== 0) {
    console.error(res.stdout);
    console.error(res.stderr);
    throw new Error(`${cmd} ${args.join(' ')} failed: ${res.status}`);
  }
  return res.stdout;
}

function npx(args) {
  return run('npx', args, { maxBuffer: 20 * 1024 * 1024 });
}

function create(record) {
  const raw = npx(['1gameplay', 'create', '--entry', 'src/game.tsx', '--out', record]);
  const line = raw.trim().split('\n').filter(Boolean).at(-1);
  return JSON.parse(line);
}

function step(record, extraArgs) {
  npx(['1gameplay', 'step', record, ...extraArgs]);
}

function queryState(record) {
  const raw = npx([
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
  const j = JSON.parse(raw);
  return j.result.select['store:state'];
}

function hold(record, scene, code, frames) {
  step(record, ['--event', JSON.stringify({ type: 'keydown', sceneStableUid: scene, data: { code } })]);
  step(record, ['--ms', '16', '--repeat', String(frames)]);
  step(record, ['--event', JSON.stringify({ type: 'keyup', sceneStableUid: scene, data: { code } })]);
}

function startStage(record, scene, stageIndex) {
  // title -> select
  step(record, ['--event', JSON.stringify({ type: 'keypress', sceneStableUid: scene, data: { code: 'Enter', ms: 50 } })]);
  let s = queryState(record);
  if (s.phase !== 'select') throw new Error(`expected select, got ${s.phase}`);

  // bump stage with fire
  for (let i = 0; i < stageIndex; i += 1) {
    step(record, ['--event', JSON.stringify({ type: 'keypress', sceneStableUid: scene, data: { code: 'Space', ms: 40 } })]);
  }
  s = queryState(record);
  if (s.selectedStage !== stageIndex) {
    throw new Error(`selectedStage want ${stageIndex} got ${s.selectedStage}`);
  }

  step(record, ['--event', JSON.stringify({ type: 'keypress', sceneStableUid: scene, data: { code: 'Enter', ms: 50 } })]);
  s = queryState(record);
  if (s.phase !== 'playing') throw new Error(`expected playing, got ${s.phase}`);
  if (s.stageIndex !== stageIndex) throw new Error(`stageIndex want ${stageIndex} got ${s.stageIndex}`);
  return s;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function debugStage(stageIndex) {
  const record = resolve(outDir, `stage${stageIndex + 1}-debug.1gamerecord`);
  const replay = resolve(outDir, `stage${stageIndex + 1}-replay.html`);
  const shot = resolve(artDir, `stage${stageIndex + 1}-svg-play.png`);

  console.log(`\n=== Stage ${stageIndex + 1} ===`);
  if (existsSync(record)) run('rm', ['-f', record]);

  const created = create(record);
  const scene = created.sceneStableUids[0];
  console.log('scene', scene);

  let s = startStage(record, scene, stageIndex);
  assert(s.enemiesLeft === 20, `enemiesLeft ${s.enemiesLeft}`);
  assert(s.eagleAlive === true, 'eagle should be alive');
  assert(s.entities[0].alive === true, 'player alive');
  assert(s.grid.length === 13 && s.grid[0].length === 13, 'map 13x13');

  const bricks = s.grid.flat().filter((t) => t === 4 || t <= 3).length;
  assert(bricks > 0, 'should have bricks');
  console.log('bricks/partial', bricks, 'player', s.entities[0].x, s.entities[0].y);

  // wait spawn anim + first enemy
  step(record, ['--ms', '16', '--repeat', '90']);
  s = queryState(record);
  assert(s.activeEnemyCount >= 1, `expected enemy spawn, active=${s.activeEnemyCount}`);
  assert(s.enemiesLeft <= 19, `enemiesLeft after spawn ${s.enemiesLeft}`);
  console.log('spawned', s.activeEnemyCount, 'left', s.enemiesLeft);

  // move left then up a bit (keydown hold)
  hold(record, scene, 'ArrowLeft', 35);
  hold(record, scene, 'ArrowUp', 40);
  s = queryState(record);
  const p = s.entities[0];
  console.log('after move', p.x, p.y, 'dir', p.dir);
  assert(p.x !== 88 || p.y !== 216, 'player should have moved from spawn');

  // fire several shots
  for (let i = 0; i < 8; i += 1) {
    hold(record, scene, 'Space', 3);
    step(record, ['--ms', '16', '--repeat', '18']);
  }
  s = queryState(record);
  const bullets = s.bullets.filter((b) => b.active || b.explodeTimer > 0);
  console.log('bullets seen', bullets.length, 'score', s.score, 'frame', s.frame);
  assert(s.frame > 100, 'should have advanced frames');

  // Stage2 specific: forest tiles exist
  if (stageIndex === 1) {
    const forest = s.grid.flat().filter((t) => t === 11).length;
    assert(forest > 0, 'stage2 should have forest');
    console.log('forest tiles', forest);
  }

  // screenshot + replay
  npx([
    '1gameplay',
    'frame',
    'screenshot',
    record,
    '--at',
    'last',
    '--out',
    shot,
    '--width',
    '512',
    '--height',
    '624',
  ]);
  npx(['1gameplay', 'bundle-player-html', record, '--out', replay, '--title', `Battle City Stage ${stageIndex + 1}`]);

  // copy replay to artifacts for user
  const artReplay = resolve(artDir, `stage${stageIndex + 1}-replay.html`);
  writeFileSync(artReplay, readFileSync(replay));

  const summary = {
    stage: stageIndex + 1,
    phase: s.phase,
    frame: s.frame,
    score: s.score,
    enemiesLeft: s.enemiesLeft,
    activeEnemyCount: s.activeEnemyCount,
    player: { x: p.x, y: p.y, dir: p.dir },
    eagleAlive: s.eagleAlive,
    record,
    replay: artReplay,
    screenshot: shot,
  };
  console.log('OK', JSON.stringify(summary, null, 2));
  return summary;
}

mkdirSync(outDir, { recursive: true });
mkdirSync(artDir, { recursive: true });

const results = [debugStage(0), debugStage(1)];
writeFileSync(resolve(artDir, 'stage1-2-debug-summary.json'), JSON.stringify(results, null, 2));
console.log('\nAll stage 1-2 checks passed.');
