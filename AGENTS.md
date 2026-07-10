# AGENTS.md

## 1Game 项目代理指引

本项目由 `@1game/skill` 工作流开发，默认入口为 `src/game.tsx`，默认输出目录为 `out/`。

若项目已启用 `@1game/skill`（例如 `1game-game-dev`），并且与本文档冲突，优先遵循 skill 文档。

### 常用命令

- `npm install`
- `npm run build`
- `npx 1game build --target single-file`
- `npx 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord`

### 代码约束

- 玩法状态集中在 `createGameStore`，通过 `commitChange` 更新。
- 保持 `enableHistory: true` 与 `renderGame(..., { bindStore: storeHistory })`。
- 禁止未播种的 `Math.random()` / `Date.now()` 驱动规则。
