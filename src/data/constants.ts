/** Shared constants aligned with Famicom Battle City ROM timings. */

export const NES_W = 256;
export const NES_H = 240;
export const TOUCH_H = 72;
export const SCENE_W = NES_W;
export const SCENE_H = NES_H + TOUCH_H;

export const FX = 16;
export const FY = 16;
export const META = 16;
export const GW = 13;
export const GH = 13;
export const FIELD_W = GW * META;
export const FIELD_H = GH * META;

export const TICK_MS = 1000 / 60;
export const MAX_STAGES = 10;
export const ENEMIES_PER_STAGE = 20;
export const MAX_ACTIVE_ENEMIES = 4;

export const P1_SPAWN = { x: 0x58, y: 0xd8 };
export const EAGLE = { x: 0x78, y: 0xd8 };
export const EN_SPAWN_X = [0x18, 0x78, 0xd8];
export const EN_SPAWN_Y = 0x18;

/** Direction: 0=up 1=left 2=down 3=right */
export const DX = [0, -1, 0, 1] as const;
export const DY = [-1, 0, 1, 0] as const;

export const Tile = {
  PB0: 0,
  PB1: 1,
  PB2: 2,
  PB3: 3,
  BRICK: 4,
  PS0: 5,
  PS1: 6,
  PS2: 7,
  PS3: 8,
  STEEL: 9,
  WATER: 10,
  FOREST: 11,
  ICE: 12,
  EMPTY: 13,
} as const;

export type TileId = (typeof Tile)[keyof typeof Tile];

export const EnemyType = {
  BASIC: 0,
  FAST: 1,
  POWER: 2,
  ARMOR: 3,
} as const;

export const ENEMY_SCORE = [100, 200, 300, 400] as const;

export const PowerupType = {
  HELMET: 0,
  CLOCK: 1,
  SHOVEL: 2,
  STAR: 3,
  GRENADE: 4,
  TANK: 5,
} as const;

/** ROM PowerupTypeTable weights */
export const POWERUP_WEIGHTS = [0, 1, 2, 3, 4, 5, 4, 3] as const;

export const INITIAL_LIVES = 3;
export const LIFE_BONUS_SCORE = 20000;
export const POWERUP_SCORE = 500;

/** Player move: 1px every other frame ≈ ROM basic speed */
export const PLAYER_MOVE_PERIOD = 1;
export const BASIC_ENEMY_MOVE_PERIOD = 2;
export const FAST_ENEMY_MOVE_PERIOD = 1;

export const BULLET_SPEED_NORMAL = 3;
export const BULLET_SPEED_FAST = 4;

export const SPAWN_ANIM_FRAMES = 30;
export const SHIELD_TICKS_ON_SPAWN = 3; // ×64 frames
export const FREEZE_FRAMES = 600; // ~10s
export const SHOVEL_FRAMES = 1200; // ~20s
export const STUN_FRAMES = 90;

export const COLORS = {
  bg: '#000000',
  field: '#000000',
  hud: '#636363',
  brick: '#c84c0c',
  brickDark: '#7c2800',
  steel: '#b8b8b8',
  steelDark: '#787878',
  water: '#2038ec',
  waterLight: '#3cbcfc',
  forest: '#00a800',
  forestDark: '#007800',
  ice: '#f8f8f8',
  player: '#e8c820',
  playerDark: '#a88800',
  enemy: '#d0d0d0',
  enemyFast: '#fc9838',
  enemyPower: '#80d010',
  armor4: '#00b800',
  armor3: '#fc9838',
  armor2: '#c8a000',
  armor1: '#f8f8f8',
  eagle: '#c84c0c',
  powerup: '#f8f800',
  text: '#fcfcfc',
  title: '#fc9838',
} as const;
