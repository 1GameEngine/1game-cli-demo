# 2048

基于 1Game（`@1game/engine-bundle`）实现的经典 2048，带方块滑动与生成动画。

## 操作

- 方向键：上下左右移动
- 触控/鼠标滑动：滑动移动
- `R` 或「新游戏」按钮：重开

## 命令

```bash
pnpm install
pnpm build                 # 输出 out/index.html
pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
```

开发与调试流程以 `@1game/skill` 的 `1game-game-dev` 为准。
