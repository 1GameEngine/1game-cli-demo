# 2048（1Game）

基于 [@1game/skill](https://www.npmjs.com/package/@1game/skill) 工作流开发的经典 2048 益智游戏，使用 `@1game/engine-bundle` 与 Solid JSX 渲染。

## 玩法

- **键盘**：方向键或 WASD 滑动方块
- **触屏**：屏幕下方方向按钮
- 相同数字碰撞合并，目标是合成 **2048**
- 达成 2048 后可选择继续挑战更高分

## 开发

```bash
pnpm install
pnpm build          # 输出到 out/
pnpm run build:single   # 单文件 HTML
```

在浏览器中打开 `out/index.html` 即可游玩（需通过本地静态服务或直接打开构建产物）。

## 调试（1gameplay）

```bash
pnpm run gameplay:create
pnpm run gameplay:step
pnpm run gameplay:query
```

## 技术要点

- 游戏状态集中在 `createGameStore`，所有移动通过 `commitChange` 变更
- 确定性随机数（mulberry32）保证回放可复现
- `renderGame` 绑定 `storeHistory` 支持 1gameplay 录制与步进调试
