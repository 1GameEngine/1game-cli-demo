# AGENTS.md

## 1Game 项目代理指引

本项目由 `1game init` 初始化，默认入口为 `src/game.tsx`，默认输出目录为 `out/`。

### 常用命令

- `pnpm install`
- `pnpm build`
- `pnpm exec 1game build --singleHtml`
- `pnpm exec 1game buildjs --entry src/game.tsx --outDir out`

### 1gameplay 调试工作流（推荐优先使用）

如未安装 `1gameplay`，先执行：

- `pnpm add -D @1game/cli-1gameplay`

建议使用以下顺序调试游戏逻辑：

1. 生成 Worker 构建产物：
   - `pnpm exec 1game buildjs --entry src/game.tsx --outDir out`
2. 创建可回放记录：
   - `pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord`
3. 步进并注入事件：
   - `pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --repeat 60`
4. 查询状态与渲染结果：
   - `pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select runtime --select store:state --select render:scene=main --payload summary`
5. 对比帧差异定位回归：
   - `pnpm exec 1gameplay frame diff out/debug.1gamerecord --from 0 --to last --select store:dump --payload full`
6. 导出回放页便于复盘：
   - `pnpm exec 1gameplay bundle-player-html out/debug.1gamerecord --out out/replay.html`

### 代码约束

- 游戏逻辑状态建议集中放在 `createGameStore` 中，并通过 `commitChange` 更新。
- 保持 `enableHistory: true`，以便 `1gameplay` 进行可重复调试。
- 保持 `renderGame(..., { bindStore: storeHistory })`，确保回放/查询一致性。
