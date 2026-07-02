# 触屏 2048

基于 [@1game/engine-bundle](https://www.npmjs.com/package/@1game/engine-bundle) 开发的触屏 2048 小游戏，支持滑动操作与方块移动/合并动画。

## 特性

- 触屏滑动控制（上/下/左/右）
- 键盘方向键支持（便于调试）
- 方块滑动与合并的缓动动画（easeOutCubic，150ms）
- 分数与最高分记录
- 确定性状态（可回放调试）

## 开发

```bash
npm install
npm run build
```

构建产物位于 `out/index.html`，可在浏览器中打开游玩。

## 回放调试

```bash
npx 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
npx 1gameplay frame query out/debug.1gamerecord --at last --select render --payload summary
# 使用返回的 sceneStableUid 生成滑动事件
node node_modules/@1game/skill/skills/1game-game-dev/assets/swipe.mjs "<sceneStableUid>" 180 400 180 280 out/swipe.events.json
npx 1gameplay step out/debug.1gamerecord --ms 180 --event-file out/swipe.events.json
npx 1gameplay step out/debug.1gamerecord --ms 50 --repeat 4
npx 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload summary
```
