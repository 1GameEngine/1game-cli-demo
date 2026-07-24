# 2048 · 1Game Demo

基于 `@1game/skill` 工作流与 `@1game/engine-bundle` 实现的 2048 演示。

## 玩法

- 方向键 / 滑动合并相同数字
- 合成 2048 获胜；无法移动则失败
- 点击画面开始或重开（`R` / `Space` 也可）

## 命令

```bash
pnpm install
pnpm build
pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
```

浏览器产物在 `out/`。
