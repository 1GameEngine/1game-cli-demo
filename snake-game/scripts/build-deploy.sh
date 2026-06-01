#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
DEPLOY="$(pwd)/deploy"

npm run build
./scripts/1gameplay-smoke.sh

npx 1gameplay bundle-player-html out/smoke.1gamerecord \
  --out out/replay.html --title "贪吃蛇 1gameplay 调试回放" --single-html
npx 1gameplay bundle-player-html out/debug.1gamerecord \
  --out out/replay-debug.html --title "贪吃蛇 调试记录 (debug)" --single-html

mkdir -p "$DEPLOY"
cp out/replay.html out/replay-debug.html "$DEPLOY/"
cp out/index.html "$DEPLOY/play.html"
echo "Ready: $DEPLOY"
ls -lh "$DEPLOY"
