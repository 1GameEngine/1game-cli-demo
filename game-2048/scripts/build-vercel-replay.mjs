#!/usr/bin/env node
/**
 * Bundle 1gameplay debug archives into game-2048/vercel-replay for static hosting.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'out');
const DEPLOY = path.join(ROOT, 'vercel-replay');

/** @type {{ record: string; slug: string; title: string; description: string }[]} */
const REPLAYS = [
  {
    record: 'endgame.1gamerecord',
    slug: 'endgame',
    title: '对局至 Game Over',
    description: '随机滑动约 78 步直至无法移动，最终得分 572（1gameplay 调试录制）',
  },
  {
    record: 'playtest.1gamerecord',
    slug: 'playtest',
    title: '自动化 Playtest',
    description: '约 80 步循环方向键 + 重来按钮点击验证（pnpm run playtest）',
  },
  {
    record: 'debug.1gamerecord',
    slug: 'debug',
    title: '基础调试会话',
    description: 'create + step 后的初始调试归档，用于 smoke 验证',
  },
];

function run(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf-8' });
}

function runInherit(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

function patchHtml(htmlPath, playerSrc) {
  let html = fs.readFileSync(htmlPath, 'utf-8');
  html = html.replace(/src="\.\/player\.bundle\.js"/, `src="${playerSrc}"`);
  fs.writeFileSync(htmlPath, html);
}

function buildHub(manifest) {
  const items = manifest
    .map(
      (m) => `
      <a class="card" href="./${m.slug}/">
        <h2>${m.title}</h2>
        <p>${m.description}</p>
        <span class="meta">${m.record} · ${m.frames} 帧 · ${m.events} 事件</span>
      </a>`,
    )
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>2048 · 1gameplay 调试回放</title>
  <style>
    :root { color-scheme: dark; --bg: #030712; --card: #111827; --border: #243047; --text: #e5e7eb; --muted: #9ca3af; --accent: #edc22e; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: ui-sans-serif, system-ui, sans-serif; background: var(--bg); color: var(--text); }
    header { padding: 2rem 1.5rem 1rem; border-bottom: 1px solid var(--border); max-width: 720px; margin: 0 auto; }
    h1 { margin: 0 0 0.5rem; font-size: 1.75rem; }
    .sub { color: var(--muted); margin: 0; line-height: 1.5; }
    main { max-width: 720px; margin: 0 auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .card { display: block; padding: 1.25rem 1.5rem; background: var(--card); border: 1px solid var(--border); border-radius: 12px; text-decoration: none; color: inherit; transition: border-color 0.15s; }
    .card:hover { border-color: var(--accent); }
    .card h2 { margin: 0 0 0.5rem; font-size: 1.125rem; }
    .card p { margin: 0 0 0.75rem; color: var(--muted); font-size: 0.9rem; line-height: 1.45; }
    .meta { font-size: 0.75rem; color: var(--muted); }
    footer { max-width: 720px; margin: 0 auto; padding: 0 1.5rem 2rem; color: var(--muted); font-size: 0.8rem; }
  </style>
</head>
<body>
  <header>
    <h1>2048 · 1gameplay 调试回放</h1>
    <p class="sub">由 <code>@1game/cli-1gameplay</code> 录制的 headless 调试会话，可在浏览器中逐步回放状态与画面。</p>
  </header>
  <main>
${items}
  </main>
  <footer>
    <p>使用 1Game <code>bundle-player-html</code> 生成 · @1game/skill 工作流</p>
  </footer>
</body>
</html>`;
  fs.writeFileSync(path.join(DEPLOY, 'index.html'), html);
}

console.log('[build-vercel-replay] preparing...');

if (fs.existsSync(DEPLOY)) {
  fs.rmSync(DEPLOY, { recursive: true, force: true });
}
fs.mkdirSync(DEPLOY, { recursive: true });

/** @type {{ slug: string; title: string; description: string; record: string; frames: number; events: number }[]} */
const manifest = [];
let sharedPlayer = '';

for (const item of REPLAYS) {
  const srcRecord = path.join(OUT, item.record);
  if (!fs.existsSync(srcRecord)) {
    console.warn(`[build-vercel-replay] skip ${item.slug}: missing out/${item.record}`);
    continue;
  }

  const dir = path.join(DEPLOY, item.slug);
  fs.mkdirSync(dir, { recursive: true });

  const tmpHtml = path.join(OUT, `replay-${item.slug}.html`);
  const stdout = run(
    `pnpm exec 1gameplay bundle-player-html "${srcRecord}" --out "${tmpHtml}" --title "2048 · ${item.title}"`,
  );
  const meta = JSON.parse(stdout.slice(stdout.indexOf('{')));

  fs.copyFileSync(tmpHtml, path.join(dir, 'index.html'));
  fs.copyFileSync(srcRecord, path.join(dir, item.record));
  patchHtml(path.join(dir, 'index.html'), '/player.bundle.js');

  const playerSrc = path.join(OUT, 'player.bundle.js');
  if (!sharedPlayer && fs.existsSync(playerSrc)) {
    sharedPlayer = playerSrc;
    fs.copyFileSync(playerSrc, path.join(DEPLOY, 'player.bundle.js'));
  }

  manifest.push({
    slug: item.slug,
    title: item.title,
    description: item.description,
    record: item.record,
    frames: meta.runtimeFrames ?? 0,
    events: meta.events ?? 0,
  });

  console.log(`[build-vercel-replay] ${item.slug}: ${meta.runtimeFrames} frames, ${meta.events} events`);
}

if (!sharedPlayer) {
  console.error('[build-vercel-replay] player.bundle.js not found');
  process.exit(1);
}

if (manifest.length === 0) {
  console.error('[build-vercel-replay] no replays built');
  process.exit(1);
}

buildHub(manifest);

fs.writeFileSync(
  path.join(DEPLOY, 'vercel.json'),
  JSON.stringify(
    {
      headers: [
        {
          source: '/(.*).1gamerecord',
          headers: [{ key: 'Content-Type', value: 'application/octet-stream' }],
        },
      ],
    },
    null,
    2,
  ),
);

console.log(`[build-vercel-replay] done: ${DEPLOY} (${manifest.length} replays)`);
