import {
  ENEMIES_PER_STAGE,
  INITIAL_LIVES,
  LIFE_BONUS_SCORE,
  MAX_ACTIVE_ENEMIES,
  P1_SPAWN,
} from '../data/constants';
import { spawnDelayBase } from '../data/enemies';
import { cloneLevelMap } from './tiles';
import type { Bullet, Entity, GameState, InputState } from '../state/types';

const INITIAL_SEED = 19850909;

function emptyInput(): InputState {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
    firePrev: false,
    start: false,
    startPrev: false,
    select: false,
    selectPrev: false,
  };
}

function makeEntity(slot: number, isPlayer: boolean): Entity {
  return {
    slot,
    isPlayer,
    alive: false,
    x: 0,
    y: 0,
    dir: isPlayer ? 0 : 2,
    type: 0,
    starLevel: 0,
    shieldTimer: 0,
    armorHits: 0,
    spawnAnim: 0,
    deathTimer: 0,
    blinkFrame: 0,
    animBit: 0,
    powerUpTank: false,
    stunTimer: 0,
  };
}

function makeBullet(slot: number): Bullet {
  return {
    slot,
    active: false,
    x: 0,
    y: 0,
    dir: 0,
    owner: 0,
    powered: false,
    armor: false,
    explodeTimer: 0,
  };
}

export function makeTitleState(hiScore = 0, seed = INITIAL_SEED): GameState {
  return {
    phase: 'title',
    frame: 0,
    tickAccMs: 0,
    stageIndex: 0,
    selectedStage: 0,
    titleCursor: 0,
    score: 0,
    lives: INITIAL_LIVES,
    nextLifeAt: LIFE_BONUS_SCORE,
    hiScore,
    grid: Array.from({ length: 13 }, () => Array(13).fill(13)),
    brickBits: Array.from({ length: 13 }, () => Array(13).fill(0)),
    entities: Array.from({ length: 8 }, (_, i) => makeEntity(i, i === 0)),
    bullets: Array.from({ length: 10 }, (_, i) => makeBullet(i)),
    powerup: null,
    enemiesLeft: ENEMIES_PER_STAGE,
    activeEnemyCount: 0,
    spawnRot: 0,
    spawnDelay: 0,
    freezeTimer: 0,
    shovelTimer: 0,
    eagleAlive: true,
    eagleExpTimer: 0,
    playerRespawnTimer: 0,
    killCounts: [0, 0, 0, 0],
    tallyFlash: 0,
    grenadeFlash: 0,
    input: emptyInput(),
    rngSeed: seed,
    stageClearDelay: 0,
    gameOverDelay: 0,
    assetsReady: false,
    mapImage: null,
    mapVersion: 0,
  };
}

export function spawnPlayer(draft: GameState): void {
  const e = draft.entities[0];
  e.x = P1_SPAWN.x;
  e.y = P1_SPAWN.y;
  e.dir = 0;
  e.alive = true;
  e.spawnAnim = 30;
  e.shieldTimer = 3;
  e.starLevel = 0;
  e.stunTimer = 0;
  e.deathTimer = 0;
  e.blinkFrame = 0;
}

export function beginStage(draft: GameState, stageIndex: number, keepScore = true): void {
  const score = keepScore ? draft.score : 0;
  const lives = keepScore ? draft.lives : INITIAL_LIVES;
  const nextLifeAt = keepScore ? draft.nextLifeAt : LIFE_BONUS_SCORE;
  const hi = Math.max(draft.hiScore, draft.score);
  const seed = draft.rngSeed;

  const { grid, brickBits } = cloneLevelMap(stageIndex);

  draft.phase = 'playing';
  draft.frame = 0;
  draft.tickAccMs = 0;
  draft.stageIndex = stageIndex;
  draft.selectedStage = stageIndex;
  draft.score = score;
  draft.lives = lives;
  draft.nextLifeAt = nextLifeAt;
  draft.hiScore = hi;
  draft.grid = grid;
  draft.brickBits = brickBits;
  draft.entities = Array.from({ length: 8 }, (_, i) => makeEntity(i, i === 0));
  draft.bullets = Array.from({ length: 10 }, (_, i) => makeBullet(i));
  draft.powerup = null;
  draft.enemiesLeft = ENEMIES_PER_STAGE;
  draft.activeEnemyCount = 0;
  draft.spawnRot = 0;
  draft.spawnDelay = 0;
  draft.freezeTimer = 0;
  draft.shovelTimer = 0;
  draft.eagleAlive = true;
  draft.eagleExpTimer = 0;
  draft.playerRespawnTimer = 0;
  draft.killCounts = [0, 0, 0, 0];
  draft.tallyFlash = 0;
  draft.grenadeFlash = 0;
  draft.rngSeed = seed;
  draft.stageClearDelay = 0;
  draft.gameOverDelay = 0;
  draft.mapImage = null;
  draft.mapVersion += 1;
  draft.spawnDelay = Math.max(10, spawnDelayBase(stageIndex) >> 2);

  spawnPlayer(draft);
  void MAX_ACTIVE_ENEMIES;
}

export function assignState(draft: GameState, next: GameState): void {
  Object.assign(draft, next);
  draft.grid = next.grid.map((r) => r.slice());
  draft.brickBits = next.brickBits.map((r) => r.slice());
  draft.entities = next.entities.map((e) => ({ ...e }));
  draft.bullets = next.bullets.map((b) => ({ ...b }));
  draft.powerup = next.powerup ? { ...next.powerup } : null;
  draft.killCounts = [...next.killCounts] as [number, number, number, number];
  draft.input = { ...next.input };
}
