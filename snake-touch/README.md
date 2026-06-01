# 触屏贪吃蛇 (Snake Touch)

基于 [@1game/skill](https://www.npmjs.com/package/@1game/skill) 工作流与 `@1game/engine-bundle` 开发的触屏贪吃蛇小游戏。

## 玩法

- **滑动**屏幕控制蛇的移动方向（上 / 下 / 左 / 右）
- 首次滑动开始游戏；游戏结束后滑动重新开始
- 键盘方向键 / WASD 也可在桌面浏览器中操作
- 吃到红色食物得分，移动速度会逐渐加快

## 开发与构建

```bash
cd snake-touch
pnpm install
pnpm build          # 输出 out/index.html（单文件 HTML）
```

在浏览器中打开 `out/index.html` 即可游玩。

## 调试（可选）

```bash
pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
pnpm exec 1gameplay step out/debug.1gamerecord --ms 140 --repeat 60
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload summary
```
