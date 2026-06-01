#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const code = process.argv[2] ?? 'ArrowLeft';
const outPath = process.argv[3] ?? 'out/keypress.events.json';

const payload = [
  {
    type: 'keypress',
    sceneId: 'main',
    data: { code, time: 1000 },
  },
];

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf-8');
console.log(`[keypress-arrow] wrote ${outPath} (code=${code})`);
