# AGENTS.md

## 1Game 项目代理指引

本项目由 `1game init` 初始化，默认入口为 `src/game.tsx`，默认输出目录为 `out/`。

### 权威文档：@1game/skill

游戏开发/调试的完整工作流、代码约束与命令清单以 `@1game/skill` 的 `1game-game-dev` skill 为唯一权威来源，本文件不重复维护，仅作为项目内速查指针：

- 已激活 skill 时优先阅读并遵循 `skills/1game-game-dev/SKILL.md`（例如 `.cursor/skills/1game-game-dev/SKILL.md`）。
- 尚未激活时，可直接读取 `node_modules/@1game/skill/skills/1game-game-dev/SKILL.md` 作为兜底；若已安装 `@1game/skill`，运行 `pnpm exec 1game-skill activate --cursor`（npm 等价：`npm exec 1game-skill activate -- --cursor`；按需加 `--claude`/`--agents`/`--global`）即可完成激活；未安装时可一次性运行 `npx @1game/skill activate --cursor`，并提醒用户后续补齐 IDE 激活。
- 与本文件冲突时，以 skill 文档为准。

### 常用命令

- `pnpm install`
- `pnpm build`
- 调试 / 排查 / 复现 / 定位问题时，默认优先使用 `1gameplay` 工作流（详见上述 skill 文档），仅当用户明确要求只做浏览器手动调试时才改用其它方式。
