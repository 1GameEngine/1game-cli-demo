#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const deploy = path.join(root, 'deploy');
const out = path.join(root, 'out');

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

const replays = [
  {
    archive: 'out/debug.1gamerecord',
    html: 'deploy/replays/basic-step.html',
    title: '2048 调试：基础步进',
  },
  {
    archive: 'out/debug-restart-lost.1gamerecord',
    html: 'deploy/replays/restart-lost.html',
    title: '2048 调试：失败后 Space 重开',
  },
  {
    archive: 'out/debug-overlay-click.1gamerecord',
    html: 'deploy/replays/overlay-click.html',
    title: '2048 调试：遮罩点击重开',
  },
];

run('npm run build');

fs.mkdirSync(path.join(deploy, 'game'), { recursive: true });
fs.mkdirSync(path.join(deploy, 'replays'), { recursive: true });

for (const f of ['index.html', 'game.worker.js', 'worker-bootstrap.js']) {
  fs.copyFileSync(path.join(out, f), path.join(deploy, 'game', f));
}

for (const { archive, html, title } of replays) {
  const arc = path.join(root, archive);
  if (!fs.existsSync(arc)) {
    console.warn(`[deploy] skip missing archive: ${archive}`);
    continue;
  }
  const outHtml = path.join(root, html);
  run(
    `npx 1gameplay bundle-player-html "${arc}" --out "${outHtml}" --single-html --title "${title}"`,
  );
}

console.log('[deploy] pages ready in deploy/');
