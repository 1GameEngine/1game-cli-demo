import sharp from 'sharp';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const dir = join(dirname(fileURLToPath(import.meta.url)), '../src/assets');
for (const f of readdirSync(dir).filter((x) => x.endsWith('.svg'))) {
  await sharp(join(dir, f), { density: 192 }).png().toFile(join(dir, f.replace(/\.svg$/, '.png')));
}
console.log('rasterized ok');
