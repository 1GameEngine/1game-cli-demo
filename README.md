# 2048 小游戏

基于 [@1game/skill](https://www.npmjs.com/package/@1game/skill) 与 [@1game/engine-bundle](https://www.npmjs.com/package/@1game/engine-bundle) 开发的经典 2048 益智游戏，支持方块移动动画。

## 功能

- 经典 4×4 网格 2048 玩法
- 方块滑动与合并的缓动动画（约 140ms）
- 键盘方向键操作
- 触屏滑动手势操作
- 分数与最高分记录
- 确定性随机数，支持 `1gameplay` 回放调试

## 快速开始

```bash
npm install
npm run build
```

构建产物位于 `out/index.html`，用浏览器打开即可游玩。

单文件版本：

```bash
npm run dev
```

## 操作说明

- **方向键** ↑ ↓ ← → 移动方块
- **滑动**：在画面上滑动对应方向
- **点击「重新开始」** 重置游戏
- 合并相同数字方块，目标是合成 **2048**

## 调试

```bash
npx 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
npx 1gameplay step out/debug.1gamerecord --ms 140 --event '{"type":"keypress","sceneId":"main","data":{"code":"ArrowLeft"}}'
npx 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload summary
```
