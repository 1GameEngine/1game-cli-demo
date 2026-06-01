# AGENTS.md

## 1Game 项目代理指引

本项目由 `1game init` 初始化，默认入口为 `src/game.tsx`，默认输出目录为 `out/`。

### 常用命令

- `pnpm install`
- `pnpm build`
- `pnpm exec 1game build --singleHtml`
- `pnpm exec 1game buildjs --entry src/game.tsx --outDir out`

### 调试默认规则

- 当用户提出“调试 / 排查 / 复现 / 定位问题”等诉求时，默认使用 `1gameplay` 工作流。
- 仅当用户明确要求“只做浏览器手动调试”或“不要使用 `1gameplay`”时，再改用其它方式。

### 1gameplay 调试工作流（默认优先使用）

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

### 开发收尾提醒

- 每次完成游戏修改/开发后，主动提醒用户：是否需要查看已有过程调试记录，或重新生成新的 `.1gamerecord` 调试记录。
- 调试完成且需要给用户查看过程时，再执行 `pnpm exec 1gameplay bundle-player-html out/debug.1gamerecord --out out/replay-single.html --single-html` 生成单文件回放 HTML；调试过程中无需同步生成。
