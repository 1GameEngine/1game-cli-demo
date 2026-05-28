import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const replay = join(root, 'out/snake-score5-replay.html');

mkdirSync(join(root, 'out/record'), { recursive: true });
copyFileSync(replay, join(root, 'out/record/index.html'));
copyFileSync(replay, join(root, 'out/replay.html'));

console.log('[deploy] copied game record replay to /record/ and /replay.html');
