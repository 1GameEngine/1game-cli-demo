#!/usr/bin/env node
import { copyFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'out');

execSync('pnpm exec 1game build --singleHtml', { cwd: root, stdio: 'inherit' });

copyFileSync(join(out, 'index.html'), join(out, 'play.html'));
copyFileSync(join(root, 'deploy', 'portal.html'), join(out, 'index.html'));

const replays = ['debug', 'swipe3', 'wall-test', 'swipe-test', 'self-test', 'click-test'];
for (const name of replays) {
  const archive = join(out, `${name}.1gamerecord`);
  if (!existsSync(archive)) continue;
  execSync(
    `pnpm exec 1gameplay bundle-player-html "${archive}" --out "${join(out, `replay-${name}.html`)}" --single-html --title "Snake Debug: ${name}"`,
    { cwd: root, stdio: 'inherit' },
  );
}

console.log('[prepare-deploy] out/ ready for static hosting');
