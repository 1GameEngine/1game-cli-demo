# 2048 小游戏

基于 [1Game](https://www.npmjs.com/package/@1game/engine-bundle) 引擎开发的经典 2048 益智游戏，支持平滑移动动画。

## 特性

- 经典 4×4 棋盘玩法
- 方块滑动、合并、新生成动画
- 键盘（方向键 / WASD）与滑动手势操作
- 分数与最高分记录
- 确定性随机数，支持 `1gameplay` 回放调试

## 快速开始

```bash
npm install
npm run build
```

构建产物位于 `out/index.html`，用浏览器打开即可游玩。

## 开发调试

```bash
# 创建回放记录
npx 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord

# 模拟按键
npx 1gameplay step out/debug.1gamerecord --ms 140 --event '{"type":"keypress","sceneId":"main","data":{"code":"ArrowLeft"}}'

# 查询游戏状态
npx 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload summary
```

## 操作说明

| 操作 | 说明 |
|------|------|
| 方向键 / WASD | 移动方块 |
| 滑动手势 | 移动端滑动控制 |
| 点击 | 开始游戏 / 重新开始 |
