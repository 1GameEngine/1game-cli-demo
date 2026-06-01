#!/usr/bin/env node
/**
 * 生成 out/site：导航页 + 可玩构建 + 各 .1gamerecord 单文件回放 HTML
 */
import { cp, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "out");
const siteDir = join(outDir, "site");
const gameDir = join(siteDir, "game");

const replays = [
  { record: "regression.1gamerecord", html: "regression.html" },
  { record: "snake-test.1gamerecord", html: "snake-test.html" },
  { record: "snake-touch.1gamerecord", html: "snake-touch.html" },
  { record: "snake-key.1gamerecord", html: "snake-key.html" },
  { record: "snake-eat.1gamerecord", html: "snake-eat.html" },
  { record: "debug.1gamerecord", html: "debug.html" },
];

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run("pnpm", ["exec", "1game", "build"]);

await mkdir(gameDir, { recursive: true });
for (const name of ["index.html", "game.worker.js", "worker-bootstrap.js"]) {
  await cp(join(outDir, name), join(gameDir, name));
}

await mkdir(siteDir, { recursive: true });

for (const { record, html } of replays) {
  const recordPath = join(outDir, record);
  const outHtml = join(siteDir, html);
  run("pnpm", [
    "exec",
    "1gameplay",
    "bundle-player-html",
    recordPath,
    "--out",
    outHtml,
    "--single-html",
  ]);
}

const indexTemplate = join(dirname(fileURLToPath(import.meta.url)), "site-index.html");
await cp(indexTemplate, join(siteDir, "index.html"));

console.log(`Site ready: ${siteDir}`);
