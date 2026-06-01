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

## 调试回放（Vercel）

将 1gameplay 调试录制部署为可浏览回放页：

```bash
pnpm run build:vercel-replay   # 生成 vercel-replay/
# 本地预览: npx serve vercel-replay
```

线上预览：<https://vercel-replay.vercel.app>

| 回放 | 说明 |
|------|------|
| [/endgame/](https://vercel-replay.vercel.app/endgame/) | 随机对局至 Game Over（572 分） |
| [/playtest/](https://vercel-replay.vercel.app/playtest/) | 自动化 playtest（~80 步） |
| [/debug/](https://vercel-replay.vercel.app/debug/) | 基础 create/step 调试归档 |

## 技术要点

- 游戏状态集中在 `createGameStore`，所有移动通过 `commitChange` 变更
- 确定性随机数（mulberry32）保证回放可复现
- `renderGame` 绑定 `storeHistory` 支持 1gameplay 录制与步进调试
