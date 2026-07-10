import type { ImageSource } from '@1game/engine-bundle/runtime/worker';
export type Phase = 'title' | 'select' | 'playing' | 'paused' | 'tally' | 'gameover' | 'cleared';

export type Dir = 0 | 1 | 2 | 3; // up left down right

export type Entity = {
  slot: number;
  isPlayer: boolean;
  alive: boolean;
  x: number; // center
  y: number;
  dir: Dir;
  type: number; // enemy type 0-3
  starLevel: number; // 0 / 0x20 / 0x40 / 0x60
  shieldTimer: number; // ticks (×64 frames)
  armorHits: number; // remaining extra hits (armor starts at 3 → 4 total)
  spawnAnim: number;
  deathTimer: number;
  blinkFrame: number;
  animBit: number;
  powerUpTank: boolean;
  stunTimer: number;
};

export type Bullet = {
  slot: number;
  active: boolean;
  x: number;
  y: number;
  dir: Dir;
  owner: number;
  powered: boolean;
  armor: boolean;
  explodeTimer: number;
};

export type Powerup = {
  x: number;
  y: number;
  type: number;
} | null;

export type InputState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  fire: boolean;
  firePrev: boolean;
  start: boolean;
  startPrev: boolean;
  select: boolean;
  selectPrev: boolean;
};

export type GameState = {
  phase: Phase;
  frame: number;
  tickAccMs: number;
  stageIndex: number; // 0-9
  selectedStage: number;
  titleCursor: number; // 0 = 1P only
  score: number;
  lives: number;
  nextLifeAt: number;
  hiScore: number;
  grid: number[][];
  brickBits: number[][];
  entities: Entity[];
  bullets: Bullet[];
  powerup: Powerup;
  enemiesLeft: number;
  activeEnemyCount: number;
  spawnRot: number;
  spawnDelay: number;
  freezeTimer: number; // ticks ×64
  shovelTimer: number; // ticks ×16
  eagleAlive: boolean;
  eagleExpTimer: number;
  playerRespawnTimer: number;
  killCounts: [number, number, number, number];
  tallyFlash: number;
  grenadeFlash: number;
  input: InputState;
  rngSeed: number;
  stageClearDelay: number;
  gameOverDelay: number;
  assetsReady: boolean;
  mapImage: ImageSource | null;
  mapVersion: number;
};
