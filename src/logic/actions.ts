import { FLOORS, type FloorEntity } from '../data/floors';
import { MONSTERS, type MonsterDef } from '../data/monsters';
import { ITEMS } from '../data/items';
import { SHOPS } from '../data/shops';
import {
  FAIRY_INTRO,
  FAIRY_CROSS,
  MERCHANT_F2,
  ELDER_F2,
  THIEF_INTRO,
  THIEF_HAMMER,
  BOSS16_TALK,
  BOSS19_TALK,
  BOSS19_DEATH,
  BOSS21_DEATH,
  PRINCESS_TALK,
  CROSS_HINT_F7,
  CROSS_HINT_F12,
  INTRO_TEXT,
  ENDING_TEXT,
} from '../data/dialogs';
import { TILE_BLOCKING } from '../data/labels';
import { previewCombat } from './combat';
import { applyLevelBonus, makeInitialState } from './state';
import type { Direction, GameState, DialogLine, GameSnapshot } from './types';
import { MAP_COLS, MAP_ROWS, MOVE_MS } from './types';

function dirDelta(dir: Direction): { dx: number; dy: number } {
  if (dir === 'up') return { dx: 0, dy: -1 };
  if (dir === 'down') return { dx: 0, dy: 1 };
  if (dir === 'left') return { dx: -1, dy: 0 };
  return { dx: 1, dy: 0 };
}

export function getFloorEntities(draft: GameState): FloorEntity[] {
  const floor = FLOORS[draft.floor];
  if (!floor) return [];
  return floor.entities.filter((e) => {
    if (draft.removed.includes(e.uid)) return false;
    if (e.special === 'f2StoryDoor' && draft.flags.f2DoorOpen) return false;
    if (e.special === 'princessPath' && draft.flags.f18PathOpen) return false;
    if (e.special === 'hiddenStair18') return draft.flags.stair18Shown;
    if (e.special === 'hiddenStair20') return draft.flags.stair20Shown;
    if (e.hidden) return false;
    return true;
  });
}

function entityAt(draft: GameState, x: number, y: number): FloorEntity | undefined {
  return getFloorEntities(draft).find((e) => e.x === x && e.y === y);
}

function showToast(draft: GameState, text: string): void {
  draft.toastText = text;
  draft.toastTtlMs = 1200;
}

function openDialog(draft: GameState, title: string, lines: DialogLine[], context?: string, choices?: { label: string; action: string }[]): void {
  draft.phase = 'dialog';
  draft.dialog = { title, lines, lineIndex: 0, context, choices };
  draft.inputLock = true;
}

function openShop(draft: GameState, shopId: string): void {
  const shop = SHOPS[shopId];
  if (!shop) return;
  draft.phase = 'shop';
  draft.shop = {
    shopId: shop.id,
    title: shop.title,
    text: shop.text,
    options: shop.options.map((o) => ({ ...o })),
  };
  draft.inputLock = true;
}

function resolveMonster(draft: GameState, ent: FloorEntity): MonsterDef {
  const base = MONSTERS[ent.id];
  if (!base) {
    return {
      id: ent.id,
      name: ent.id,
      hp: 1,
      atk: 0,
      def: 0,
      gold: 0,
      exp: 0,
      magicAtk: 0,
      preDamage: 0,
      lifeSteal: 0,
      imageId: null,
      imageCutArea: null,
    };
  }
  let m: MonsterDef = { ...base };
  if (ent.statOverride) {
    m = { ...m, ...ent.statOverride };
  }
  if (draft.floor === 16 && draft.flags.floor16Buffed && ent.id !== 'redBoss') {
    m = {
      ...m,
      hp: m.hp + Math.floor(m.hp / 3),
      atk: m.atk + Math.floor(m.atk / 3),
      def: m.def + Math.floor(m.def / 3),
      gold: m.gold + Math.floor(m.gold / 3),
      exp: m.exp + Math.floor(m.exp / 3),
    };
  }
  return m;
}

function removeEntity(draft: GameState, uid: string): void {
  if (!draft.removed.includes(uid)) draft.removed.push(uid);
}

function pickupItem(draft: GameState, itemId: string, ent: FloorEntity): void {
  const item = ITEMS[itemId];
  if (!item) {
    removeEntity(draft, ent.uid);
    return;
  }

  if (item.special === 'monsterBook') {
    draft.inventory.hasBook = true;
    showToast(draft, '获得圣光徽：可查看怪物属性');
    removeEntity(draft, ent.uid);
    return;
  }
  if (item.special === 'floorTeleporter') {
    draft.inventory.hasTeleporter = true;
    showToast(draft, '获得楼层传送器');
    removeEntity(draft, ent.uid);
    return;
  }
  if (item.special === 'cross') {
    draft.flags.hasCross = true;
    if (draft.floor === 7) showToast(draft, CROSS_HINT_F7);
    else if (draft.floor === 12) showToast(draft, CROSS_HINT_F12);
    else showToast(draft, '获得十字架');
    removeEntity(draft, ent.uid);
    return;
  }
  if (item.special === 'doubleHp') {
    const gain = draft.player.hp;
    draft.player.hp += gain;
    showToast(draft, `圣水：生命 +${gain}`);
    removeEntity(draft, ent.uid);
    return;
  }

  const p = draft.player;
  if (item.hp) p.hp += item.hp;
  if (item.atk) p.atk += item.atk;
  if (item.def) p.def += item.def;
  if (item.gold) p.gold += item.gold;
  if (item.exp) p.exp += item.exp;
  if (item.level) applyLevelBonus(p, item.level);
  if (item.yellowKey) p.yellowKey += item.yellowKey;
  if (item.blueKey) p.blueKey += item.blueKey;
  if (item.redKey) p.redKey += item.redKey;
  const parts: string[] = [];
  if (item.hp) parts.push(`生命+${item.hp}`);
  if (item.atk) parts.push(`攻击+${item.atk}`);
  if (item.def) parts.push(`防御+${item.def}`);
  if (item.gold) parts.push(`金币+${item.gold}`);
  if (item.exp) parts.push(`经验+${item.exp}`);
  if (item.level) parts.push(`等级+${item.level}`);
  if (item.yellowKey) parts.push(`黄钥匙+${item.yellowKey}`);
  if (item.blueKey) parts.push(`蓝钥匙+${item.blueKey}`);
  if (item.redKey) parts.push(`红钥匙+${item.redKey}`);
  showToast(draft, parts.length ? `获得${item.name}：${parts.join(' ')}` : `获得${item.name}`);
  removeEntity(draft, ent.uid);
}

function fightMonster(draft: GameState, ent: FloorEntity): boolean {
  const monster = resolveMonster(draft, ent);
  const preview = previewCombat(draft.player, monster);
  if (!preview.canFight) {
    showToast(draft, '你打不过此怪物！');
    return false;
  }
  draft.player.hp -= preview.damage;
  draft.player.gold += monster.gold;
  draft.player.exp += monster.exp;
  showToast(draft, `战斗胜利：金币+${monster.gold} 经验+${monster.exp}`);
  removeEntity(draft, ent.uid);

  if (ent.special === 'f16Boss' || (draft.floor === 16 && ent.id === 'redBoss')) {
    draft.flags.boss16Defeated = true;
    draft.flags.floor16Buffed = true;
    showToast(draft, '魔王败退！本层剩余怪物强化了！');
  }
  if (ent.special === 'f19Boss' || (draft.floor === 19 && ent.id === 'finalBoss')) {
    draft.flags.boss19Defeated = true;
    openDialog(draft, '冥灵魔王', BOSS19_DEATH, 'boss19death');
  }
  if (ent.special === 'f21Boss' || (draft.floor === 21 && ent.id === 'finalBoss')) {
    draft.flags.boss21Defeated = true;
    openDialog(draft, '冥灵魔王', BOSS21_DEATH, 'boss21death');
  }

  if (draft.player.hp <= 0) {
    draft.player.hp = 0;
    draft.phase = 'dead';
    draft.inputLock = true;
  }
  return true;
}

function tryDoor(draft: GameState, ent: FloorEntity): boolean {
  const p = draft.player;
  if (ent.id === 'yellowDoor') {
    if (p.yellowKey < 1) {
      showToast(draft, '黄钥匙不够');
      return false;
    }
    p.yellowKey -= 1;
    removeEntity(draft, ent.uid);
    showToast(draft, '黄钥匙 -1');
    return true;
  }
  if (ent.id === 'blueDoor') {
    if (p.blueKey < 1) {
      showToast(draft, '蓝钥匙不够');
      return false;
    }
    p.blueKey -= 1;
    removeEntity(draft, ent.uid);
    showToast(draft, '蓝钥匙 -1');
    return true;
  }
  if (ent.id === 'redDoor') {
    if (p.redKey < 1) {
      showToast(draft, '红钥匙不够');
      return false;
    }
    p.redKey -= 1;
    removeEntity(draft, ent.uid);
    showToast(draft, '红钥匙 -1');
    return true;
  }
  if (ent.id === 'ironFence') {
    removeEntity(draft, ent.uid);
    return true;
  }
  if (ent.id === 'storyDoor') {
    if (ent.special === 'f2StoryDoor' && !draft.flags.f2DoorOpen) {
      showToast(draft, '门打不开');
      return false;
    }
    if (ent.special === 'f21StoryDoor') {
      showToast(draft, '门打不开');
      return false;
    }
    showToast(draft, '门打不开');
    return false;
  }
  return false;
}

function changeFloor(draft: GameState, nextFloor: number, via: 'up' | 'down'): void {
  if (nextFloor < 0 || nextFloor > 21) return;
  draft.floor = nextFloor;
  draft.maxFloorReached = Math.max(draft.maxFloorReached, nextFloor);
  const floor = FLOORS[nextFloor];
  const spawn = via === 'up' ? floor.spawnDown : floor.spawnUp;
  if (spawn) {
    draft.player.x = spawn.x;
    draft.player.y = spawn.y;
  }
  draft.anim.phase = 'idle';
  draft.anim.fromX = draft.player.x;
  draft.anim.fromY = draft.player.y;
  draft.anim.toX = draft.player.x;
  draft.anim.toY = draft.player.y;
}

function interactNpc(draft: GameState, ent: FloorEntity): void {
  switch (ent.id) {
    case 'fairy':
      if (!draft.flags.fairyIntroDone) {
        draft.flags.fairyIntroDone = true;
        openDialog(draft, '仙子', FAIRY_INTRO, 'fairyIntro');
      } else if (draft.flags.hasCross && !draft.flags.fairyCrossDone) {
        draft.flags.fairyCrossDone = true;
        draft.flags.hasCross = false;
        const p = draft.player;
        const hpGain = Math.floor(p.hp / 3);
        const atkGain = Math.floor(p.atk / 3);
        const defGain = Math.floor(p.def / 3);
        p.hp += hpGain;
        p.atk += atkGain;
        p.def += defGain;
        openDialog(draft, '仙子', FAIRY_CROSS, 'fairyCross');
      } else {
        showToast(draft, '加油，勇士！');
      }
      break;
    case 'merchantF2':
      if (!draft.flags.merchantF2Done) {
        draft.flags.merchantF2Done = true;
        draft.player.def += 20;
        openDialog(draft, '商人', MERCHANT_F2, 'merchantF2');
      } else showToast(draft, '谢谢你救了我！');
      break;
    case 'elderF2':
      if (!draft.flags.elderF2Done) {
        draft.flags.elderF2Done = true;
        draft.player.atk += 70;
        openDialog(draft, '老人', ELDER_F2, 'elderF2');
      } else showToast(draft, '去救公主吧！');
      break;
    case 'thief':
      if (!draft.flags.thiefIntroDone) {
        draft.flags.thiefIntroDone = true;
        draft.flags.f2DoorOpen = true;
        openDialog(draft, '小偷杰克', THIEF_INTRO, 'thiefIntro');
      } else if (draft.flags.hasCross && !draft.flags.thiefHammerDone) {
        draft.flags.thiefHammerDone = true;
        draft.flags.hasCross = false;
        draft.flags.f18PathOpen = true;
        openDialog(draft, '小偷杰克', THIEF_HAMMER, 'thiefHammer');
      } else showToast(draft, '有事再来找我！');
      break;
    case 'princess':
      if (!draft.flags.princessTalked) {
        draft.flags.princessTalked = true;
        draft.flags.stair18Shown = true;
        draft.flags.stair20Shown = true;
        openDialog(draft, '公主', PRINCESS_TALK, 'princess');
      } else showToast(draft, '请一定要杀死大魔王！');
      break;
    case 'goldShopF3':
    case 'goldShopF11':
    case 'keyShopF5':
    case 'keyShopF12':
    case 'expElderF5':
    case 'expElderF13':
      openShop(draft, ent.id);
      break;
    case 'elderF15':
      if (draft.flags.elderF15Done) {
        showToast(draft, '剑已经给你了');
        return;
      }
      openDialog(draft, '老人', [{ speaker: '老人', text: SHOPS.elderF15.text }], 'elderF15pre', SHOPS.elderF15.options);
      break;
    case 'merchantF15':
      if (draft.flags.merchantF15Done) {
        showToast(draft, '盾已经卖给你了');
        return;
      }
      openDialog(draft, '商人', [{ speaker: '商人', text: SHOPS.merchantF15.text }], 'merchantF15pre', SHOPS.merchantF15.options);
      break;
    default:
      showToast(draft, ent.id);
  }
}

function interactTrigger(draft: GameState, ent: FloorEntity): boolean {
  if (ent.id === 'bossTalk16') {
    if (!draft.flags.boss16Talked) {
      draft.flags.boss16Talked = true;
      openDialog(draft, '红衣魔王', BOSS16_TALK, 'boss16');
      removeEntity(draft, ent.uid);
      return false;
    }
    removeEntity(draft, ent.uid);
    return true;
  }
  if (ent.id === 'bossTalk19') {
    if (!draft.flags.boss19Talked) {
      draft.flags.boss19Talked = true;
      openDialog(draft, '冥灵魔王', BOSS19_TALK, 'boss19');
      removeEntity(draft, ent.uid);
      return false;
    }
    removeEntity(draft, ent.uid);
    return true;
  }
  return true;
}

function beginMoveAnim(draft: GameState, nx: number, ny: number): void {
  draft.anim.phase = 'moving';
  draft.anim.fromX = draft.player.x;
  draft.anim.fromY = draft.player.y;
  draft.anim.toX = nx;
  draft.anim.toY = ny;
  draft.anim.elapsedMs = 0;
  draft.anim.durationMs = MOVE_MS;
  draft.player.x = nx;
  draft.player.y = ny;
}

export function tryMove(draft: GameState, dir: Direction): void {
  if (draft.phase !== 'playing') return;
  if (draft.inputLock) return;

  // Allow buffered input: snap any in-progress move animation first.
  if (draft.anim.phase === 'moving') {
    draft.anim.phase = 'idle';
    draft.anim.elapsedMs = 0;
    draft.anim.fromX = draft.player.x;
    draft.anim.fromY = draft.player.y;
    draft.anim.toX = draft.player.x;
    draft.anim.toY = draft.player.y;
  }

  draft.facing = dir;
  const { dx, dy } = dirDelta(dir);
  const nx = draft.player.x + dx;
  const ny = draft.player.y + dy;
  if (nx < 0 || ny < 0 || nx >= MAP_COLS || ny >= MAP_ROWS) return;

  const ent = entityAt(draft, nx, ny);
  if (!ent) {
    beginMoveAnim(draft, nx, ny);
    return;
  }

  if (ent.type === 'tile') {
    if (ent.id === 'stairUp') {
      beginMoveAnim(draft, nx, ny);
      changeFloor(draft, draft.floor + 1, 'up');
      return;
    }
    if (ent.id === 'stairDown') {
      beginMoveAnim(draft, nx, ny);
      changeFloor(draft, draft.floor - 1, 'down');
      return;
    }
    if (TILE_BLOCKING.has(ent.id)) {
      if (['yellowDoor', 'blueDoor', 'redDoor', 'ironFence', 'storyDoor'].includes(ent.id)) {
        if (tryDoor(draft, ent)) beginMoveAnim(draft, nx, ny);
        return;
      }
      return;
    }
  }

  if (ent.type === 'monster') {
    if (fightMonster(draft, ent)) beginMoveAnim(draft, nx, ny);
    return;
  }

  if (ent.type === 'item') {
    pickupItem(draft, ent.id, ent);
    beginMoveAnim(draft, nx, ny);
    return;
  }

  if (ent.type === 'npc') {
    interactNpc(draft, ent);
    return;
  }

  if (ent.type === 'trigger') {
    if (interactTrigger(draft, ent)) beginMoveAnim(draft, nx, ny);
  }
}

export function advanceDialog(draft: GameState): void {
  if (!draft.dialog) return;
  if (draft.dialog.choices && draft.dialog.choices.length) return;
  if (draft.dialog.lineIndex < draft.dialog.lines.length - 1) {
    draft.dialog.lineIndex += 1;
    return;
  }
  const ctx = draft.dialog.context;
  draft.dialog = null;
  draft.inputLock = false;
  if (ctx === 'boss21death') {
    draft.phase = 'ending';
    return;
  }
  draft.phase = 'playing';
}

export function chooseDialog(draft: GameState, action: string): void {
  if (!draft.dialog) return;
  const ctx = draft.dialog.context;
  draft.dialog = null;
  draft.inputLock = false;
  draft.phase = 'playing';

  if (action === 'leave') return;

  if (ctx === 'elderF15pre' || action === 'f15_sword') {
    if (action === 'f15_sword') {
      if (draft.player.exp < 500) {
        showToast(draft, '你的经验不足！');
        return;
      }
      draft.player.exp -= 500;
      draft.player.atk += 120;
      draft.flags.elderF15Done = true;
      showToast(draft, '获得圣光剑！攻击+120');
    }
    return;
  }
  if (ctx === 'merchantF15pre' || action === 'f15_shield') {
    if (action === 'f15_shield') {
      if (draft.player.gold < 500) {
        showToast(draft, '你的金币不足！');
        return;
      }
      draft.player.gold -= 500;
      draft.player.def += 120;
      draft.flags.merchantF15Done = true;
      showToast(draft, '获得星光盾！防御+120');
    }
  }
}

export function chooseShop(draft: GameState, action: string): void {
  if (!draft.shop) return;
  const shopId = draft.shop.shopId;
  if (action === 'leave') {
    draft.shop = null;
    draft.inputLock = false;
    draft.phase = 'playing';
    return;
  }

  const p = draft.player;
  const failGold = () => showToast(draft, '你的金币不足！');
  const failExp = () => showToast(draft, '你的经验不足！');
  const failKey = () => showToast(draft, '你的钥匙不足！');

  let ok = false;
  switch (action) {
    case 'gold3_hp':
      if (p.gold < 25) return failGold();
      p.gold -= 25;
      p.hp += 800;
      ok = true;
      break;
    case 'gold3_atk':
      if (p.gold < 25) return failGold();
      p.gold -= 25;
      p.atk += 4;
      ok = true;
      break;
    case 'gold3_def':
      if (p.gold < 25) return failGold();
      p.gold -= 25;
      p.def += 4;
      ok = true;
      break;
    case 'gold11_hp':
      if (p.gold < 100) return failGold();
      p.gold -= 100;
      p.hp += 4000;
      ok = true;
      break;
    case 'gold11_atk':
      if (p.gold < 100) return failGold();
      p.gold -= 100;
      p.atk += 20;
      ok = true;
      break;
    case 'gold11_def':
      if (p.gold < 100) return failGold();
      p.gold -= 100;
      p.def += 20;
      ok = true;
      break;
    case 'buy_yk':
      if (p.gold < 10) return failGold();
      p.gold -= 10;
      p.yellowKey += 1;
      ok = true;
      break;
    case 'buy_bk':
      if (p.gold < 50) return failGold();
      p.gold -= 50;
      p.blueKey += 1;
      ok = true;
      break;
    case 'buy_rk':
      if (p.gold < 100) return failGold();
      p.gold -= 100;
      p.redKey += 1;
      ok = true;
      break;
    case 'sell_yk':
      if (p.yellowKey < 1) return failKey();
      p.yellowKey -= 1;
      p.gold += 7;
      ok = true;
      break;
    case 'sell_bk':
      if (p.blueKey < 1) return failKey();
      p.blueKey -= 1;
      p.gold += 35;
      ok = true;
      break;
    case 'sell_rk':
      if (p.redKey < 1) return failKey();
      p.redKey -= 1;
      p.gold += 70;
      ok = true;
      break;
    case 'exp5_lv':
      if (p.exp < 100) return failExp();
      p.exp -= 100;
      p.lv += 1;
      p.atk += 7;
      p.def += 7;
      p.hp += 1000;
      ok = true;
      break;
    case 'exp5_atk':
      if (p.exp < 30) return failExp();
      p.exp -= 30;
      p.atk += 5;
      ok = true;
      break;
    case 'exp5_def':
      if (p.exp < 30) return failExp();
      p.exp -= 30;
      p.def += 5;
      ok = true;
      break;
    case 'exp13_lv':
      if (p.exp < 270) return failExp();
      p.exp -= 270;
      p.lv += 3;
      p.atk += 20;
      p.def += 20;
      p.hp += 3000;
      ok = true;
      break;
    case 'exp13_atk':
      if (p.exp < 95) return failExp();
      p.exp -= 95;
      p.atk += 17;
      ok = true;
      break;
    case 'exp13_def':
      if (p.exp < 95) return failExp();
      p.exp -= 95;
      p.def += 17;
      ok = true;
      break;
    case 'f15_sword':
      chooseDialog(draft, 'f15_sword');
      draft.shop = null;
      return;
    case 'f15_shield':
      chooseDialog(draft, 'f15_shield');
      draft.shop = null;
      return;
    default:
      break;
  }

  if (ok) showToast(draft, '交易成功');
  // keep shop open for gold/key/exp shops
  if (shopId.startsWith('gold') || shopId.startsWith('key') || shopId.startsWith('exp')) {
    return;
  }
  draft.shop = null;
  draft.inputLock = false;
  draft.phase = 'playing';
}

export function closeOverlay(draft: GameState): void {
  const fromLoad = draft.phase === 'load';
  draft.shop = null;
  draft.dialog = null;
  draft.inputLock = false;
  if (fromLoad && draft.removed.length === 0 && !draft.flags.fairyIntroDone) {
    draft.phase = 'title';
    return;
  }
  if (
    draft.phase === 'book' ||
    draft.phase === 'teleport' ||
    draft.phase === 'save' ||
    draft.phase === 'load' ||
    draft.phase === 'shop' ||
    draft.phase === 'dialog'
  ) {
    draft.phase = 'playing';
  }
}

export function startNewGame(draft: GameState): void {
  const saves = draft.saves;
  Object.assign(draft, makeInitialState());
  draft.saves = saves;
  draft.phase = 'intro';
}

export function finishIntro(draft: GameState): void {
  draft.phase = 'playing';
  draft.floor = 0;
  draft.player.x = 6;
  draft.player.y = 10;
}

export function tickAnim(draft: GameState, dtMs: number): void {
  if (draft.toastTtlMs > 0) {
    draft.toastTtlMs -= dtMs;
    if (draft.toastTtlMs <= 0) {
      draft.toastTtlMs = 0;
      draft.toastText = null;
    }
  }
  if (draft.anim.phase !== 'moving') return;
  draft.anim.elapsedMs += dtMs;
  if (draft.anim.elapsedMs >= draft.anim.durationMs) {
    draft.anim.phase = 'idle';
    draft.anim.elapsedMs = 0;
    draft.anim.fromX = draft.player.x;
    draft.anim.fromY = draft.player.y;
    draft.anim.toX = draft.player.x;
    draft.anim.toY = draft.player.y;
  }
}

export function serializeSnapshot(draft: GameState): GameSnapshot {
  return {
    floor: draft.floor,
    maxFloorReached: draft.maxFloorReached,
    player: { ...draft.player },
    flags: { ...draft.flags },
    removed: Object.keys(draft.removed),
    inventory: { ...draft.inventory },
  };
}

export function applySnapshot(draft: GameState, snap: GameSnapshot): void {
  draft.floor = snap.floor;
  draft.maxFloorReached = snap.maxFloorReached;
  draft.player = { ...snap.player };
  draft.flags = { ...snap.flags };
  draft.removed = [...snap.removed];
  draft.inventory = { ...snap.inventory };
  draft.phase = 'playing';
  draft.dialog = null;
  draft.shop = null;
  draft.inputLock = false;
  draft.anim.phase = 'idle';
  draft.anim.fromX = draft.player.x;
  draft.anim.fromY = draft.player.y;
  draft.anim.toX = draft.player.x;
  draft.anim.toY = draft.player.y;
}

export function saveToSlot(draft: GameState, index: number): void {
  const snap = serializeSnapshot(draft);
  const desc = `${snap.floor}层/${snap.player.hp}血/${snap.player.atk}攻/${snap.player.def}防`;
  draft.saves[index] = { desc, snapshot: JSON.stringify(snap) };
  showToast(draft, `已写入存档${index + 1}`);
  draft.phase = 'playing';
  draft.inputLock = false;
}

export function loadFromSlot(draft: GameState, index: number): void {
  const slot = draft.saves[index];
  if (!slot?.snapshot) {
    showToast(draft, '存档为空');
    return;
  }
  const snap = JSON.parse(slot.snapshot) as GameSnapshot;
  applySnapshot(draft, snap);
  showToast(draft, `已读取存档${index + 1}`);
}

export function teleportToFloor(draft: GameState, floor: number): void {
  if (floor < 0 || floor > draft.maxFloorReached) return;
  draft.floor = floor;
  const f = FLOORS[floor];
  const spawn = f.spawnDown || f.spawnUp || { x: 6, y: 6 };
  draft.player.x = spawn.x;
  draft.player.y = spawn.y;
  draft.phase = 'playing';
  draft.inputLock = false;
  draft.anim.phase = 'idle';
  showToast(draft, `传送到 ${floor} 层`);
}

export { INTRO_TEXT, ENDING_TEXT, resolveMonster, getFloorEntities as listFloorEntities };
