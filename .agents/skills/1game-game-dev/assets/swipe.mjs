#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const sceneStableUidRaw = process.argv[2];
if (typeof sceneStableUidRaw !== 'string' || sceneStableUidRaw.trim().length === 0) {
  console.error('[swipe] 缺少 sceneStableUid。用法：node swipe.mjs <sceneStableUid> [startX] [startY] [endX] [endY] [outPath]');
  process.exit(1);
}
const sceneStableUid = sceneStableUidRaw.trim();
const startX = Number(process.argv[3] ?? 144);
const startY = Number(process.argv[4] ?? 220);
const endX = Number(process.argv[5] ?? 144);
const endY = Number(process.argv[6] ?? 170);
const outPath = process.argv[7] ?? 'out/swipe.events.json';

if (![startX, startY, endX, endY].every(Number.isFinite)) {
  throw new Error('[swipe] 起点/终点坐标必须是有限数字');
}

const payload = [
  {
    type: 'pointer.down',
    sceneStableUid,
    data: { id: 1, x: startX, y: startY, time: 1000 },
  },
  {
    type: 'pointer.move',
    sceneStableUid,
    data: { id: 1, x: endX, y: endY, time: 1016 },
  },
  {
    type: 'pointer.up',
    sceneStableUid,
    data: { id: 1, x: endX, y: endY, time: 1032 },
  },
];

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf-8');
console.log(`[swipe] 已写入 ${outPath}（${sceneStableUid}: ${startX},${startY} -> ${endX},${endY}）`);
