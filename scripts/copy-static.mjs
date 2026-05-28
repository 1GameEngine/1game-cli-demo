import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = join(ROOT, 'public');
const OUT_DIR = join(ROOT, 'out');

if (!existsSync(PUBLIC_DIR)) {
  console.log('[copy-static] no public/ directory, skip');
  process.exit(0);
}

mkdirSync(OUT_DIR, { recursive: true });

for (const name of readdirSync(PUBLIC_DIR)) {
  cpSync(join(PUBLIC_DIR, name), join(OUT_DIR, name), { force: true });
  console.log(`[copy-static] public/${name} -> out/${name}`);
}
