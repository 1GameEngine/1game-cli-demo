#!/usr/bin/env node
/** 生成 Vercel 静态站点入口：游戏 + 1gameplay 回放 */
import { copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'out');

execSync('pnpm build && pnpm run build:single', { cwd: root, stdio: 'inherit' });

if (!existsSync(join(out, 'debug.1gamerecord'))) {
  execSync('pnpm run gameplay:create', { cwd: root, stdio: 'inherit' });
  const clicks = [
    { x: 31, y: 163 },
    { x: 94, y: 94 },
    { x: 327, y: 163 },
  ];
  for (const { x, y } of clicks) {
    const ev = JSON.stringify({ type: 'click', sceneId: 'main', data: { x, y } });
    execSync(`pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --event '${ev}'`, {
      cwd: root,
      stdio: 'inherit',
    });
  }
}

execSync(
  'pnpm exec 1gameplay bundle-player-html out/debug.1gamerecord --out out/replay.html --single-html --title "扫雷 1gameplay 调试回放"',
  { cwd: root, stdio: 'inherit' },
);

copyFileSync(join(out, 'index.html'), join(out, 'game.html'));

const landing = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>触屏扫雷 · 1Game Demo</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: system-ui, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    main { max-width: 420px; width: 100%; }
    h1 { font-size: 1.5rem; margin: 0 0 8px; }
    p { color: #94a3b8; margin: 0 0 24px; line-height: 1.5; font-size: 0.95rem; }
    a {
      display: block;
      padding: 14px 18px;
      margin-bottom: 12px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      text-align: center;
    }
    .primary { background: #2563eb; color: #fff; }
    .secondary { background: #334155; color: #fff; }
    .meta { margin-top: 20px; font-size: 0.8rem; color: #64748b; }
  </style>
</head>
<body>
  <main>
    <h1>触屏扫雷</h1>
    <p>1Game 竖屏 demo。下方可打开可玩版本，或查看 1gameplay 调试回放（首击 + 插旗流程录制）。</p>
    <a class="primary" href="./game.html">开始游戏</a>
    <a class="secondary" href="./replay.html">1gameplay 调试回放</a>
    <p class="meta">构建：@1game/engine-bundle · 回放：debug.1gamerecord（首击、插旗、标记格子）</p>
  </main>
</body>
</html>
`;

writeFileSync(join(out, 'index.html'), landing, 'utf8');
console.log('[prepare-deploy] out/index.html (landing), game.html, replay.html ready');
