export const TILE_BLOCKING = new Set([
  'wall',
  'wallAlt',
  'wall1',
  'wall4',
  'lava',
  'water',
  'waterLight',
  'star',
  'storyDoor',
  'yellowDoor',
  'blueDoor',
  'redDoor',
  'greenDoor',
  'ironFence',
]);

export const TILE_LABEL: Record<string, string> = {
  wall: '墙',
  wallAlt: '墙',
  wall1: '墙',
  wall4: '墙',
  lava: '岩浆',
  water: '水',
  waterLight: '水',
  star: '★',
  storyDoor: '门',
  yellowDoor: '黄门',
  blueDoor: '蓝门',
  redDoor: '红门',
  greenDoor: '绿门',
  ironFence: '栅',
  stairUp: '上',
  stairDown: '下',
  floor: '·',
};

export const TILE_COLOR: Record<string, string> = {
  wall: '#4b5563',
  wallAlt: '#374151',
  wall1: '#6b7280',
  wall4: '#4b5563',
  lava: '#ea580c',
  water: '#1d4ed8',
  waterLight: '#3b82f6',
  star: '#fbbf24',
  storyDoor: '#7c3aed',
  yellowDoor: '#ca8a04',
  blueDoor: '#2563eb',
  redDoor: '#dc2626',
  greenDoor: '#16a34a',
  ironFence: '#94a3b8',
  stairUp: '#a78bfa',
  stairDown: '#818cf8',
};

export const ITEM_COLOR: Record<string, string> = {
  yellowKey: '#facc15',
  blueKey: '#60a5fa',
  redKey: '#f87171',
  keyBox: '#f59e0b',
  redPotion: '#ef4444',
  bluePotion: '#3b82f6',
  redGem: '#dc2626',
  blueGem: '#2563eb',
  ironSword: '#94a3b8',
  silverSword: '#e2e8f0',
  steelSword: '#22d3ee',
  holySword: '#fde68a',
  starSword: '#fbbf24',
  ironShield: '#94a3b8',
  silverShield: '#e2e8f0',
  knightShield: '#38bdf8',
  holyShield: '#fde68a',
  divineShield: '#f59e0b',
  smallWing: '#86efac',
  bigWing: '#4ade80',
  coinBag: '#fbbf24',
  monsterBook: '#c084fc',
  floorTeleporter: '#67e8f9',
  cross: '#f87171',
  holyWater: '#a5f3fc',
};

export const MONSTER_COLOR = '#f97316';
export const NPC_COLOR = '#34d399';
export const PLAYER_COLOR = '#38bdf8';
export const FLOOR_BG = '#1e293b';
export const FLOOR_GRID = '#334155';
