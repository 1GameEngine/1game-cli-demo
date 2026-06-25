---
name: 1game-game-dev
description: 使用公开的 @1game 包开发、调试、构建与回放 1Game 浏览器游戏。适用于项目创建、基于 @1game/engine-bundle 实现玩法、使用 1game/1gameplay CLI，以及确定性调试场景。
license: MIT
compatibility: Node.js 20+，pnpm 9+（推荐）或 npm 9+，以及支持 Web Worker 的浏览器运行时。
---

# 1Game 游戏开发

使用此技能可基于公开包创建新的 1Game 浏览器游戏。
`SKILL.md` 负责执行流程与最小约束，详细 API/命令清单位于 `references/`。

## 使用前准备

`@1game/skill` 是技能文档包，不是游戏运行时 API 包。
从 npm 安装后不会自动加载到 Cursor/Claude。

激活清单：

1. 将 `@1game/skill` 安装为开发依赖。
2. 把 `skills/1game-game-dev` 复制/软链接到 Agent skills 目录（如 `.agents/skills/`、`.cursor/skills/`、`.claude/skills/`）。
3. 确认 Agent 可发现 `name: 1game-game-dev`。

强制中止条件：

- 若激活未完成，不要继续按本技能流程实现功能，先修复激活问题。

## 范围与边界

按职责使用公开 npm 包：

- `@1game/engine-bundle`：游戏代码里的运行时 API 与 JSX 标签。
- `@1game/cli`：项目初始化与浏览器构建（`1game` 命令）。
- `@1game/cli-1gameplay`：无头录制、步进、查询、diff、模拟、回放 HTML（`1gameplay` 命令）。
- `@1game/skill`：面向 Agent 的流程与实现指导。
- 可选扩展：`@1game/solid-particles-proton` 等。

## 真值来源与冲突处理

- 本 `SKILL.md` 与 `references/` 下文件是该技能的权威来源。
- `1game init` 生成的 `AGENTS.md` 仅是便捷速查。
- 若有冲突，优先遵循本技能包，再同步更新项目本地说明/脚本。
- 将此技能视为“项目内规范”：从游戏项目根目录执行命令，并显式维护路径（默认 `out/...` 或你配置的 `outDir`）。

## Agent 默认工作流

1. 先明确游戏类型：实时循环（`useFrame`）/ 固定 tick 网格 / 回合或事件驱动 / 事件驱动 + 可视动画。
2. 明确目标、玩家操作、胜负条件、场景、素材、目标宽高比。
3. 运行验证命令前先问用户优先级：回放调试（`1gameplay`）、浏览器构建产物（`1game build`）或两者都要。
4. 使用 `1game init <name>` 创建或检查项目。
5. 在 `src/game.tsx` 中实现玩法，并保持 store 更新可确定性重放。
6. 若用户选择“回放优先”：先跑 `1gameplay create/step/frame query`，仅在需要浏览器产物验证时再跑 `1game build`。
7. 若用户选择“构建优先”：先跑 `1game build`，再做浏览器/手工验证，并按需补充回放检查。
8. 若用户选择两者：按用户指定顺序执行；若未指定，默认回放优先（更利于确定性调试）。
9. 在玩法实现/调试后结束回复前，必须询问用户是否需要回放交付（查看已有记录、重新生成 `.1gamerecord`、导出回放 HTML）。
10. 当用户请求回放交付，或你需要展示调试过程时，导出回放 HTML。
11. 玩家手感和布局用浏览器/手工测试；可重复检查用 `1gameplay`。

`1game init` 生成项目的默认行为：

- `.gitignore` 会忽略 `out/`、`*.1gamerecord`、`dist/` 与常见产物。
- `1game.config.ts` 默认 `entry: src/game.tsx`、`outDir: out`、`target: web`。
- 生成 `AGENTS.md` 作为快速说明，后续可能持续更新。

## 开始一个新游戏

pnpm:

```bash
pnpm dlx @1game/cli init my-game
cd my-game
pnpm install
pnpm exec 1game build
```

npm:

```bash
npx @1game/cli init my-game
cd my-game
npm install
npx 1game build
```

如果在已有项目中开发，请安装公开运行时与 CLI 包（保持 `@1game/*` 版本一致）：

pnpm:

```bash
pnpm add @1game/engine-bundle solid-js
pnpm add -D @1game/cli @1game/cli-1gameplay typescript
```

npm:

```bash
npm install @1game/engine-bundle solid-js
npm install -D @1game/cli @1game/cli-1gameplay typescript
```

环境注意事项（pnpm 用户）：

- 若 `1gameplay` 因缺少原生绑定（`better-sqlite3.node`）失败，请执行 `pnpm approve-builds`，或在 `pnpm.onlyBuiltDependencies` 中放行 `better-sqlite3`。
- 若构建提示缺少 esbuild 二进制，也请按同样方式放行/安装 esbuild 构建脚本。

## 最小必备约定

要保证游戏逻辑可回放、可调试：

- 将权威玩法状态放在 `createGameStore` 中。
- 所有玩法状态迁移都用 `commitChange(label, draft => ...)`。
- 在 `commitChange` 内修改 `draft`；不要在 mutator 里返回全新 state 对象。
- 开启历史：`{ enableHistory: true }`。
- 在 `renderGame(..., { bindStore: storeHistory })` 里绑定历史。
- 维持稳定 scene stableUid，并在注入事件时始终使用当前回放中真实的 stableUid（从 `frame query --select render` 或 `hit` 获取），不要把 scene name 当作 identity。
- 保持玩法确定性：避免未播种的 `Math.random()`、避免 `Date.now()` 直接驱动规则、避免模块级可变玩法状态。

最小可运行形态：

```tsx
import { createGameStore, renderGame } from '@1game/engine-bundle/runtime/worker';

type GameState = { phase: 'ready' | 'playing'; score: number };

const { store, commitChange, storeHistory } = createGameStore<GameState>({ phase: 'ready', score: 0 }, { enableHistory: true });

renderGame(
  () => (
    <scene
      name="main"
      width={320}
      height={180}
      clickable
      onClick={() => {
        commitChange('开始或计分', (draft) => {
          if (draft.phase === 'ready') draft.phase = 'playing';
          else draft.score += 1;
        });
      }}
    >
      <text x={8} y={8} width={304} height={24} text={`${store.phase}:${store.score}`} />
    </scene>
  ),
  { bindStore: storeHistory },
);
```

## 最小确定性检查命令

始终在游戏项目根目录执行。单步基线检查可省略 `--ms`（默认 `100` ms）。使用 `--repeat`（或调试时序敏感问题）时，必须显式传入 `--ms`。若范围包含浏览器构建产物，按用户偏好在这些回放检查前后运行 `1game build`。

### 实时循环游戏（`useFrame` 驱动）

```bash
pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --repeat 60
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select store:state --select render:sceneStableUid=<sceneStableUid> --payload summary
```

npm 等价命令：

```bash
npx 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
npx 1gameplay step out/debug.1gamerecord --ms 16 --repeat 60
npx 1gameplay frame query out/debug.1gamerecord --at last --select store:state --select render:sceneStableUid=<sceneStableUid> --payload summary
```

### 固定 tick / 网格 / 回合或事件驱动游戏

```bash
pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select render --payload summary
pnpm exec 1gameplay step out/debug.1gamerecord --ms 140 --event '{"type":"keypress","sceneStableUid":"<sceneStableUid>","data":{"code":"ArrowUp"}}'
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload full
```

npm 等价命令：

```bash
npx 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
npx 1gameplay frame query out/debug.1gamerecord --at last --select render --payload summary
npx 1gameplay step out/debug.1gamerecord --ms 140 --event '{"type":"keypress","sceneStableUid":"<sceneStableUid>","data":{"code":"ArrowUp"}}'
npx 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload full
```

说明：

- 固定 tick 游戏：`--ms` 设为接近玩法 tick（例如 `140` ms）。
- 单步基线检查可省略 `--ms`，此时 `1gameplay step` 默认间隔 `100` ms。
- 使用 `--repeat` 时必须显式传入 `--ms`（如 `--ms 16` 或游戏特定 tick）。
- 注入事件前先用 `frame query --select render`（或 `hit`）获取真实 `sceneStableUid`，不要写死 `'main'`。
- 回合/事件驱动游戏：应通过“注入事件 + 状态断言”验证，而非只看 `repeat` 次数。
- 触摸/滑动玩法应注入 `pointer.down` + `pointer.move` + `pointer.up`（见 `references/debugging-playbook.md` 与 `assets/swipe.mjs`）。
- 若回放演示里手势不明显（例如同一步完成 `down -> move -> up`），可在“演示用”命令中增加 `pointer.move` 采样点，或将手势拆到多个 `step`；默认调试流程仍优先保证确定性状态断言。
- 若用户选择浏览器构建产物，最终验收前将 `1game build` 加入清单。

调试完成且需要共享回放时：

```bash
pnpm exec 1gameplay bundle-player-html out/debug.1gamerecord --out out/replay-single.html --single-html
```

## 回放交付（必须执行的收尾行为）

在完成游戏开发/调试并结束回复前，必须包含“回放交付”提问。即使用户最新消息没有明确要求回放输出，也必须询问。

结束前固定询问用户：

- 是否要查看已有回放记录（`*.1gamerecord`，若存在）。
- 是否要重新生成新的 `out/debug.1gamerecord`。
- 是否要导出可分享的单文件回放 HTML（`bundle-player-html --single-html`）。

推荐收尾提问：

`要我展示已有回放记录、重新生成新的 .1gamerecord，还是导出 replay-single.html 供调试回放吗？`

## 参考路由（细节单一来源）

仅在需要时加载详细文档：

- `references/public-api.md`：公开 API 与命令矩阵、事件载荷、选择器语义、错误契约。
- `references/debugging-playbook.md`：实战调试配方与排障流程。
- `references/game-patterns.md`：状态、输入、移动、碰撞、音频、布局实现模式。
- `references/animation-patterns.md`：事件驱动拼图/网格动画模式（`逻辑状态 + 显示插值`）与无头时序建议。
- `assets/new-game-template.tsx`：可运行的确定性小游戏模板。
- `assets/touch-grid-template.tsx`：可运行的触摸优先网格模板（场景滑动输入 + 确定性 tick 循环）。
- `assets/puzzle-grid-template.tsx`：可运行的事件驱动网格动画模板（`idle -> animating -> idle`）。
- `assets/keypress-arrow.mjs`：生成 `keypress` 宏事件文件，供 `1gameplay step --event-file` 使用。
- `assets/swipe.mjs`：生成 `pointer.down/move/up` 滑动事件文件，供触摸流程使用。

## 完成定义检查清单

始终必做：

1. 确认并记录用户优先级：回放调试、浏览器构建产物，或两者都要。

当用户选择回放调试时必做：

2. `1gameplay create` 成功。
3. 使用与玩法匹配的事件（键盘游戏用键盘事件，触摸游戏用指针/触摸事件）执行 `1gameplay step` + `frame query --select store:state` 成功。

当用户选择浏览器构建产物时必做：

4. `1game build` 成功并产出浏览器 bundle。
5. 浏览器/手工测试确认控制、布局与交互手感。

当用户选择两者时必做：

6. 完成上述所有“回放调试 + 浏览器构建”要求。

强制收尾要求：

7. 结束回复前必须询问回放交付问题（查看已有记录 / 重新生成 `.1gamerecord` / 导出回放 HTML）。

条件项：

8. 若用户请求回放分享，`1gameplay bundle-player-html --single-html` 必须成功。
