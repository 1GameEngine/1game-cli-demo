# 1game-cli-demo

触屏 2048 小游戏示例，基于 [@1game/skill](https://www.npmjs.com/package/@1game/skill) 开发指南实现。

## 游戏目录

[`game-2048/`](game-2048/) — 4×4 触屏 2048，支持滑动方向操作与方块移动动画。

### 快速开始

```bash
cd game-2048
npm install
npm run build
```

构建产物位于 `game-2048/out/index.html`，用浏览器打开即可游玩。

### 玩法

- 在屏幕上向任意方向滑动，合并相同数字
- 每次有效移动后会有滑动动画，动画结束后生成新方块
- 无法移动时游戏结束，可点击「再来一局」重开
