import tankPlayerUp from '../assets/essential/tank-player-up.png';
import tankPlayerDown from '../assets/essential/tank-player-down.png';
import tankPlayerLeft from '../assets/essential/tank-player-left.png';
import tankPlayerRight from '../assets/essential/tank-player-right.png';
import tankBasicUp from '../assets/essential/tank-basic-up.png';
import tankBasicDown from '../assets/essential/tank-basic-down.png';
import tankBasicLeft from '../assets/essential/tank-basic-left.png';
import tankBasicRight from '../assets/essential/tank-basic-right.png';
import tankFastUp from '../assets/essential/tank-fast-up.png';
import tankPowerUp from '../assets/essential/tank-power-up.png';
import tankArmor4Up from '../assets/essential/tank-armor4-up.png';
import tankFlashUp from '../assets/essential/tank-flash-up.png';
import tileBrick from '../assets/essential/tile-brick.png';
import tileSteel from '../assets/essential/tile-steel.png';
import tileWater from '../assets/essential/tile-water.png';
import tileForest from '../assets/essential/tile-forest.png';
import tileIce from '../assets/essential/tile-ice.png';
import eagle from '../assets/essential/eagle.png';
import eagleDead from '../assets/essential/eagle-dead.png';
import bullet from '../assets/essential/bullet.png';
import explode from '../assets/essential/explode.png';
import spawn from '../assets/essential/spawn.png';
import shield from '../assets/essential/shield.png';
import puStar from '../assets/essential/pu-star.png';
import hudEnemy from '../assets/essential/hud-enemy.png';
import hudPlayer from '../assets/essential/hud-player.png';
import hudFlag from '../assets/essential/hud-flag.png';
import titleTank from '../assets/essential/title-tank.png';
import type { Entity } from '../state/types';

const playerDirs = [tankPlayerUp, tankPlayerLeft, tankPlayerDown, tankPlayerRight];
const basicDirs = [tankBasicUp, tankBasicLeft, tankBasicDown, tankBasicRight];

export function tankSprite(e: Entity, frame: number): string {
  const d = ((e.dir % 4) + 4) % 4;
  if (e.isPlayer) return playerDirs[d];
  if (e.powerUpTank && (frame >> 2) & 1) return tankFlashUp;
  if (e.type === 1) return tankFastUp;
  if (e.type === 2) return tankPowerUp;
  if (e.type === 3) return tankArmor4Up;
  return basicDirs[d];
}

export const Sprites = {
  tileBrick,
  tileSteel,
  tileWater,
  tileForest,
  tileIce,
  eagle,
  eagleDead,
  bullet,
  explode,
  spawn,
  shield,
  puStar,
  hudEnemy,
  hudPlayer,
  hudFlag,
  titleTank,
  tankSprite,
};
