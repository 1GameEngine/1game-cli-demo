import type { ImageSource } from '@1game/engine-bundle/runtime/worker';
import { FX, FY, META, Tile } from '../data/constants';
import { Sprites } from './sprites';

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}

async function loadBmp(src: { dataUrl: string }): Promise<ImageBitmap> {
  const res = await fetch(src.dataUrl);
  const blob = await res.blob();
  return createImageBitmap(blob);
}

export async function bakeMapImage(grid: number[][], brickBits: number[][]): Promise<ImageSource> {
  const w = 13 * META;
  const h = 13 * META;
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');

  const [brick, steel, water, forest, ice] = await Promise.all([
    loadBmp(Sprites.tileBrick as { dataUrl: string }),
    loadBmp(Sprites.tileSteel as { dataUrl: string }),
    loadBmp(Sprites.tileWater as { dataUrl: string }),
    loadBmp(Sprites.tileForest as { dataUrl: string }),
    loadBmp(Sprites.tileIce as { dataUrl: string }),
  ]);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);

  for (let r = 0; r < 13; r += 1) {
    for (let c = 0; c < 13; c += 1) {
      const t = grid[r]![c]!;
      const x = c * META;
      const y = r * META;
      if (t === Tile.EMPTY || t >= 13) continue;
      if (t === Tile.WATER) {
        ctx.drawImage(water, x, y, META, META);
        continue;
      }
      if (t === Tile.ICE) {
        ctx.drawImage(ice, x, y, META, META);
        continue;
      }
      if (t === Tile.FOREST) {
        ctx.drawImage(forest, x, y, META, META);
        continue;
      }
      if (t === Tile.STEEL || (t >= Tile.PS0 && t <= Tile.PS3)) {
        ctx.drawImage(steel, x, y, META, META);
        continue;
      }
      if (t === Tile.BRICK || (t >= Tile.PB0 && t <= Tile.PB3)) {
        const bits = brickBits[r]![c]!;
        if (bits === 0) continue;
        if (bits === 0b1111) {
          ctx.drawImage(brick, x, y, META, META);
        } else {
          // draw full then clear missing quads
          ctx.drawImage(brick, x, y, META, META);
          for (let q = 0; q < 4; q += 1) {
            if (!(bits & (1 << q))) {
              ctx.clearRect(x + (q & 1) * 8, y + (q >> 1) * 8, 8, 8);
            }
          }
        }
      }
    }
  }

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  const buf = new Uint8Array(await blob.arrayBuffer());
  const dataUrl = `data:image/png;base64,${toBase64(buf)}`;
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  const hash = hashArr
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);

  return {
    kind: 'image',
    type: 'inline',
    dataUrl,
    mime: 'image/png',
    hash,
    width: w,
    height: h,
  };
}

export const MAP_ORIGIN = { x: FX, y: FY, w: 13 * META, h: 13 * META };
