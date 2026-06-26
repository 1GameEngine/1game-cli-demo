#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const usage =
  'Usage: node keypress-arrow.mjs <code> <sceneStableUid> [outPath]\n' +
  'Example: node keypress-arrow.mjs ArrowLeft scene-123 out/keypress-left.events.json\n' +
  'Note: sceneStableUid 是 render/hit 返回的 stableUid，不是 scene name。';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(usage);
  process.exit(0);
}

const code = process.argv[2];
const sceneStableUid = process.argv[3];
const outPath = process.argv[4] ?? 'out/keypress.events.json';
const sceneStableUidLooksLikePath =
  typeof sceneStableUid === 'string' && (sceneStableUid.includes('/') || sceneStableUid.endsWith('.json'));

if (!code || !sceneStableUid || sceneStableUidLooksLikePath) {
  console.error('[keypress-arrow] 缺少必要参数：<code> <sceneStableUid>');
  if (sceneStableUidLooksLikePath) {
    console.error('[keypress-arrow] 检测到第二个参数像输出路径；请按新顺序传参，并显式提供 sceneStableUid。');
  }
  console.error('[keypress-arrow] 请先通过 `1gameplay frame query --select render` 或 `hit` 获取真实 sceneStableUid。');
  console.error(usage);
  process.exit(1);
}

const payload = [
  {
    type: 'keypress',
    sceneStableUid,
    data: { code, time: 1000 },
  },
];

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf-8');
console.log(`[keypress-arrow] 已写入 ${outPath}（sceneStableUid=${sceneStableUid}, code=${code}）`);
