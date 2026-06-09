# 2048 — 1Game 小游戏

基于 [@1game/engine-bundle](https://www.npmjs.com/package/@1game/engine-bundle) 开发的经典 2048 益智游戏，使用 [@1game/skill](https://www.npmjs.com/package/@1game/skill) 中的开发规范实现。

## 特性

- 经典 4×4 棋盘与合并计分
- **方块滑动动画**（缓动位移）
- **合并缩放**与**新方块弹出**动画
- 键盘方向键 + 触摸滑动操作
- 可回放调试（`1gameplay`）

## 快速开始

```bash
npm install
npm run build
```

在浏览器中打开 `out/index.html` 即可游玩。

单文件版本：

```bash
npm run build:single
```

## 操作说明

| 操作 | 说明 |
|------|------|
| 方向键 | 上下左右移动方块 |
| 滑动 | 触摸屏滑动移动 |
| 点击 | 开始游戏 / 重新开始 |
| R | 重新开始 |

## 调试回放

```bash
npx 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
npx 1gameplay step out/debug.1gamerecord --ms 140 --event '{"type":"keypress","sceneId":"main","data":{"code":"ArrowLeft"}}'
npx 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload summary
```
