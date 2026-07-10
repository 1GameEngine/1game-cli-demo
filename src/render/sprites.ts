import type { Entity } from '../state/types';

import tankPlayerUp from '../assets/tank-player-up.svg';
import tankPlayerDown from '../assets/tank-player-down.svg';
import tankPlayerLeft from '../assets/tank-player-left.svg';
import tankPlayerRight from '../assets/tank-player-right.svg';
import tankPlayerStarUp from '../assets/tank-player-star-up.svg';
import tankPlayerStarDown from '../assets/tank-player-star-down.svg';
import tankPlayerStarLeft from '../assets/tank-player-star-left.svg';
import tankPlayerStarRight from '../assets/tank-player-star-right.svg';

import tankBasicUp from '../assets/tank-basic-up.svg';
import tankBasicDown from '../assets/tank-basic-down.svg';
import tankBasicLeft from '../assets/tank-basic-left.svg';
import tankBasicRight from '../assets/tank-basic-right.svg';
import tankFastUp from '../assets/tank-fast-up.svg';
import tankFastDown from '../assets/tank-fast-down.svg';
import tankFastLeft from '../assets/tank-fast-left.svg';
import tankFastRight from '../assets/tank-fast-right.svg';
import tankPowerUp from '../assets/tank-power-up.svg';
import tankPowerDown from '../assets/tank-power-down.svg';
import tankPowerLeft from '../assets/tank-power-left.svg';
import tankPowerRight from '../assets/tank-power-right.svg';
import tankArmor4Up from '../assets/tank-armor4-up.svg';
import tankArmor4Down from '../assets/tank-armor4-down.svg';
import tankArmor4Left from '../assets/tank-armor4-left.svg';
import tankArmor4Right from '../assets/tank-armor4-right.svg';
import tankArmor3Up from '../assets/tank-armor3-up.svg';
import tankArmor3Down from '../assets/tank-armor3-down.svg';
import tankArmor3Left from '../assets/tank-armor3-left.svg';
import tankArmor3Right from '../assets/tank-armor3-right.svg';
import tankArmor2Up from '../assets/tank-armor2-up.svg';
import tankArmor2Down from '../assets/tank-armor2-down.svg';
import tankArmor2Left from '../assets/tank-armor2-left.svg';
import tankArmor2Right from '../assets/tank-armor2-right.svg';
import tankArmor1Up from '../assets/tank-armor1-up.svg';
import tankArmor1Down from '../assets/tank-armor1-down.svg';
import tankArmor1Left from '../assets/tank-armor1-left.svg';
import tankArmor1Right from '../assets/tank-armor1-right.svg';
import tankFlashUp from '../assets/tank-flash-up.svg';
import tankFlashDown from '../assets/tank-flash-down.svg';
import tankFlashLeft from '../assets/tank-flash-left.svg';
import tankFlashRight from '../assets/tank-flash-right.svg';

import tileBrick from '../assets/tile-brick.svg';
import tileBrickTl from '../assets/tile-brick-tl.svg';
import tileBrickTr from '../assets/tile-brick-tr.svg';
import tileBrickBl from '../assets/tile-brick-bl.svg';
import tileBrickBr from '../assets/tile-brick-br.svg';
import tileSteel from '../assets/tile-steel.svg';
import tileSteelTl from '../assets/tile-steel-tl.svg';
import tileSteelTr from '../assets/tile-steel-tr.svg';
import tileSteelBl from '../assets/tile-steel-bl.svg';
import tileSteelBr from '../assets/tile-steel-br.svg';
import tileWater from '../assets/tile-water.svg';
import tileWaterAlt from '../assets/tile-water-alt.svg';
import tileForest from '../assets/tile-forest.svg';
import tileIce from '../assets/tile-ice.svg';

import eagle from '../assets/eagle.svg';
import eagleDead from '../assets/eagle-dead.svg';
import bullet from '../assets/bullet.svg';
import bulletExplode from '../assets/bullet-explode.svg';
import spawn from '../assets/spawn.svg';
import explode from '../assets/explode.svg';
import shield from '../assets/shield.svg';

import puHelmet from '../assets/pu-helmet.svg';
import puClock from '../assets/pu-clock.svg';
import puShovel from '../assets/pu-shovel.svg';
import puStar from '../assets/pu-star.svg';
import puGrenade from '../assets/pu-grenade.svg';
import puTank from '../assets/pu-tank.svg';

import hudEnemy from '../assets/hud-enemy.svg';
import hudPlayer from '../assets/hud-player.svg';
import hudFlag from '../assets/hud-flag.svg';
import titleTank from '../assets/title-tank.svg';

const DIR = ['up', 'left', 'down', 'right'] as const;

type DirName = (typeof DIR)[number];

function dirName(dir: number): DirName {
  return DIR[((dir % 4) + 4) % 4];
}

const playerDirs = {
  up: tankPlayerUp,
  down: tankPlayerDown,
  left: tankPlayerLeft,
  right: tankPlayerRight,
};
const playerStarDirs = {
  up: tankPlayerStarUp,
  down: tankPlayerStarDown,
  left: tankPlayerStarLeft,
  right: tankPlayerStarRight,
};

const enemySets: Record<string, Record<DirName, string>> = {
  basic: { up: tankBasicUp, down: tankBasicDown, left: tankBasicLeft, right: tankBasicRight },
  fast: { up: tankFastUp, down: tankFastDown, left: tankFastLeft, right: tankFastRight },
  power: { up: tankPowerUp, down: tankPowerDown, left: tankPowerLeft, right: tankPowerRight },
  armor4: { up: tankArmor4Up, down: tankArmor4Down, left: tankArmor4Left, right: tankArmor4Right },
  armor3: { up: tankArmor3Up, down: tankArmor3Down, left: tankArmor3Left, right: tankArmor3Right },
  armor2: { up: tankArmor2Up, down: tankArmor2Down, left: tankArmor2Left, right: tankArmor2Right },
  armor1: { up: tankArmor1Up, down: tankArmor1Down, left: tankArmor1Left, right: tankArmor1Right },
  flash: { up: tankFlashUp, down: tankFlashDown, left: tankFlashLeft, right: tankFlashRight },
};

export function tankSprite(e: Entity, frame: number): string {
  const d = dirName(e.dir);
  if (e.isPlayer) {
    return e.starLevel > 0 ? playerStarDirs[d] : playerDirs[d];
  }
  if (e.powerUpTank && (frame >> 2) & 1) return enemySets.flash[d];
  if (e.type === 1) return enemySets.fast[d];
  if (e.type === 2) return enemySets.power[d];
  if (e.type === 3) {
    const hp = e.armorHits + 1;
    if (hp >= 4) return enemySets.armor4[d];
    if (hp === 3) return enemySets.armor3[d];
    if (hp === 2) return enemySets.armor2[d];
    return enemySets.armor1[d];
  }
  return enemySets.basic[d];
}

export function brickQuadSprite(bitIndex: number): string {
  return [tileBrickTl, tileBrickTr, tileBrickBl, tileBrickBr][bitIndex];
}

export function steelQuadSprite(bitIndex: number): string {
  return [tileSteelTl, tileSteelTr, tileSteelBl, tileSteelBr][bitIndex];
}

export function waterSprite(frame: number): string {
  return (frame >> 4) & 1 ? tileWaterAlt : tileWater;
}

export function powerupSprite(type: number): string {
  return [puHelmet, puClock, puShovel, puStar, puGrenade, puTank][type] ?? puStar;
}

export const Sprites = {
  tileBrick,
  tileSteel,
  tileForest,
  tileIce,
  eagle,
  eagleDead,
  bullet,
  bulletExplode,
  spawn,
  explode,
  shield,
  hudEnemy,
  hudPlayer,
  hudFlag,
  titleTank,
  brickQuadSprite,
  steelQuadSprite,
  waterSprite,
  powerupSprite,
  tankSprite,
};
