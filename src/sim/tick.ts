import {
  BULLET_SPEED_FAST,
  BULLET_SPEED_NORMAL,
  DX,
  DY,
  EAGLE,
  EN_SPAWN_X,
  EN_SPAWN_Y,
  ENEMY_SCORE,
  ENEMIES_PER_STAGE,
  FIELD_H,
  FIELD_W,
  FX,
  FY,
  GW,
  GH,
  LIFE_BONUS_SCORE,
  MAX_ACTIVE_ENEMIES,
  MAX_STAGES,
  META,
  POWERUP_SCORE,
  POWERUP_WEIGHTS,
  Tile,
} from '../data/constants';
import { ENEMY_TYPE_TABLE, spawnDelayBase } from '../data/enemies';
import { beginStage, makeTitleState, spawnPlayer } from '../data/initial';
import { applyEagleWall, destroyBrick, passable8 } from '../data/tiles';
import { chance, nextRandom } from './rng';
import type { Dir, Entity, GameState } from '../state/types';
import { INITIAL_LIVES } from '../data/constants';

const TANK_SZ = 16;
const DIR_TARGET_TABLE = [
  0, 0, 0, 1, 0, 3, 2, 2, 2,
  1, 0, 3, 1, 0, 3, 1, 2, 3,
];
const POWERUP_COORDS = [48, 96, 144, 192];

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function addScore(draft: GameState, pts: number): void {
  draft.score += pts;
  while (draft.score >= draft.nextLifeAt) {
    draft.lives += 1;
    draft.nextLifeAt += LIFE_BONUS_SCORE;
  }
  if (draft.score > draft.hiScore) draft.hiScore = draft.score;
}

function playerDir(draft: GameState): number {
  const { up, down, left, right } = draft.input;
  if (up && !down) return 0;
  if (left && !right) return 1;
  if (down && !up) return 2;
  if (right && !left) return 3;
  // diagonals: prefer last axis — simple priority U L D R already handled
  if (up) return 0;
  if (left) return 1;
  if (down) return 2;
  if (right) return 3;
  return -1;
}

function canMove(draft: GameState, e: Entity, d: Dir): boolean {
  const nx = e.x + DX[d];
  const ny = e.y + DY[d];
  if (nx - 8 < FX || nx - 8 + TANK_SZ > FX + FIELD_W) return false;
  if (ny - 8 < FY || ny - 8 + TANK_SZ > FY + FIELD_H) return false;
  if (
    draft.eagleAlive &&
    rectsOverlap(nx - 8, ny - 8, TANK_SZ, TANK_SZ, EAGLE.x - 8, EAGLE.y - 8, 16, 16)
  ) {
    return false;
  }

  let p1x = 0;
  let p1y = 0;
  let p2x = 0;
  let p2y = 0;
  if (d === 0) {
    p1x = nx - 8;
    p1y = ny - 8;
    p2x = nx + 7;
    p2y = ny - 8;
  } else if (d === 1) {
    p1x = nx - 8;
    p1y = ny - 8;
    p2x = nx - 8;
    p2y = ny + 7;
  } else if (d === 2) {
    p1x = nx - 8;
    p1y = ny + 7;
    p2x = nx + 7;
    p2y = ny + 7;
  } else {
    p1x = nx + 7;
    p1y = ny - 8;
    p2x = nx + 7;
    p2y = ny + 7;
  }
  return passable8(draft.grid, draft.brickBits, p1x, p1y) && passable8(draft.grid, draft.brickBits, p2x, p2y);
}

function calcDirToTarget(draft: GameState, e: Entity, tx: number, ty: number): Dir {
  const dx = tx - e.x;
  const dy = ty - e.y;
  const sx = dx === 0 ? 0 : dx > 0 ? 1 : -1;
  const sy = dy === 0 ? 0 : dy > 0 ? 1 : -1;
  const tableIdx = (sy + 1) * 3 + (sx + 1);
  const setPick = chance(draft.rngSeed, 1, 2);
  draft.rngSeed = setPick.seed;
  const setOffset = setPick.hit ? 9 : 0;
  return DIR_TARGET_TABLE[tableIdx + setOffset] as Dir;
}

function speedCtrlMove(draft: GameState, e: Entity): void {
  const frameHi = (draft.frame >> 6) & 0xff;
  const sdm = Math.max(50, 190 - draft.stageIndex * 4);
  if (sdm >> 2 >= frameHi) {
    e.dir = calcDirToTarget(draft, e, EAGLE.x, EAGLE.y);
  } else if (sdm >> 3 >= frameHi) {
    const r = nextRandom(draft.rngSeed, 4);
    draft.rngSeed = r.seed;
    e.dir = r.value as Dir;
  } else {
    const p = draft.entities[0];
    if (p.alive) e.dir = calcDirToTarget(draft, e, p.x, p.y);
    else {
      const r = nextRandom(draft.rngSeed, 4);
      draft.rngSeed = r.seed;
      e.dir = r.value as Dir;
    }
  }
}

function onIce(draft: GameState, e: Entity): boolean {
  const col = Math.floor((e.x - 8 - FX) / META);
  const row = Math.floor((e.y - 8 - FY) / META);
  return row >= 0 && row < GH && col >= 0 && col < GW && draft.grid[row][col] === Tile.ICE;
}

function moveEntities(draft: GameState): void {
  for (let i = 0; i < 8; i += 1) {
    const e = draft.entities[i];
    if (!e.alive || e.spawnAnim > 0) continue;
    const ice = onIce(draft, e);

    if (e.isPlayer) {
      if ((draft.frame & 3) === 2) continue;
      if (e.stunTimer > 0) {
        e.stunTimer -= 1;
        continue;
      }
      const d = playerDir(draft);
      if (!ice) {
        if (d === -1) continue;
        if (d !== e.dir) {
          if (d !== (e.dir ^ 2)) {
            e.x = (e.x + 4) & 0xf8;
            e.y = (e.y + 4) & 0xf8;
          }
          e.dir = d as Dir;
        }
      }
      if (canMove(draft, e, e.dir)) {
        e.x += DX[e.dir];
        e.y += DY[e.dir];
      }
      e.animBit ^= 4;
    } else {
      if (draft.freezeTimer > 0) continue;
      if (e.type !== 1 && (i ^ draft.frame) & 1) continue;

      if (!ice) {
        if ((e.x & 7) === 0 && (e.y & 7) === 0) {
          const r = nextRandom(draft.rngSeed, 16);
          draft.rngSeed = r.seed;
          if (r.value === 0) {
            speedCtrlMove(draft, e);
            continue;
          }
        }
        if (!canMove(draft, e, e.dir)) {
          const flip = chance(draft.rngSeed, 1, 4);
          draft.rngSeed = flip.seed;
          if (flip.hit) {
            e.x = (e.x + 4) & 0xf8;
            e.y = (e.y + 4) & 0xf8;
            e.dir = (e.dir ^ 2) as Dir;
            continue;
          }
          e.animBit ^= 4;
          continue;
        }
      }

      e.x += DX[e.dir];
      e.y += DY[e.dir];
      e.animBit ^= 4;
    }
  }
}

function tryFire(draft: GameState, e: Entity): void {
  let b = draft.bullets[e.slot];
  if (b.active) {
    if (e.starLevel < 0x40) return;
    const sec = e.isPlayer ? 8 : -1;
    if (sec < 0 || draft.bullets[sec].active) return;
    b = draft.bullets[sec];
  }
  b.x = e.x + DX[e.dir] * 8;
  b.y = e.y + DY[e.dir] * 8;
  b.dir = e.dir;
  b.active = true;
  b.explodeTimer = 0;
  b.armor = e.starLevel >= 0x60;
  b.powered = e.starLevel >= 0x20 || (!e.isPlayer && e.type === 2);
  b.owner = e.slot;
}

function handleFire(draft: GameState): void {
  const e = draft.entities[0];
  const press = draft.input.fire;
  if (press && !draft.input.firePrev && e.alive && e.spawnAnim === 0) tryFire(draft, e);
  draft.input.firePrev = press;

  if (draft.freezeTimer > 0) return;
  for (let i = 1; i < 8; i += 1) {
    const en = draft.entities[i];
    if (!en.alive || en.spawnAnim > 0) continue;
    const r = nextRandom(draft.rngSeed, 32);
    draft.rngSeed = r.seed;
    if (r.value === 0) tryFire(draft, en);
  }
}

function tryBrickAt(draft: GameState, bx: number, by: number, double: boolean): void {
  const col = Math.floor((bx - FX) / META);
  const row = Math.floor((by - FY) / META);
  if (col < 0 || col >= GW || row < 0 || row >= GH) return;
  const t = draft.grid[row][col];
  if (t !== Tile.BRICK && !(t >= Tile.PB0 && t <= Tile.PB3)) return;
  const localX = bx - (FX + col * META);
  const localY = by - (FY + row * META);
  const qbit = 1 << (Math.floor(localY / 8) * 2 + Math.floor(localX / 8));
  if (draft.brickBits[row][col] & qbit) destroyBrick(draft.grid, draft.brickBits, row, col, bx, by, double);
}

function bulletHitsTileAt(
  draft: GameState,
  b: GameState['bullets'][number],
  bx: number,
  by: number,
): 'brick' | 'solid' | null {
  const col = Math.floor((bx - FX) / META);
  const row = Math.floor((by - FY) / META);
  if (col < 0 || col >= GW || row < 0 || row >= GH) return null;
  const t = draft.grid[row][col];
  const localX = bx - (FX + col * META);
  const localY = by - (FY + row * META);
  const qx = localX >= 8 ? 1 : 0;
  const qy = localY >= 8 ? 1 : 0;
  const qbit = 1 << (qy * 2 + qx);

  if (t === Tile.STEEL || (t >= Tile.PS0 && t <= Tile.PS3)) {
    if (t >= Tile.PS0 && t <= Tile.PS3) {
      const STEEL_BLOCK = [0b1010, 0b1100, 0b0101, 0b0011];
      if (!(STEEL_BLOCK[t - Tile.PS0] & qbit)) return null;
    }
    if (b.armor) draft.grid[row][col] = Tile.EMPTY;
    return 'solid';
  }

  if (t === Tile.BRICK || (t >= Tile.PB0 && t <= Tile.PB3)) {
    if (!(draft.brickBits[row][col] & qbit)) return null;
    destroyBrick(draft.grid, draft.brickBits, row, col, bx, by, b.armor);
    return 'brick';
  }
  return null;
}

function moveBullets(draft: GameState): void {
  for (const b of draft.bullets) {
    if (!b.active) continue;
    const spd = b.powered ? BULLET_SPEED_FAST : BULLET_SPEED_NORMAL;
    // ROM: normal 2px, power 4px — constants already set
    b.x += DX[b.dir] * (b.powered ? 4 : 2);
    b.y += DY[b.dir] * (b.powered ? 4 : 2);
    void spd;

    if (b.x < FX - 4 || b.x > FX + FIELD_W + 4 || b.y < FY - 4 || b.y > FY + FIELD_H + 4) {
      b.active = false;
      continue;
    }

    if (!b.powered && !((b.slot ^ draft.frame) & 1)) continue;

    if (draft.eagleAlive && Math.abs(b.x - EAGLE.x) < 12 && Math.abs(b.y - EAGLE.y) < 8) {
      draft.eagleAlive = false;
      draft.eagleExpTimer = 39;
      b.explodeTimer = 8;
      b.active = false;
      continue;
    }

    const isHoriz = b.dir & 1;
    const px = isHoriz ? 0 : 1;
    const py = isHoriz ? 1 : 0;
    const hitA = bulletHitsTileAt(draft, b, b.x, b.y);
    if (hitA === 'brick') tryBrickAt(draft, b.x + px * 4, b.y + py * 4, b.armor);
    const hitC = bulletHitsTileAt(draft, b, b.x - px, b.y - py);
    if (hitC === 'brick') tryBrickAt(draft, b.x - px * 5, b.y - py * 5, b.armor);
    if (hitA || hitC) {
      b.explodeTimer = 8;
      b.active = false;
    }
  }
  for (const b of draft.bullets) {
    if (!b.active && b.explodeTimer > 0) b.explodeTimer -= 1;
  }
}

function killEntity(draft: GameState, e: Entity, fromGrenade = false): void {
  if (!e.alive) return;
  e.alive = false;
  e.deathTimer = 24;

  if (e.isPlayer) {
    draft.lives -= 1;
    if (draft.lives < 0) draft.gameOverDelay = 90;
    else draft.playerRespawnTimer = 120;
  } else {
    draft.activeEnemyCount -= 1;
    if (!fromGrenade) {
      const pts = ENEMY_SCORE[Math.min(e.type, 3)];
      addScore(draft, pts);
      draft.killCounts[Math.min(e.type, 3)] += 1;
    }
    if (e.powerUpTank && !fromGrenade) spawnPowerUp(draft);
  }
}

function bulletEntityCollision(draft: GameState): void {
  for (const b of draft.bullets) {
    if (!b.active) continue;
    const isPlayerBullet = b.owner === 0 || b.owner === 8;

    for (let ei = 0; ei < 8; ei += 1) {
      const e = draft.entities[ei];
      if (!e.alive || e.spawnAnim > 0) continue;
      if (ei === b.owner) continue;
      if (!isPlayerBullet && !e.isPlayer) continue;
      if (isPlayerBullet && e.isPlayer) continue;

      if (Math.abs(b.x - e.x) >= 10 || Math.abs(b.y - e.y) >= 10) continue;

      b.explodeTimer = 8;
      b.active = false;

      if (!isPlayerBullet) {
        if (e.shieldTimer > 0) continue;
        killEntity(draft, e);
      } else if (e.armorHits > 0) {
        e.armorHits -= 1;
        e.blinkFrame = 20;
      } else {
        killEntity(draft, e);
      }
      break;
    }
  }
}

function bulletBulletCancel(draft: GameState): void {
  for (const pi of [0, 8]) {
    const pb = draft.bullets[pi];
    if (!pb.active) continue;
    for (let ei = 1; ei < 8; ei += 1) {
      const eb = draft.bullets[ei];
      if (!eb.active) continue;
      if (Math.abs(pb.x - eb.x) < 6 && Math.abs(pb.y - eb.y) < 6) {
        pb.explodeTimer = 6;
        eb.explodeTimer = 6;
        pb.active = false;
        eb.active = false;
      }
    }
  }
}

function spawnPowerUp(draft: GameState): void {
  const typePick = nextRandom(draft.rngSeed, POWERUP_WEIGHTS.length);
  draft.rngSeed = typePick.seed;
  const type = POWERUP_WEIGHTS[typePick.value];
  let x = POWERUP_COORDS[0];
  let y = POWERUP_COORDS[0];
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const xr = nextRandom(draft.rngSeed, 4);
    draft.rngSeed = xr.seed;
    const yr = nextRandom(draft.rngSeed, 4);
    draft.rngSeed = yr.seed;
    x = POWERUP_COORDS[xr.value];
    y = POWERUP_COORDS[yr.value];
    if (!draft.powerup || Math.abs(x - draft.powerup.x) >= 8 || Math.abs(y - draft.powerup.y) >= 8) break;
  }
  draft.powerup = { x, y, type };
}

function applyPowerUp(draft: GameState, type: number): void {
  const e = draft.entities[0];
  addScore(draft, POWERUP_SCORE);
  switch (type) {
    case 0:
      e.shieldTimer = 10;
      break;
    case 1:
      draft.freezeTimer = 10;
      break;
    case 2:
      draft.shovelTimer = 20;
      applyEagleWall(draft.grid, draft.brickBits, true);
      break;
    case 3:
      e.starLevel = Math.min(e.starLevel + 0x20, 0x60);
      break;
    case 4:
      for (let i = 1; i < 8; i += 1) {
        if (draft.entities[i].alive) killEntity(draft, draft.entities[i], true);
      }
      draft.grenadeFlash = 8;
      break;
    case 5:
      draft.lives += 1;
      break;
    default:
      break;
  }
}

function checkPowerUp(draft: GameState): void {
  if (!draft.powerup) return;
  const e = draft.entities[0];
  if (!e.alive || e.spawnAnim > 0) return;
  if (Math.abs(e.x - draft.powerup.x) < 12 && Math.abs(e.y - draft.powerup.y) < 12) {
    applyPowerUp(draft, draft.powerup.type);
    draft.powerup = null;
  }
}

function spawnEnemy(draft: GameState): void {
  if (draft.enemiesLeft <= 0 || draft.activeEnemyCount >= MAX_ACTIVE_ENEMIES) return;
  for (let i = 1; i < 8; i += 1) {
    const e = draft.entities[i];
    if (e.alive || e.deathTimer > 0) continue;

    e.x = EN_SPAWN_X[draft.spawnRot % 3];
    e.y = EN_SPAWN_Y;
    e.dir = 2;
    e.alive = true;
    e.spawnAnim = 30;
    const typeRow = ENEMY_TYPE_TABLE[draft.stageIndex] ?? ENEMY_TYPE_TABLE[0];
    const spawnedIndex = ENEMIES_PER_STAGE - draft.enemiesLeft;
    e.type = typeRow[spawnedIndex] ?? 0;
    e.powerUpTank = draft.enemiesLeft === 17 || draft.enemiesLeft === 10 || draft.enemiesLeft === 3;
    if (e.powerUpTank) draft.powerup = null;
    e.armorHits = e.type >= 3 ? 3 : 0;
    e.shieldTimer = 0;
    e.blinkFrame = 0;
    e.starLevel = 0;

    draft.spawnRot = (draft.spawnRot + 1) % 3;
    draft.enemiesLeft -= 1;
    draft.activeEnemyCount += 1;
    return;
  }
}

function tickEnemySpawn(draft: GameState): void {
  if (draft.enemiesLeft <= 0 || draft.activeEnemyCount >= MAX_ACTIVE_ENEMIES) return;
  if (draft.spawnDelay > 0) {
    draft.spawnDelay -= 1;
    return;
  }
  spawnEnemy(draft);
  draft.spawnDelay = spawnDelayBase(draft.stageIndex);
}

function tickTimers(draft: GameState): void {
  const e = draft.entities[0];
  if (e.shieldTimer > 0 && (draft.frame & 63) === 0) e.shieldTimer -= 1;
  if (draft.freezeTimer > 0 && (draft.frame & 63) === 0) draft.freezeTimer -= 1;

  if (draft.shovelTimer > 0 && (draft.frame & 15) === 0) {
    draft.shovelTimer -= 1;
    if (draft.shovelTimer === 0) applyEagleWall(draft.grid, draft.brickBits, false);
    else if (draft.shovelTimer < 4) applyEagleWall(draft.grid, draft.brickBits, !!((draft.frame >> 4) & 1));
  }

  if (draft.grenadeFlash > 0) draft.grenadeFlash -= 1;
  if (draft.eagleExpTimer > 0) draft.eagleExpTimer -= 1;

  for (const ent of draft.entities) {
    if (ent.spawnAnim > 0) ent.spawnAnim -= 1;
    if (ent.blinkFrame > 0) ent.blinkFrame -= 1;
    if (!ent.alive && ent.deathTimer > 0) ent.deathTimer -= 1;
  }

  if (draft.playerRespawnTimer > 0) {
    draft.playerRespawnTimer -= 1;
    if (draft.playerRespawnTimer === 0 && !draft.entities[0].alive && draft.lives >= 0) {
      spawnPlayer(draft);
    }
  }
}

function checkStageEnd(draft: GameState): void {
  if (!draft.eagleAlive && draft.eagleExpTimer <= 0) {
    if (draft.gameOverDelay <= 0) draft.gameOverDelay = 60;
  }

  if (
    draft.enemiesLeft <= 0 &&
    draft.activeEnemyCount <= 0 &&
    draft.entities.slice(1).every((e) => !e.alive && e.deathTimer <= 0)
  ) {
    if (draft.stageClearDelay <= 0) draft.stageClearDelay = 60;
  }

  if (draft.stageClearDelay > 0) {
    draft.stageClearDelay -= 1;
    if (draft.stageClearDelay === 0) {
      draft.phase = 'tally';
      draft.tallyFlash = 180;
    }
  }

  if (draft.gameOverDelay > 0) {
    draft.gameOverDelay -= 1;
    if (draft.gameOverDelay === 0) {
      draft.phase = 'gameover';
      draft.hiScore = Math.max(draft.hiScore, draft.score);
    }
  }
}

function handleMenu(draft: GameState): void {
  const startEdge = draft.input.start && !draft.input.startPrev;
  const selectEdge = draft.input.select && !draft.input.selectPrev;
  const fireEdge = draft.input.fire && !draft.input.firePrev;

  if (draft.phase === 'title') {
    if (startEdge || fireEdge) {
      draft.phase = 'select';
      draft.selectedStage = 0;
    }
    draft.input.startPrev = draft.input.start;
    draft.input.selectPrev = draft.input.select;
    draft.input.firePrev = draft.input.fire;
    return;
  }

  if (draft.phase === 'select') {
    if (startEdge) {
      draft.score = 0;
      draft.lives = INITIAL_LIVES;
      draft.nextLifeAt = LIFE_BONUS_SCORE;
      beginStage(draft, draft.selectedStage, true);
    } else if (fireEdge) {
      draft.selectedStage = (draft.selectedStage + 1) % MAX_STAGES;
    } else if (selectEdge) {
      draft.selectedStage = (draft.selectedStage + MAX_STAGES - 1) % MAX_STAGES;
    }
    draft.input.startPrev = draft.input.start;
    draft.input.selectPrev = draft.input.select;
    draft.input.firePrev = draft.input.fire;
    return;
  }

  if (draft.phase === 'paused') {
    if (startEdge) draft.phase = 'playing';
    draft.input.startPrev = draft.input.start;
    return;
  }

  if (draft.phase === 'playing') {
    if (startEdge) draft.phase = 'paused';
    draft.input.startPrev = draft.input.start;
    draft.input.selectPrev = draft.input.select;
    // firePrev updated in handleFire
    return;
  }

  if (draft.phase === 'tally') {
    draft.tallyFlash -= 1;
    if (draft.tallyFlash <= 0 || startEdge) {
      if (draft.stageIndex + 1 >= MAX_STAGES) {
        draft.phase = 'cleared';
        draft.hiScore = Math.max(draft.hiScore, draft.score);
      } else {
        beginStage(draft, draft.stageIndex + 1, true);
      }
    }
    draft.input.startPrev = draft.input.start;
    draft.input.firePrev = draft.input.fire;
    return;
  }

  if (draft.phase === 'gameover' || draft.phase === 'cleared') {
    if (startEdge || fireEdge) {
      const hi = Math.max(draft.hiScore, draft.score);
      assignTitle(draft, hi);
    } else {
      draft.input.startPrev = draft.input.start;
      draft.input.firePrev = draft.input.fire;
    }
  }
}

function assignTitle(draft: GameState, hi: number): void {
  const next = makeTitleState(hi, draft.rngSeed);
  Object.assign(draft, next);
  draft.grid = next.grid.map((r) => r.slice());
  draft.brickBits = next.brickBits.map((r) => r.slice());
  draft.entities = next.entities.map((e) => ({ ...e }));
  draft.bullets = next.bullets.map((b) => ({ ...b }));
  draft.input = { ...draft.input, startPrev: true, firePrev: true };
}

/** One fixed 1/60s simulation tick. */
export function tick(draft: GameState): void {
  handleMenu(draft);
  if (draft.phase !== 'playing') return;

  draft.frame += 1;
  moveEntities(draft);
  handleFire(draft);
  moveBullets(draft);
  bulletBulletCancel(draft);
  bulletEntityCollision(draft);
  checkPowerUp(draft);
  tickEnemySpawn(draft);
  tickTimers(draft);
  checkStageEnd(draft);
}
