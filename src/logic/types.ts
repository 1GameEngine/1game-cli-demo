export type Phase =
  | 'title'
  | 'intro'
  | 'playing'
  | 'dialog'
  | 'shop'
  | 'book'
  | 'teleport'
  | 'save'
  | 'load'
  | 'dead'
  | 'ending';

export type Direction = 'up' | 'down' | 'left' | 'right';

export type PlayerState = {
  x: number;
  y: number;
  hp: number;
  atk: number;
  def: number;
  lv: number;
  exp: number;
  gold: number;
  yellowKey: number;
  blueKey: number;
  redKey: number;
};

export type StoryFlags = {
  fairyIntroDone: boolean;
  fairyCrossDone: boolean;
  hasCross: boolean;
  merchantF2Done: boolean;
  elderF2Done: boolean;
  f2DoorOpen: boolean;
  thiefIntroDone: boolean;
  thiefHammerDone: boolean;
  f18PathOpen: boolean;
  princessTalked: boolean;
  boss16Talked: boolean;
  boss16Defeated: boolean;
  floor16Buffed: boolean;
  boss19Talked: boolean;
  boss19Defeated: boolean;
  boss21Defeated: boolean;
  stair18Shown: boolean;
  stair20Shown: boolean;
  elderF15Done: boolean;
  merchantF15Done: boolean;
};

export type DialogLine = {
  speaker?: string;
  text: string;
};

export type DialogChoice = {
  label: string;
  action: string;
};

export type DialogState = {
  title: string;
  lines: DialogLine[];
  lineIndex: number;
  choices?: DialogChoice[];
  context?: string;
};

export type ShopState = {
  shopId: string;
  title: string;
  text: string;
  options: { label: string; action: string }[];
};

export type ToastState = {
  text: string;
  ttlMs: number;
};

export type AnimState = {
  phase: 'idle' | 'moving';
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  elapsedMs: number;
  durationMs: number;
};

export type SaveSlot = {
  desc: string;
  snapshot: string | null;
};

export type GameSnapshot = {
  floor: number;
  maxFloorReached: number;
  player: PlayerState;
  flags: StoryFlags;
  removed: string[];
  inventory: InventoryState;
};

export type InventoryState = {
  hasBook: boolean;
  hasTeleporter: boolean;
};

export type GameState = {
  phase: Phase;
  floor: number;
  maxFloorReached: number;
  player: PlayerState;
  flags: StoryFlags;
  removed: Record<string, true>;
  inventory: InventoryState;
  dialog: DialogState | null;
  shop: ShopState | null;
  toast: ToastState | null;
  anim: AnimState;
  saves: SaveSlot[];
  inputLock: boolean;
  facing: Direction;
};

export const MOVE_MS = 90;
export const CELL = 32;
export const MAP_COLS = 13;
export const MAP_ROWS = 14;
export const HUD_H = 108;
export const PAD_H = 148;
export const SCENE_W = MAP_COLS * CELL;
export const SCENE_H = HUD_H + MAP_ROWS * CELL + PAD_H;
export const MAP_Y = HUD_H;
