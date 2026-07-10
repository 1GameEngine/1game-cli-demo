#!/usr/bin/env node
/**
 * Extract Magic Tower 21 data from the reference .1game zip / extracted folder.
 * Usage: node scripts/extract-mota-data.mjs [path-to-extracted-or-zip]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const defaultSrc = '/tmp/mota-ref/mota-extracted';
const arg = process.argv[2];
let srcRoot = arg || defaultSrc;

if (arg && arg.endsWith('.1game')) {
  const out = '/tmp/mota-ref/mota-extracted';
  fs.mkdirSync(out, { recursive: true });
  execSync(`unzip -o ${JSON.stringify(arg)} -d ${JSON.stringify(out)}`, { stdio: 'inherit' });
  srcRoot = out;
}

const scenePath = path.join(srcRoot, 'scene/sid_0su65hm1/data.json');
if (!fs.existsSync(scenePath)) {
  console.error('Missing scene data:', scenePath);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(scenePath, 'utf8'));
const byName = Object.fromEntries(data.nodes.map((n) => [n.name, n]));
const CELL = 50;

const MONSTER_ID = {
  '敌人-绿史莱姆': 'greenSlime',
  '敌人-红史莱姆': 'redSlime',
  '敌人-黑史莱姆': 'blackSlime',
  '敌人-史莱姆王': 'slimeKing',
  '敌人-小蝙蝠': 'bat',
  '敌人-大蝙蝠': 'bigBat',
  '敌人-红蝙蝠': 'redBat',
  '敌人-骷髅人': 'skeleton',
  '敌人-骷髅士兵': 'skeletonSoldier',
  '敌人-骷髅队长': 'skeletonCaptain',
  '敌人-初级卫兵': 'guard',
  '敌人-中级卫兵': 'midGuard',
  '敌人-高级卫兵': 'highGuard',
  '敌人-初级法师': 'mage',
  '敌人-高级法师': 'highMage',
  '敌人-麻衣发誓': 'yellowMage',
  '敌人-红衣法师': 'redMage',
  '敌人-灵法师': 'spiritMage',
  '敌人-兽面人': 'beast',
  '敌人-兽面武士': 'beastWarrior',
  '敌人-石头人': 'stoneMan',
  '敌人-双手剑士': 'swordsman',
  '敌人-士兵': 'soldier',
  '敌人-金卫兵': 'goldGuard',
  '敌人-金队长': 'goldCaptain',
  '敌人-白衣武士': 'whiteWarrior',
  '敌人-灵武士': 'spiritWarrior',
  '敌人-冥战士': 'darkWarrior',
  '敌人-冥队长': 'darkCaptain',
  '敌人-影子战士': 'shadowWarrior',
  '敌人-魔龙': 'dragon',
  '敌人-血影': 'bloodShadow',
  '敌人-红衣魔王': 'redBoss',
  '敌人-冥灵魔王': 'finalBoss',
};

const ITEM_ID = {
  '道具-黄钥匙': 'yellowKey',
  '道具-蓝钥匙': 'blueKey',
  '道具-红钥匙': 'redKey',
  '道具-钥匙盒': 'keyBox',
  '道具-红血瓶': 'redPotion',
  '道具-蓝血瓶': 'bluePotion',
  '道具-红宝石': 'redGem',
  '道具-蓝宝石': 'blueGem',
  '道具-铁剑': 'ironSword',
  '道具-银剑': 'silverSword',
  '道具-青峰剑': 'steelSword',
  '道具-圣剑': 'holySword',
  '道具-星光神剑': 'starSword',
  '道具-铁盾': 'ironShield',
  '道具-银盾': 'silverShield',
  '道具-骑士盾': 'knightShield',
  '道具-圣盾': 'holyShield',
  '道具-神圣盾': 'divineShield',
  '道具-小飞羽': 'smallWing',
  '道具-大飞羽': 'bigWing',
  '道具-钱袋': 'coinBag',
  '道具-圣光徽': 'monsterBook',
  '道具-楼层传送器': 'floorTeleporter',
  '道具-十字架': 'cross',
  '道具-圣水': 'holyWater',
};

const TILE_ID = {
  墙3: 'wall',
  墙2: 'wallAlt',
  墙1: 'wall1',
  墙4: 'wall4',
  星星: 'star',
  铁栅栏: 'ironFence',
  剧情门: 'storyDoor',
  '水面-岩浆': 'lava',
  '水面-深蓝': 'water',
  '水面-浅蓝': 'waterLight',
  '钥匙门-黄': 'yellowDoor',
  '钥匙门-蓝': 'blueDoor',
  '钥匙门-红': 'redDoor',
  '钥匙门-绿': 'greenDoor',
  '楼梯-上楼': 'stairUp',
  '楼梯-下楼': 'stairDown',
  '地面-水泥': 'floor',
  '地面-瓷砖': 'tileFloor',
  '地面-草地': 'grass',
  '地面-石头路': 'stonePath',
};

const NPC_ID = {
  'NPC-仙子': 'fairy',
  'NPC-二层商人': 'merchantF2',
  'NPC-二层老人': 'elderF2',
  'NPC-金币商店(3层)': 'goldShopF3',
  'NPC-金币商店（11层）': 'goldShopF11',
  'NPC-小偷杰克': 'thief',
  'NPC-钥匙商人(5层)': 'keyShopF5',
  'NPC-钥匙商人(12层)': 'keyShopF12',
  'NPC-经验老人(5层)': 'expElderF5',
  'NPC-经验老人(13层)': 'expElderF13',
  'NPC-15层老人': 'elderF15',
  'NPC-15层商人': 'merchantF15',
  'NPC-公主': 'princess',
  'NPC-红商店': 'redShop',
};

function attr(node, key) {
  const v = node?.attrs?.[key];
  return v && typeof v === 'object' && 'value' in v ? v.value : v;
}

function customAttrs(node) {
  const out = {};
  for (const [k, v] of Object.entries(node.attrs || {})) {
    if (!k.startsWith('custom.')) continue;
    out[k.slice('custom.'.length)] = typeof v === 'object' && v && 'value' in v ? v.value : v;
  }
  return out;
}

function parseRefName(name) {
  if (!name) return { kind: 'unknown', raw: '' };
  const m = name.match(/^节点\((.+)\)的引用$/);
  if (m) return { kind: 'ref', raw: m[1] };
  return { kind: 'own', raw: name };
}

function mapEntity(raw) {
  if (!raw) return null;
  if (raw.startsWith('上楼后位置') || raw.startsWith('下楼后位置')) return null;

  // Special / story entities first (names often have floor prefixes)
  if (raw.includes('碰见魔王前对话')) {
    return { type: 'trigger', id: raw.includes('16') ? 'bossTalk16' : 'bossTalk19', raw };
  }
  if (raw.includes('第二层') && raw.includes('剧情门')) {
    return { type: 'tile', id: 'storyDoor', raw, special: 'f2StoryDoor' };
  }
  if (raw.includes('21层') && raw.includes('剧情门')) {
    return { type: 'tile', id: 'storyDoor', raw, special: 'f21StoryDoor' };
  }
  if (raw.includes('18层公主前道路') || (raw.includes('公主前') && raw.includes('星星'))) {
    return { type: 'tile', id: 'star', raw, special: 'princessPath' };
  }
  if (raw.includes('20层') && raw.includes('楼梯')) {
    return { type: 'tile', id: 'stairUp', raw, special: 'hiddenStair20' };
  }
  if (raw.includes('18层') && raw.includes('楼梯')) {
    return { type: 'tile', id: 'stairUp', raw, special: 'hiddenStair18' };
  }
  if (raw.includes('16层') && raw.includes('红衣魔王')) {
    return { type: 'monster', id: 'redBoss', raw, special: 'f16Boss' };
  }
  if (raw.includes('19层') && raw.includes('冥灵魔王')) {
    return { type: 'monster', id: 'finalBoss', raw, special: 'f19Boss' };
  }
  if (raw.includes('21层') && raw.includes('冥灵魔王')) {
    return { type: 'monster', id: 'finalBoss', raw, special: 'f21Boss' };
  }

  if (MONSTER_ID[raw]) return { type: 'monster', id: MONSTER_ID[raw], raw };
  if (ITEM_ID[raw]) return { type: 'item', id: ITEM_ID[raw], raw };
  if (TILE_ID[raw]) return { type: 'tile', id: TILE_ID[raw], raw };
  if (NPC_ID[raw]) return { type: 'npc', id: NPC_ID[raw], raw };
  if (raw.includes('剧情门')) return { type: 'tile', id: 'storyDoor', raw };
  if (raw.includes('敌人-红衣魔王')) return { type: 'monster', id: 'redBoss', raw };
  if (raw.includes('敌人-冥灵魔王')) return { type: 'monster', id: 'finalBoss', raw };
  if (raw.includes('楼梯-上楼')) return { type: 'tile', id: 'stairUp', raw };
  if (raw.includes('楼梯-下楼')) return { type: 'tile', id: 'stairDown', raw };
  if (raw.includes('星星')) return { type: 'tile', id: 'star', raw };
  if (raw.trim() === '') return null;
  return { type: 'unknown', id: raw, raw };
}

// --- monsters ---
const monsters = {};
for (const child of byName['所有怪物'].childNodes || []) {
  const name = child.name;
  if (!name || !name.startsWith('敌人-')) continue;
  const id = MONSTER_ID[name];
  if (!id) {
    console.warn('Unmapped monster', name);
    continue;
  }
  const c = customAttrs(child);
  monsters[id] = {
    id,
    name: name.replace('敌人-', ''),
    hp: Number(c['生命值'] ?? 0),
    atk: Number(c['攻击力'] ?? 0),
    def: Number(c['防御力'] ?? 0),
    gold: Number(c['掉落金币'] ?? 0),
    exp: Number(c['掉落经验'] ?? 0),
    magicAtk: Number(c['魔法攻击力'] ?? 0),
    preDamage: Number(c['战斗开始前伤害'] ?? 0),
    lifeSteal: Number(c['战斗开始吸血比例'] ?? 0),
    imageId: attr(child, 'imageId') || null,
    imageCutArea: attr(child, 'imageCutArea') || null,
  };
}

// --- items ---
const items = {};
for (const child of byName['所有道具'].childNodes || []) {
  const name = child.name;
  if (!name || !name.startsWith('道具-')) continue;
  const id = ITEM_ID[name];
  if (!id) {
    console.warn('Unmapped item', name);
    continue;
  }
  const c = customAttrs(child);
  items[id] = {
    id,
    name: name.replace('道具-', ''),
    hp: Number(c['获得生命值'] ?? 0),
    atk: Number(c['获得攻击力'] ?? 0),
    def: Number(c['获得防御力'] ?? 0),
    gold: Number(c['获得金币'] ?? 0),
    exp: Number(c['获得经验'] ?? 0),
    level: Number(c['获得等级'] ?? 0),
    yellowKey: Number(c['获得黄钥匙'] ?? 0),
    blueKey: Number(c['获得蓝钥匙'] ?? 0),
    redKey: Number(c['获得红钥匙'] ?? 0),
    imageId: attr(child, 'imageId') || null,
    imageCutArea: attr(child, 'imageCutArea') || null,
  };
}

// special item overrides from research
items.holyWater = items.holyWater || {
  id: 'holyWater',
  name: '圣水',
  hp: 0,
  atk: 0,
  def: 0,
  gold: 0,
  exp: 0,
  level: 0,
  yellowKey: 0,
  blueKey: 0,
  redKey: 0,
  special: 'doubleHp',
};
if (items.holyWater) items.holyWater.special = 'doubleHp';
if (items.monsterBook) items.monsterBook.special = 'monsterBook';
if (items.floorTeleporter) items.floorTeleporter.special = 'floorTeleporter';
if (items.cross) items.cross.special = 'cross';

// --- floors ---
const floors = [];
for (let fi = 0; fi <= 21; fi += 1) {
  const floorNode = byName[`楼层${fi}节点组`];
  if (!floorNode) throw new Error(`missing floor ${fi}`);
  const entities = [];
  let spawnUp = null;
  let spawnDown = null;
  let idx = 0;
  for (const n of floorNode.childNodes || []) {
    const name = n.name || '';
    const x = attr(n, 'x');
    const y = attr(n, 'y');
    if (x == null || y == null) continue;
    const gx = Math.round(Number(x) / CELL);
    const gy = Math.round(Number(y) / CELL);
    const { raw } = parseRefName(name);
    const label = raw || name;
    if (label.startsWith('上楼后位置')) {
      spawnUp = { x: gx, y: gy };
      continue;
    }
    if (label.startsWith('下楼后位置')) {
      spawnDown = { x: gx, y: gy };
      continue;
    }
    const mapped = mapEntity(label);
    if (!mapped || mapped.type === 'unknown') {
      if (mapped?.type === 'unknown') console.warn(`F${fi} unknown`, label);
      continue;
    }
    const uid = `f${fi}_${mapped.type}_${mapped.id}_${gx}_${gy}_${idx++}`;
    const ent = {
      uid,
      x: gx,
      y: gy,
      type: mapped.type,
      id: mapped.id,
    };
    if (mapped.special) ent.special = mapped.special;
    // hidden stairs start hidden
    if (mapped.special === 'hiddenStair18' || mapped.special === 'hiddenStair20') {
      ent.hidden = true;
    }
    // F21 boss override stats applied at runtime
    if (mapped.special === 'f21Boss') {
      ent.statOverride = { hp: 45000, atk: 2550, def: 2250, gold: 312, exp: 275 };
    }
    entities.push(ent);
  }
  floors.push({
    floor: fi,
    spawnUp,
    spawnDown,
    entities,
  });
}

// --- decode assets ---
const resDir = path.join(srcRoot, 'resources');
const assetsDir = path.join(root, 'src/assets');
fs.mkdirSync(assetsDir, { recursive: true });
const assetMap = {};
for (const file of fs.readdirSync(resDir)) {
  if (!file.endsWith('.image')) continue;
  const raw = fs.readFileSync(path.join(resDir, file));
  const text = raw.toString('utf8');
  const m = text.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/s);
  if (!m) {
    console.warn('skip asset', file);
    continue;
  }
  const ext = m[1] === 'png' ? 'png' : 'jpg';
  const metaPath = path.join(resDir, `${file}.meta`);
  let meta = {};
  if (fs.existsSync(metaPath)) meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const base = (meta.fileName || file).replace(/\.(png|jpg|jpeg)$/i, '');
  const safe = `${file.replace(/\.image$/, '')}.${ext}`;
  fs.writeFileSync(path.join(assetsDir, safe), Buffer.from(m[2], 'base64'));
  assetMap[file] = {
    file: safe,
    width: meta.imageWidth,
    height: meta.imageHeight,
    fileName: meta.fileName || null,
  };
}

// write TS modules
const dataDir = path.join(root, 'src/data');
fs.mkdirSync(dataDir, { recursive: true });

function writeTs(file, header, body) {
  fs.writeFileSync(path.join(dataDir, file), `${header}\n${body}\n`);
}

writeTs(
  'monsters.ts',
  `export type MonsterDef = {
  id: string;
  name: string;
  hp: number;
  atk: number;
  def: number;
  gold: number;
  exp: number;
  magicAtk: number;
  preDamage: number;
  lifeSteal: number;
  imageId: string | null;
  imageCutArea: string | null;
};

export const MONSTERS: Record<string, MonsterDef> = `,
  `${JSON.stringify(monsters, null, 2)} as const;`,
);

writeTs(
  'items.ts',
  `export type ItemDef = {
  id: string;
  name: string;
  hp: number;
  atk: number;
  def: number;
  gold: number;
  exp: number;
  level: number;
  yellowKey: number;
  blueKey: number;
  redKey: number;
  imageId?: string | null;
  imageCutArea?: string | null;
  special?: string;
};

export const ITEMS: Record<string, ItemDef> = `,
  `${JSON.stringify(items, null, 2)} as const;`,
);

writeTs(
  'floors.ts',
  `export type EntityType = 'monster' | 'item' | 'tile' | 'npc' | 'trigger';

export type FloorEntity = {
  uid: string;
  x: number;
  y: number;
  type: EntityType;
  id: string;
  special?: string;
  hidden?: boolean;
  statOverride?: { hp: number; atk: number; def: number; gold: number; exp: number };
};

export type FloorDef = {
  floor: number;
  spawnUp: { x: number; y: number } | null;
  spawnDown: { x: number; y: number } | null;
  entities: FloorEntity[];
};

export const FLOORS: FloorDef[] = `,
  `${JSON.stringify(floors, null, 2)};`,
);

writeTs(
  'asset-map.ts',
  `export const ASSET_MAP: Record<string, { file: string; width?: number; height?: number; fileName?: string | null }> = `,
  `${JSON.stringify(assetMap, null, 2)};`,
);

const summary = floors.map((f) => ({
  floor: f.floor,
  count: f.entities.length,
  spawnUp: f.spawnUp,
  spawnDown: f.spawnDown,
}));
console.log(JSON.stringify({ monsters: Object.keys(monsters).length, items: Object.keys(items).length, floors: summary, assets: Object.keys(assetMap).length }, null, 2));
console.log('Wrote src/data/{monsters,items,floors,asset-map}.ts and src/assets/*');
