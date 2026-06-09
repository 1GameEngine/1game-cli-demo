# 2048 — 1Game 小游戏

基于 [@1game/skill](https://www.npmjs.com/package/@1game/skill) 工作流与 [@1game/engine-bundle](https://www.npmjs.com/package/@1game/engine-bundle) 实现的 2048 益智游戏，支持方块滑动移动动画。

## 玩法

- **键盘**：方向键或 WASD 移动方块
- **触控**：在画面上滑动切换方向
- 相同数字碰撞会合并，目标是合成 **2048**
- 无法移动时游戏结束，点击画面可重新开始

## 开发

```bash
npm install
npm run build
```

构建产物位于 `out/` 目录，用浏览器打开 `out/index.html` 即可游玩。

单文件版本：

```bash
npm run play
```

## 技术说明

- 游戏状态通过 `createGameStore` + `commitChange` 管理，支持 `1gameplay` 回放调试
- 移动动画在 `useFrame` 中按帧插值，方块从旧格子平滑滑到新位置
- 合并与新方块生成带有轻微缩放反馈
