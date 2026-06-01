#!/usr/bin/env node
/**
 * 生成 Vercel 静态部署目录：可玩版本 + 1gameplay 调试回放页
 */
import { execSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outDir = join(root, 'out');
const playDir = join(outDir, 'play');
const replayDir = join(outDir, 'replay');

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

function bundleRecord(recordPath, htmlPath, title) {
  run(
    `npx 1gameplay bundle-player-html "${recordPath}" --out "${htmlPath}" --single-html --title "${title}"`,
  );
}

console.log('[deploy] building game…');
run('npm run build');

mkdirSync(playDir, { recursive: true });
mkdirSync(replayDir, { recursive: true });
for (const file of ['index.html', 'game.worker.js', 'worker-bootstrap.js']) {
  copyFileSync(join(outDir, file), join(playDir, file));
}

const hubHtml = readFileSync(join(root, 'scripts/deploy-hub.html'), 'utf8');
writeFileSync(join(outDir, 'index.html'), hubHtml);

const scenarios = [
  {
    name: 'debug',
    title: '调试-无操作撞墙',
    async prepare() {
      run(`npx 1gameplay create --entry src/game.tsx --out ${join(outDir, 'debug.1gamerecord')}`);
      run(`npx 1gameplay step ${join(outDir, 'debug.1gamerecord')} --ms 130 --repeat 12`);
    },
  },
  {
    name: 'eat',
    title: '调试-键盘吃食物',
    async prepare() {
      run(`npx 1gameplay create --entry src/game.tsx --out ${join(outDir, 'eat.1gamerecord')}`);
      for (let i = 0; i < 5; i++) {
        run(
          `npx 1gameplay step ${join(outDir, 'eat.1gamerecord')} --ms 130 --event "{\\"type\\":\\"keypress\\",\\"sceneId\\":\\"main\\",\\"data\\":{\\"code\\":\\"ArrowUp\\"}}"`,
        );
      }
      for (let i = 0; i < 7; i++) {
        run(
          `npx 1gameplay step ${join(outDir, 'eat.1gamerecord')} --ms 130 --event "{\\"type\\":\\"keypress\\",\\"sceneId\\":\\"main\\",\\"data\\":{\\"code\\":\\"ArrowRight\\"}}"`,
        );
      }
      for (let i = 0; i < 13; i++) {
        run(
          `npx 1gameplay step ${join(outDir, 'eat.1gamerecord')} --ms 130 --event "{\\"type\\":\\"keypress\\",\\"sceneId\\":\\"main\\",\\"data\\":{\\"code\\":\\"ArrowDown\\"}}"`,
        );
      }
    },
  },
  {
    name: 'swipe-eat',
    title: '调试-滑动吃食物',
    async prepare() {
      run(`npx 1gameplay create --entry src/game.tsx --out ${join(outDir, 'swipe-eat.1gamerecord')}`);
      const swipe = (id, sx, sy, ex, ey) =>
        `npx 1gameplay step ${join(outDir, 'swipe-eat.1gamerecord')} --ms 130` +
        ` --event "{\\"type\\":\\"pointer.down\\",\\"sceneId\\":\\"main\\",\\"data\\":{\\\"id\\\":${id},\\\"x\\\":${sx},\\\"y\\\":${sy}}}"` +
        ` --event "{\\"type\\":\\"pointer.move\\",\\"sceneId\\":\\"main\\",\\"data\\":{\\\"id\\\":${id},\\\"x\\\":${ex},\\\"y\\\":${ey}}}"` +
        ` --event "{\\"type\\":\\"pointer.up\\",\\"sceneId\\":\\"main\\",\\"data\\":{\\\"id\\\":${id},\\\"x\\\":${ex},\\\"y\\\":${ey}}}"`;
      for (let i = 1; i <= 5; i++) run(swipe(i, 144, 220, 144, 170));
      for (let i = 6; i <= 12; i++) run(swipe(i, 144, 170, 200, 170));
      for (let i = 13; i <= 25; i++) run(swipe(i, 200, 170, 200, 250));
    },
  },
  {
    name: 'test',
    title: '调试-得分与重启',
    async prepare() {
      run(`npx 1gameplay create --entry src/game.tsx --out ${join(outDir, 'test.1gamerecord')}`);
      for (let i = 0; i < 5; i++) {
        run(
          `npx 1gameplay step ${join(outDir, 'test.1gamerecord')} --ms 130 --event "{\\"type\\":\\"keypress\\",\\"sceneId\\":\\"main\\",\\"data\\":{\\"code\\":\\"ArrowUp\\"}}"`,
        );
      }
      for (let i = 0; i < 7; i++) {
        run(
          `npx 1gameplay step ${join(outDir, 'test.1gamerecord')} --ms 130 --event "{\\"type\\":\\"keypress\\",\\"sceneId\\":\\"main\\",\\"data\\":{\\"code\\":\\"ArrowRight\\"}}"`,
        );
      }
      for (let i = 0; i < 13; i++) {
        run(
          `npx 1gameplay step ${join(outDir, 'test.1gamerecord')} --ms 130 --event "{\\"type\\":\\"keypress\\",\\"sceneId\\":\\"main\\",\\"data\\":{\\"code\\":\\"ArrowDown\\"}}"`,
        );
      }
      for (let i = 0; i < 5; i++) {
        run(
          `npx 1gameplay step ${join(outDir, 'test.1gamerecord')} --ms 130 --event "{\\"type\\":\\"keypress\\",\\"sceneId\\":\\"main\\",\\"data\\":{\\"code\\":\\"ArrowDown\\"}}"`,
        );
      }
      run(
        `npx 1gameplay step ${join(outDir, 'test.1gamerecord')} --ms 130 --event "{\\"type\\":\\"click\\",\\"sceneId\\":\\"main\\",\\"data\\":{\\"x\\":144,\\"y\\":220}}"`,
      );
    },
  },
];

console.log('[deploy] generating 1gameplay replay pages…');
for (const scenario of scenarios) {
  const recordPath = join(outDir, `${scenario.name}.1gamerecord`);
  const htmlPath = join(replayDir, `${scenario.name}.html`);
  console.log(`[deploy] · ${scenario.name}`);
  await scenario.prepare();
  bundleRecord(recordPath, htmlPath, scenario.title);
}

console.log('[deploy] done → out/ (index + play/ + replay/)');
