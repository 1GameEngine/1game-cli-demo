# 2048（1Game）

基于 [@1game/engine-bundle](https://www.npmjs.com/package/@1game/engine-bundle) 的简单 2048 益智游戏。

## 玩法

- 点击棋盘或按 Enter/Space 开始
- 方向键或屏幕下方按钮移动方块
- 相同数字碰撞合并，目标是合成 **2048**

## 开发

```bash
cd game-2048
npm install
npm run build
```

构建产物在 `out/index.html`，用浏览器打开即可游玩。

## 调试（1gameplay）

```bash
npm exec 1game build
npm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
npm exec 1gameplay step out/debug.1gamerecord --ms 16 --repeat 60
npm exec 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload summary
```
