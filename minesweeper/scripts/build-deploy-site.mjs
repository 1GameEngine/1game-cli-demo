#!/usr/bin/env node
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'out');

const REPLAYS = [
  { file: 'replay-autotest.html', title: '自动化测试全流程', desc: '开局、插旗、重开、踩雷、遮罩重开等 1gameplay 脚本覆盖路径' },
  { file: 'replay-win.html', title: '胜利流程', desc: '自动翻开全部安全格直至 phase=won' },
  { file: 'replay-overlay.html', title: '遮罩重开验证', desc: '失败后点击结算遮罩重新开始' },
  { file: 'replay-debug.html', title: '基础调试', desc: '首次点击开局与空白区展开' },
];

if (!existsSync(join(OUT, 'index.html'))) {
  console.error('[deploy] run npm run build first');
  process.exit(1);
}

// 保留可玩的构建产物（与 worker 同目录，相对路径不变）
copyFileSync(join(OUT, 'index.html'), join(OUT, 'play.html'));

// 单文件版（若存在则一并提供）
const singlePath = join(OUT, 'play-single.html');
if (!existsSync(singlePath)) {
  // build:single 输出仍叫 index.html，此处仅在使用前手动生成时跳过
}

let playSingleLink = '';
if (existsSync(join(OUT, 'play-single.html'))) {
  playSingleLink = '<li><a href="./play-single.html">单文件版游戏</a></li>';
}

const missing = REPLAYS.filter((r) => !existsSync(join(OUT, r.file)));
if (missing.length) {
  console.warn('[deploy] missing replays (run gameplay:replay:* scripts):', missing.map((m) => m.file).join(', '));
}

const replayCards = REPLAYS.filter((r) => existsSync(join(OUT, r.file)))
  .map(
    (r) => `
    <article class="card">
      <h2><a href="./${r.file}">${r.title}</a></h2>
      <p>${r.desc}</p>
      <a class="btn" href="./${r.file}">观看录播</a>
    </article>`,
  )
  .join('\n');

const hub = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>扫雷 · 游戏与 1gameplay 调试录播</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; background: #111827; color: #f9fafb; line-height: 1.5; }
    h1 { margin: 0 0 8px; font-size: 1.5rem; }
    .sub { color: #9ca3af; margin-bottom: 24px; }
    .section { margin-bottom: 32px; }
    .cards { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
    .card { background: #1f2937; border-radius: 12px; padding: 16px; border: 1px solid #374151; }
    .card h2 { margin: 0 0 8px; font-size: 1.1rem; }
    .card h2 a { color: #93c5fd; text-decoration: none; }
    .card p { margin: 0 0 12px; color: #d1d5db; font-size: 0.9rem; }
    .btn { display: inline-block; background: #2563eb; color: #fff; padding: 8px 14px; border-radius: 8px; text-decoration: none; font-size: 0.9rem; }
    .btn.primary { background: #059669; font-size: 1rem; padding: 10px 18px; }
    ul.links { padding-left: 1.2rem; }
    ul.links a { color: #93c5fd; }
  </style>
</head>
<body>
  <h1>触屏扫雷 · 1Game</h1>
  <p class="sub">游戏构建产物与 <code>1gameplay</code> 调试运行录播（Vercel 静态部署）</p>

  <section class="section">
    <a class="btn primary" href="./play.html">开始游戏</a>
    <ul class="links">
      ${playSingleLink}
    </ul>
  </section>

  <section class="section">
    <h2 style="font-size:1.2rem;margin-bottom:12px;">调试录播</h2>
    <div class="cards">
      ${replayCards || '<p>暂无录播文件，请在本地执行 npm run build:deploy</p>'}
    </div>
  </section>
</body>
</html>
`;

writeFileSync(join(OUT, 'index.html'), hub, 'utf-8');
console.log('[deploy] hub -> out/index.html, game -> out/play.html');
