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

## 在线演示与调试回放

| 页面 | 地址 |
|------|------|
| 导航 hub | https://game-2048-debug.vercel.app/ |
| 游戏 | https://game-2048-debug.vercel.app/game/index.html |
| 基础步进回放 | https://game-2048-debug.vercel.app/replays/basic-step.html |
| Space 重开回放 | https://game-2048-debug.vercel.app/replays/restart-lost.html |
| 遮罩点击回放 | https://game-2048-debug.vercel.app/replays/overlay-click.html |

本地重新生成部署目录：

```bash
npm run build
mkdir -p deploy/replays
npx 1gameplay bundle-player-html out/debug.1gamerecord --out deploy/replays/basic-step.html --single-html
# …其余 replay 同理，见 deploy/index.html
```

## 调试（1gameplay）

```bash
npm exec 1game build
npm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
npm exec 1gameplay step out/debug.1gamerecord --ms 16 --repeat 60
npm exec 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload summary
```
