# game-2048

触屏 2048 小游戏，使用 [@1game/engine-bundle](https://www.npmjs.com/package/@1game/engine-bundle) 开发，遵循 [@1game/skill](https://www.npmjs.com/package/@1game/skill) 的事件驱动网格动画模式。

## 特性

- 触屏滑动手势控制（上下左右）
- 方块滑动与合并动画（easeOutCubic 插值，140ms）
- 键盘方向键备用操作
- 确定性随机生成，支持 `1gameplay` 回放调试

## 命令

```bash
npm install
npm run build          # 构建到 out/index.html
npx 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
```

## 目录

- `src/game.tsx` — 游戏入口
- `1game.config.ts` — 构建配置
