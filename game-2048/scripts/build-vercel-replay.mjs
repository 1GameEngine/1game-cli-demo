#!/usr/bin/env node
/**
 * 将 out/*.1gamerecord 调试记录打包到 vercel-replay/ 供静态部署
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, 'out');
const deployDir = path.join(root, 'vercel-replay');

const REPLAYS = [
  { file: 'debug.1gamerecord', title: '自动化调试（合并 + 模拟 80 步）', slug: 'debug' },
  { file: 'until-lost.1gamerecord', title: '玩到 Game Over（200 次方向键）', slug: 'until-lost' },
  { file: 'packed.1gamerecord', title: '贴边挤压 + 连续左滑', slug: 'packed' },
  { file: 'inv.1gamerecord', title: '左滑 → 右滑 → 再右滑（移动/无效对比）', slug: 'inv' },
  { file: 'click-test.1gamerecord', title: '触控按钮模拟左滑', slug: 'click-test' },
  { file: 'move-test.1gamerecord', title: '多方向键序列（6 步）', slug: 'move-test' },
  { file: 'win-test.1gamerecord', title: 'Down+Left 策略（500 步）', slug: 'win-test' },
];

function run(cmd, args) {
  execFileSync(cmd, args, { cwd: root, stdio: 'inherit' });
}

if (!fs.existsSync(outDir)) {
  console.error('[build-vercel-replay] missing out/ — run pnpm run gameplay:create first');
  process.exit(1);
}

fs.mkdirSync(deployDir, { recursive: true });

const built = [];
for (const { file, title, slug } of REPLAYS) {
  const archive = path.join(outDir, file);
  if (!fs.existsSync(archive)) {
    console.warn(`[skip] ${file} not found`);
    continue;
  }
  const htmlOut = path.join(deployDir, `${slug}.html`);
  run('pnpm', ['exec', '1gameplay', 'bundle-player-html', archive, '--out', htmlOut, '--title', title]);
  built.push({ slug, title, file });
}

const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>2048 · 1gameplay 调试回放</title>
  <style>
    :root { color-scheme: dark; --bg: #030712; --card: #111827; --border: #243047; --text: #e5e7eb; --muted: #9ca3af; --accent: #38bdf8; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; }
    main { max-width: 720px; margin: 0 auto; padding: 24px 16px 48px; }
    h1 { font-size: 1.5rem; margin: 0 0 8px; }
    p.lead { color: var(--muted); margin: 0 0 24px; font-size: 0.95rem; }
    ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
    a.card { display: block; padding: 16px 18px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; text-decoration: none; color: inherit; transition: border-color 0.15s; }
    a.card:hover { border-color: var(--accent); }
    a.card strong { display: block; color: var(--accent); font-size: 1rem; margin-bottom: 4px; }
    a.card span { font-size: 0.85rem; color: var(--muted); }
    footer { margin-top: 32px; font-size: 0.8rem; color: var(--muted); }
  </style>
</head>
<body>
  <main>
    <h1>2048 · 1gameplay 调试回放</h1>
    <p class="lead">以下为 headless <code>1gameplay</code> 录制的过程回放，可在浏览器中逐步查看 store / 输入事件。</p>
    <ul>
${built
  .map(
    (r) => `      <li><a class="card" href="./${r.slug}.html"><strong>${r.title}</strong><span>${r.file}</span></a></li>`,
  )
  .join('\n')}
    </ul>
    <footer>由 @1game/skill + 1gameplay 生成 · game-2048</footer>
  </main>
</body>
</html>
`;

fs.writeFileSync(path.join(deployDir, 'index.html'), indexHtml);
console.log(`[build-vercel-replay] ${built.length} replays → ${deployDir}`);
