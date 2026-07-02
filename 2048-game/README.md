# 2048 触屏小游戏

基于 [1Game](https://www.npmjs.com/package/@1game/cli) 开发的经典 2048 拼图游戏，支持触屏滑动与键盘方向键操作，方块移动与合并均带有平滑动画。

## 特性

- 4×4 棋盘，经典 2048 合并规则
- 触屏四向滑动手势
- 键盘方向键（`ArrowUp/Down/Left/Right`）备用操作
- 方块滑动、合并缩放、新方块弹出动画
- 分数与最高分统计
- 达成 2048 胜利提示，支持继续挑战
- 确定性状态，可用 `1gameplay` 回放调试

## 快速开始

```bash
npm install
npm run build
```

构建产物位于 `out/index.html`，用任意静态服务器打开即可：

```bash
npx serve out
```

## 操作说明

| 操作 | 说明 |
|------|------|
| 滑动 | 在棋盘上向任意方向滑动，移动并合并方块 |
| 方向键 | 键盘控制（需浏览器焦点在画布上） |
| 再来一局 | 游戏结束或胜利后点击重开 |

## 开发

```bash
# 构建浏览器版本
npm run build

# 创建回放记录
npx 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord

# 注入滑动手势（需先 query 获取 sceneStableUid）
npx 1gameplay step out/debug.1gamerecord --ms 180 --event-file out/swipe-up.events.json
npx 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload summary
```

## 技术栈

- [@1game/engine-bundle](https://www.npmjs.com/package/@1game/engine-bundle) — 游戏运行时
- [@1game/cli](https://www.npmjs.com/package/@1game/cli) — 构建工具
- [@1game/skill](https://www.npmjs.com/package/@1game/skill) — Agent 开发技能包
