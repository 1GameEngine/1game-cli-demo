# 触屏 2048

基于 [1Game](https://github.com/1GameEngine) 的触屏 2048 小游戏，支持滑动操作与方块移动动画。

## 玩法

- 在屏幕上滑动（上/下/左/右）移动所有方块
- 相同数字碰撞会合并
- 每次有效移动后随机生成新方块（2 或 4）
- 无法移动时游戏结束，点击「再来一局」重开

## 开发

```bash
npm install
npm run build
```

构建产物在 `out/index.html`，用浏览器打开即可游玩。

## 调试

```bash
npx 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
npx 1gameplay frame query out/debug.1gamerecord --at last --select render --payload summary
# 将 sceneStableUid 填入下方 swipe 事件
npx 1gameplay step out/debug.1gamerecord --event '{"type":"swipe","sceneStableUid":"<uid>","data":{"from":{"x":180,"y":400},"to":{"x":180,"y":280},"ms":200}}'
npx 1gameplay step out/debug.1gamerecord --ms 180
npx 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload summary
```

## 技术说明

- 使用 `@1game/skill` 中的事件驱动网格动画模式（逻辑状态 + 显示插值）
- 权威棋盘状态存于 `createGameStore`，所有变更经 `commitChange` 提交
- 触摸滑动在场景级 `onPointerDown` / `onPointerUp` 处理
