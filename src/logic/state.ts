import type { GameState, PlayerState, StoryFlags, InventoryState, SaveSlot } from './types';

export function makePlayer(): PlayerState {
  return {
    x: 6,
    y: 10,
    hp: 1000,
    atk: 10,
    def: 10,
    lv: 1,
    exp: 0,
    gold: 0,
    yellowKey: 0,
    blueKey: 0,
    redKey: 0,
  };
}

export function makeFlags(): StoryFlags {
  return {
    fairyIntroDone: false,
    fairyCrossDone: false,
    hasCross: false,
    merchantF2Done: false,
    elderF2Done: false,
    f2DoorOpen: false,
    thiefIntroDone: false,
    thiefHammerDone: false,
    f18PathOpen: false,
    princessTalked: false,
    boss16Talked: false,
    boss16Defeated: false,
    floor16Buffed: false,
    boss19Talked: false,
    boss19Defeated: false,
    boss21Defeated: false,
    stair18Shown: false,
    stair20Shown: false,
    elderF15Done: false,
    merchantF15Done: false,
  };
}

export function makeInventory(): InventoryState {
  return { hasBook: false, hasTeleporter: false };
}

export function makeSaves(): SaveSlot[] {
  return [
    { desc: '空', snapshot: null },
    { desc: '空', snapshot: null },
    { desc: '空', snapshot: null },
  ];
}

export function makeInitialState(): GameState {
  return {
    phase: 'title',
    floor: 0,
    maxFloorReached: 0,
    player: makePlayer(),
    flags: makeFlags(),
    removed: {},
    inventory: makeInventory(),
    dialog: null,
    shop: null,
    toast: null,
    anim: {
      phase: 'idle',
      fromX: 6,
      fromY: 10,
      toX: 6,
      toY: 10,
      elapsedMs: 0,
      durationMs: 90,
    },
    saves: makeSaves(),
    inputLock: false,
    facing: 'down',
  };
}

export function applyLevelBonus(player: PlayerState, levels: number): void {
  player.lv += levels;
  player.hp += 1000 * levels;
  player.atk += 10 * levels;
  player.def += 10 * levels;
}
