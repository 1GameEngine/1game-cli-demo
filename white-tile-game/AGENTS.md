# AGENTS.md

## 1Game 项目代理指引

本项目由 `1game init` 初始化，默认入口为 `src/game.tsx`，默认输出目录为 `out/`。

若项目已启用 `@1game/skill`（例如 `1game-game-dev`），并且与本文档冲突，优先遵循 skill 文档。

### 常用命令

- `pnpm install`
- `pnpm build`
- `pnpm exec 1game build --target single-file`
- `pnpm exec 1game build --target worker --entry src/game.tsx --outDir out`（可选：仅用于定位 worker 构建问题）
- npm 等价启动方式：`npx 1game build`、`npx 1gameplay ...`

### 调试默认规则

- 当用户提出“调试 / 排查 / 复现 / 定位问题”等诉求时，默认使用 `1gameplay` 工作流。
- 仅当用户明确要求“只做浏览器手动调试”或“不要使用 `1gameplay`”时，再改用其它方式。

### 1gameplay 调试工作流（默认优先使用）

如未安装 `1gameplay`，先执行：

- `pnpm add -D @1game/cli-1gameplay`

建议使用以下顺序调试游戏逻辑：

1. 先构建浏览器产物：
   - `pnpm exec 1game build`
   - 如需单独排查 worker 构建，可额外执行 `pnpm exec 1game build --target worker --entry src/game.tsx --outDir out`
2. 创建可回放记录：
   - `pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord`
3. 步进并注入事件：
   - 实时循环游戏：`pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --repeat 60`
   - 网格/回合制游戏：优先注入事件并断言 `store:state`，不要仅依赖 `repeat` 步数
4. 查询状态与渲染结果：
   - `pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select runtime --select store:state --select render:sceneStableUid=main --payload summary`
5. 对比帧差异定位回归：
   - `pnpm exec 1gameplay frame diff out/debug.1gamerecord --from 0 --to last --select store:dump --payload full`
6. 导出回放页便于复盘：
   - `pnpm exec 1gameplay bundle-player-html out/debug.1gamerecord --out out/replay.html`

### 代码约束

- 游戏逻辑状态建议集中放在 `createGameStore` 中，并通过 `commitChange` 更新。
- 保持 `enableHistory: true`，以便 `1gameplay` 进行可重复调试。
- 保持 `renderGame(..., { bindStore: storeHistory })`，确保回放/查询一致性。

### 开发收尾提醒

- 每次完成游戏修改/开发后，主动提醒用户：是否需要查看已有过程调试记录，或重新生成新的 `.1gamerecord` 调试记录。
- 调试完成且需要给用户查看过程时，再执行 `pnpm exec 1gameplay bundle-player-html out/debug.1gamerecord --out out/replay-single.html --single-html` 生成单文件回放 HTML；调试过程中无需同步生成。
