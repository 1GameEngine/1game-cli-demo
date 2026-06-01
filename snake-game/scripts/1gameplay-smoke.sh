#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
ARCH=out/smoke.1gamerecord

npm run build >/dev/null
npx 1gameplay create --entry src/game.tsx --out "$ARCH" >/dev/null

# 轻触开始
npx 1gameplay step "$ARCH" --ms 16 \
  --event '{"type":"pointer.down","sceneId":"main","data":{"id":1,"x":180,"y":320}}' \
  --event '{"type":"pointer.up","sceneId":"main","data":{"id":1,"x":180,"y":320}}' >/dev/null
phase=$(npx 1gameplay frame query "$ARCH" --at last --select store:state --payload summary | jq -r '.result.select["store:state"].phase')
[[ "$phase" == "playing" ]] || { echo "FAIL: tap start"; exit 1; }

# 默认向右，步进吃到食物
score=0
for _ in $(seq 1 50); do
  npx 1gameplay step "$ARCH" --ms 140 --repeat 1 >/dev/null
  score=$(npx 1gameplay frame query "$ARCH" --at last --select store:state --payload summary | jq -r '.result.select["store:state"].score')
  phase=$(npx 1gameplay frame query "$ARCH" --at last --select store:state --payload summary | jq -r '.result.select["store:state"].phase')
  [[ "$phase" == "gameover" ]] && { echo "FAIL: gameover before eating (score=$score)"; exit 1; }
  [[ "$score" -ge 1 ]] && break
done
[[ "$score" -ge 1 ]] || { echo "FAIL: no food eaten"; exit 1; }

# 滑动向下（带 move）
npx 1gameplay step "$ARCH" --ms 16 \
  --event '{"type":"pointer.down","sceneId":"main","data":{"id":2,"x":180,"y":200}}' \
  --event '{"type":"pointer.move","sceneId":"main","data":{"id":2,"x":180,"y":260}}' \
  --event '{"type":"pointer.up","sceneId":"main","data":{"id":2,"x":180,"y":260}}' >/dev/null
dir=$(npx 1gameplay frame query "$ARCH" --at last --select store:state --payload summary | jq -r '.result.select["store:state"].nextDirection')
[[ "$dir" == "down" ]] || { echo "FAIL: swipe down got $dir"; exit 1; }

# 继续步进直到撞墙
npx 1gameplay step "$ARCH" --ms 140 --repeat 80 >/dev/null
phase=$(npx 1gameplay frame query "$ARCH" --at last --select store:state --payload summary | jq -r '.result.select["store:state"].phase')
[[ "$phase" == "gameover" ]] || { echo "FAIL: expected wall gameover"; exit 1; }

# 轻触重启
npx 1gameplay step "$ARCH" --ms 16 \
  --event '{"type":"pointer.down","sceneId":"main","data":{"id":3,"x":180,"y":320}}' \
  --event '{"type":"pointer.up","sceneId":"main","data":{"id":3,"x":180,"y":320}}' >/dev/null
phase=$(npx 1gameplay frame query "$ARCH" --at last --select store:state --payload summary | jq -r '.result.select["store:state"].phase')
[[ "$phase" == "playing" ]] || { echo "FAIL: restart"; exit 1; }

echo "1gameplay smoke: OK"
