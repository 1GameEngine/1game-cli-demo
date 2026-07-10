import s0 from '../assets/sprites/player_player.png';
import s1 from '../assets/sprites/tile_wall.png';
import s2 from '../assets/sprites/tile_wallAlt.png';
import s3 from '../assets/sprites/tile_wall1.png';
import s4 from '../assets/sprites/tile_wall4.png';
import s5 from '../assets/sprites/tile_yellowDoor.png';
import s6 from '../assets/sprites/tile_blueDoor.png';
import s7 from '../assets/sprites/tile_redDoor.png';
import s8 from '../assets/sprites/tile_greenDoor.png';
import s9 from '../assets/sprites/tile_stairUp.png';
import s10 from '../assets/sprites/tile_stairDown.png';
import s11 from '../assets/sprites/tile_lava.png';
import s12 from '../assets/sprites/tile_water.png';
import s13 from '../assets/sprites/tile_waterLight.png';
import s14 from '../assets/sprites/tile_star.png';
import s15 from '../assets/sprites/tile_ironFence.png';
import s16 from '../assets/sprites/tile_storyDoor.png';
import s17 from '../assets/sprites/npc_fairy.png';
import s18 from '../assets/sprites/npc_goldShopF3.png';
import s19 from '../assets/sprites/npc_goldShopF11.png';
import s20 from '../assets/sprites/npc_merchantF2.png';
import s21 from '../assets/sprites/npc_elderF2.png';
import s22 from '../assets/sprites/npc_thief.png';
import s23 from '../assets/sprites/npc_princess.png';
import s24 from '../assets/sprites/npc_keyShopF5.png';
import s25 from '../assets/sprites/npc_keyShopF12.png';
import s26 from '../assets/sprites/npc_expElderF5.png';
import s27 from '../assets/sprites/npc_expElderF13.png';
import s28 from '../assets/sprites/npc_elderF15.png';
import s29 from '../assets/sprites/npc_merchantF15.png';
import s30 from '../assets/sprites/monster_finalBoss.png';
import s31 from '../assets/sprites/monster_redMage.png';
import s32 from '../assets/sprites/monster_yellowMage.png';
import s33 from '../assets/sprites/monster_highMage.png';
import s34 from '../assets/sprites/monster_mage.png';
import s35 from '../assets/sprites/monster_spiritMage.png';
import s36 from '../assets/sprites/monster_whiteWarrior.png';
import s37 from '../assets/sprites/monster_bloodShadow.png';
import s38 from '../assets/sprites/monster_dragon.png';
import s39 from '../assets/sprites/monster_redBoss.png';
import s40 from '../assets/sprites/monster_spiritWarrior.png';
import s41 from '../assets/sprites/monster_goldCaptain.png';
import s42 from '../assets/sprites/monster_goldGuard.png';
import s43 from '../assets/sprites/monster_darkWarrior.png';
import s44 from '../assets/sprites/monster_swordsman.png';
import s45 from '../assets/sprites/monster_highGuard.png';
import s46 from '../assets/sprites/monster_midGuard.png';
import s47 from '../assets/sprites/monster_guard.png';
import s48 from '../assets/sprites/monster_shadowWarrior.png';
import s49 from '../assets/sprites/monster_stoneMan.png';
import s50 from '../assets/sprites/monster_beastWarrior.png';
import s51 from '../assets/sprites/monster_beast.png';
import s52 from '../assets/sprites/monster_darkCaptain.png';
import s53 from '../assets/sprites/monster_slimeKing.png';
import s54 from '../assets/sprites/monster_skeletonCaptain.png';
import s55 from '../assets/sprites/monster_redBat.png';
import s56 from '../assets/sprites/monster_blackSlime.png';
import s57 from '../assets/sprites/monster_skeletonSoldier.png';
import s58 from '../assets/sprites/monster_bigBat.png';
import s59 from '../assets/sprites/monster_redSlime.png';
import s60 from '../assets/sprites/monster_skeleton.png';
import s61 from '../assets/sprites/monster_bat.png';
import s62 from '../assets/sprites/monster_greenSlime.png';
import s63 from '../assets/sprites/item_ironShield.png';
import s64 from '../assets/sprites/item_silverShield.png';
import s65 from '../assets/sprites/item_knightShield.png';
import s66 from '../assets/sprites/item_holyShield.png';
import s67 from '../assets/sprites/item_divineShield.png';
import s68 from '../assets/sprites/item_ironSword.png';
import s69 from '../assets/sprites/item_silverSword.png';
import s70 from '../assets/sprites/item_steelSword.png';
import s71 from '../assets/sprites/item_holySword.png';
import s72 from '../assets/sprites/item_starSword.png';
import s73 from '../assets/sprites/item_redPotion.png';
import s74 from '../assets/sprites/item_bluePotion.png';
import s75 from '../assets/sprites/item_redGem.png';
import s76 from '../assets/sprites/item_blueGem.png';
import s77 from '../assets/sprites/item_bigWing.png';
import s78 from '../assets/sprites/item_smallWing.png';
import s79 from '../assets/sprites/item_coinBag.png';
import s80 from '../assets/sprites/item_keyBox.png';
import s81 from '../assets/sprites/item_yellowKey.png';
import s82 from '../assets/sprites/item_blueKey.png';
import s83 from '../assets/sprites/item_redKey.png';

export type SpriteRef = { source: unknown; cut: string | null };

export const PLAYER_SPRITE: SpriteRef = { source: s0, cut: null };

export const TILE_SPRITES: Record<string, SpriteRef> = {
  wall: { source: s1, cut: null },
  wallAlt: { source: s2, cut: null },
  wall1: { source: s3, cut: null },
  wall4: { source: s4, cut: null },
  yellowDoor: { source: s5, cut: null },
  blueDoor: { source: s6, cut: null },
  redDoor: { source: s7, cut: null },
  greenDoor: { source: s8, cut: null },
  stairUp: { source: s9, cut: null },
  stairDown: { source: s10, cut: null },
  lava: { source: s11, cut: null },
  water: { source: s12, cut: null },
  waterLight: { source: s13, cut: null },
  star: { source: s14, cut: null },
  ironFence: { source: s15, cut: null },
  storyDoor: { source: s16, cut: null },
};

export const NPC_SPRITES: Record<string, SpriteRef> = {
  fairy: { source: s17, cut: null },
  goldShopF3: { source: s18, cut: null },
  goldShopF11: { source: s19, cut: null },
  merchantF2: { source: s20, cut: null },
  elderF2: { source: s21, cut: null },
  thief: { source: s22, cut: null },
  princess: { source: s23, cut: null },
  keyShopF5: { source: s24, cut: null },
  keyShopF12: { source: s25, cut: null },
  expElderF5: { source: s26, cut: null },
  expElderF13: { source: s27, cut: null },
  elderF15: { source: s28, cut: null },
  merchantF15: { source: s29, cut: null },
};

export const MONSTER_SPRITES: Record<string, SpriteRef> = {
  finalBoss: { source: s30, cut: null },
  redMage: { source: s31, cut: null },
  yellowMage: { source: s32, cut: null },
  highMage: { source: s33, cut: null },
  mage: { source: s34, cut: null },
  spiritMage: { source: s35, cut: null },
  whiteWarrior: { source: s36, cut: null },
  bloodShadow: { source: s37, cut: null },
  dragon: { source: s38, cut: null },
  redBoss: { source: s39, cut: null },
  spiritWarrior: { source: s40, cut: null },
  goldCaptain: { source: s41, cut: null },
  goldGuard: { source: s42, cut: null },
  darkWarrior: { source: s43, cut: null },
  swordsman: { source: s44, cut: null },
  highGuard: { source: s45, cut: null },
  midGuard: { source: s46, cut: null },
  guard: { source: s47, cut: null },
  shadowWarrior: { source: s48, cut: null },
  stoneMan: { source: s49, cut: null },
  beastWarrior: { source: s50, cut: null },
  beast: { source: s51, cut: null },
  darkCaptain: { source: s52, cut: null },
  slimeKing: { source: s53, cut: null },
  skeletonCaptain: { source: s54, cut: null },
  redBat: { source: s55, cut: null },
  blackSlime: { source: s56, cut: null },
  skeletonSoldier: { source: s57, cut: null },
  bigBat: { source: s58, cut: null },
  redSlime: { source: s59, cut: null },
  skeleton: { source: s60, cut: null },
  bat: { source: s61, cut: null },
  greenSlime: { source: s62, cut: null },
};

export const ITEM_SPRITES: Record<string, SpriteRef> = {
  ironShield: { source: s63, cut: null },
  silverShield: { source: s64, cut: null },
  knightShield: { source: s65, cut: null },
  holyShield: { source: s66, cut: null },
  divineShield: { source: s67, cut: null },
  ironSword: { source: s68, cut: null },
  silverSword: { source: s69, cut: null },
  steelSword: { source: s70, cut: null },
  holySword: { source: s71, cut: null },
  starSword: { source: s72, cut: null },
  redPotion: { source: s73, cut: null },
  bluePotion: { source: s74, cut: null },
  redGem: { source: s75, cut: null },
  blueGem: { source: s76, cut: null },
  bigWing: { source: s77, cut: null },
  smallWing: { source: s78, cut: null },
  coinBag: { source: s79, cut: null },
  keyBox: { source: s80, cut: null },
  yellowKey: { source: s81, cut: null },
  blueKey: { source: s82, cut: null },
  redKey: { source: s83, cut: null },
};

export function spriteFor(type: string, id: string): SpriteRef | null {
  if (type === 'tile') return TILE_SPRITES[id] || null;
  if (type === 'monster') return MONSTER_SPRITES[id] || null;
  if (type === 'item') return ITEM_SPRITES[id] || null;
  if (type === 'npc') return NPC_SPRITES[id] || null;
  return null;
}
