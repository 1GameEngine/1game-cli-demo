# 1Game 调试手册

本手册用于 AI Agent 调试基于公开包的 1Game 项目。

## 核心循环

1. 先确认用户目标：回放调试、浏览器构建产物，或两者都要。
2. 若范围包含浏览器构建产物，尽早运行 `1game build` 以提前暴露语法与打包错误。
3. 创建全新玩法归档。
4. 以已知步数推进帧。
5. 查询状态与渲染摘要。
6. 每次仅注入一个玩法动作（或在一步中注入一个完整手势）。
7. 比较事件前后帧差异。
8. 修最小根因，然后重建归档并复测。

## 全新归档

```bash
rm -f out/debug.1gamerecord
pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
```

仅在你明确需要“干净重跑”时删除归档；有价值的 bug 归档应保留供复盘。

## 逻辑没有变化

执行：

```bash
pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --repeat 10
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload full
```

`1gameplay step` 在单步检查时可省略 `--ms`（默认 `100` ms）。使用 `--repeat` 或调试时序问题时，应显式传入 `--ms`。

检查点：

- 是否使用 `createGameStore(..., { enableHistory: true })`。
- `renderGame` 是否传入 `{ bindStore: storeHistory }`。
- `useFrame` 或事件处理器是否调用了 `commitChange`。
- `commitChange` 是否在改 draft，而不是改只读 store。
- phase 守卫是否意外阻塞了更新。

## 事件驱动 + 动画游戏（需落稳到 idle）

对于“每次动作后都会动画”的拼图/网格游戏，一次 `step` 往往落在动画中间帧。

推荐策略：

1. 精确注入一个玩法动作（按键或滑动）。
2. 用 `--ms >= animationDurationMs + buffer` 进行步进（`buffer` 可先取 `20~40` ms）。
3. 查询 `store:state` 并断言动画守卫回到 idle（如 `anim.phase === 'idle'`）。
4. 若仍在动画中，再执行一次无输入步进并重查。

示例：

```bash
pnpm exec 1gameplay step out/debug.1gamerecord --ms 180 --event '{"type":"keypress","sceneStableUid":"<sceneStableUid>","data":{"code":"ArrowLeft"}}'
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload full
```

断言建议：

- 回归判断优先看权威逻辑字段（`grid`、score、phase）。
- 显示插值字段（`displayX`、`displayCol`、`animProgress`）仅作临时诊断。

## 命中区域与可点击性（frame `hit:`）

当你需要知道节点在场景空间中“哪里可点”，或是否按 DSL 规则表现为可点击时使用；不要只靠 render JSON 猜测。

```bash
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last \
  --select 'hit:sceneStableUid=<sceneStableUid>:uid=<stableUid>:shape=aabb:include=meta,path,aabb'
```

- `<stableUid>` 来自同一回放会话里 `hit:point=…` 返回的 `stableUid`，或 `render` 之外的 DSL 调试路径。
- 若只做快速检查且不想复制 uid，可用 `uid=*`（该 scene 下首个非 `scene` 节点）。
- 典型工作流：先 `hit:point=<x>,<y>:sceneStableUid=<sceneStableUid>` 取 `stableUid`，再 `hit:sceneStableUid=<sceneStableUid>:uid=<stableUid>:…` 查区域。
- 需要顶点或世界坐标 `transformMatrix` 时，加入 `include=polygon`（可选再加 `include=matrix`）。
- `include` 默认 `meta,path`；`shape` 默认 `polygon`，但若 `include` 不含 `polygon` 或 `aabb`，多边形点不会输出。`shape=aabb` 会始终从形状多边形计算轴对齐包围盒。
- 该路径**不会**扣除被遮挡像素；它报告的是经同样命中测试变换后的形状 polygon / AABB。

## 输入未触发

可注入运行时 worker 事件（`touch` / `hover` / `keyboard` / `visibleChange`）或 CLI 宏事件（`click` / `keypress` / `keydown` / `keyup`）。

`keydown` / `keyup` 与 `pointer.down` / `pointer.move` / `pointer.up` 需要 schema v7 `.1gamerecord`（逐帧统一 `frame_input_snapshots`，即 `{ keyboard, touch }`）。
跨命令按住/移动/释放时，使用分开的 `step`（或 `--from-frame`）。
固定 tick 游戏中的滑动/拖拽，优先“一步完整手势”（在一个 `step` 内 `down -> move -> up`），避免手势阶段间额外插入 tick。

最小可执行流程（先拿真实 `sceneStableUid`，再注入事件）：

```bash
# 1) 先取当前回放里的真实 sceneStableUid（推荐先看 render）
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select render --payload summary
# 备选：用 hit 查询返回的 sceneStableUid
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select 'hit:point=100,100' --payload full

# 2) 将上一步返回的 stableUid 填入事件（不要用 scene name）
pnpm exec 1gameplay step out/debug.1gamerecord --event '{"type":"keypress","sceneStableUid":"<sceneStableUid>","data":{"code":"ArrowLeft"}}'
```

```bash
# 宏事件：click / keypress
pnpm exec 1gameplay step out/debug.1gamerecord --event '{"type":"click","sceneStableUid":"<sceneStableUid>","data":{"x":100,"y":100}}'
pnpm exec 1gameplay step out/debug.1gamerecord --event '{"type":"keypress","sceneStableUid":"<sceneStableUid>","data":{"code":"ArrowLeft"}}'

# 原始 keyboard 快照（高级）
pnpm exec 1gameplay step out/debug.1gamerecord --event '{"type":"keyboard","sceneStableUid":"<sceneStableUid>","data":[{"code":"ArrowLeft","key":"ArrowLeft","time":1000,"shift":false,"meta":false,"alt":false,"ctrl":false}]}'
pnpm exec 1gameplay step out/debug.1gamerecord --event '{"type":"keyboard","sceneStableUid":"<sceneStableUid>","data":[]}'

# 标准 event-file 流程（推荐）
mkdir -p scripts
cp node_modules/@1game/skill/skills/1game-game-dev/assets/keypress-arrow.mjs scripts/keypress-arrow.mjs
node scripts/keypress-arrow.mjs ArrowLeft <sceneStableUid> out/keypress-left.events.json
pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --event-file out/keypress-left.events.json

pnpm exec 1gameplay frame diff out/debug.1gamerecord --from 0 --to last --select store:dump --payload full
```

若技能已复制到 `.agents/skills/1game-game-dev`，辅助脚本也可从该目录复制，而不必从 `node_modules` 复制。

确认引擎在同一场景坐标下判定命中的节点（默认遵循交互/可点击规则）：

```bash
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select 'hit:point=100,100:sceneStableUid=<sceneStableUid>' --payload full
```

仅在需要不经过可点击过滤的纯几何结果时，使用 `hit:point=<x>,<y>:sceneStableUid=<sceneStableUid>:mode=any`。

检查点：

- 目标节点是否有 `clickable` 或事件处理器。
- 坐标是否落在该节点的场景边界内。
- 父级 group 是否把节点偏移到注入点之外。
- `hidden`、`alpha`、`zIndex`、重叠可点击节点是否拦截了事件。
- 事件里的 `sceneStableUid` 必须来自当前 render 的 `scenes[].stableUid`（可通过 frame query/render/hit 流程获得），不要把 `<scene name>` 当 identity。

## 滑动 / 拖拽未按预期触发

触摸玩法建议在一步内注入完整滑动：

```bash
pnpm exec 1gameplay step out/debug.1gamerecord --ms 140 \
  --event '{"type":"pointer.down","sceneStableUid":"<sceneStableUid>","data":{"id":1,"x":144,"y":220}}' \
  --event '{"type":"pointer.move","sceneStableUid":"<sceneStableUid>","data":{"id":1,"x":144,"y":170}}' \
  --event '{"type":"pointer.up","sceneStableUid":"<sceneStableUid>","data":{"id":1,"x":144,"y":170}}'
```

关键指针语义：

- 若缺少 `pointer.move`，`pointer.up` 的移除位置会使用最后活跃坐标（通常等于 down），可能导致滑动增量看起来为 0。
- 用 `frame query --select events --payload full` 验证触摸快照坐标。
- 固定 tick 游戏里，除非你有意引入额外 tick，否则避免把一次滑动拆成三次 `step`。

## 视觉输出与状态不一致

执行：

```bash
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select store:state --select render:sceneStableUid=<sceneStableUid> --payload full
```

若 store 正确但 render 错误：

- 确认 JSX 读取的是 `store`，不是过期局部变量。
- 确认尺寸数值合法且非负。
- 确认 scene 宽高与目标坐标系一致。
- 确认 `zIndex` 顺序与 `hidden` 标志正确。
- 确认文本节点有足够 `width`、`height`、`textSize`。
- 确认 `<image>` 节点使用 `source={...}`，且本地导入图片未超过 1MB 内联上限。
- 外部图片需检查资源加载状态与浏览器控制台 URL/CORS/解码错误。

## 浏览器表现与 1gameplay 不一致

启动静态服务：

```bash
pnpm exec 1game build
python3 -m http.server 4173 -d out
```

然后检查：

- 浏览器控制台报错。
- 直接用 `file://` 打开 `out/index.html` 导致的 Worker 加载错误。
- 资源 URL 与 CORS 行为。
- 需要用户手势触发的音频限制。
- 移动端视口缩放与指针坐标差异。

对于固定 tick 游戏（`useFrame` + 累加器），无头步进节奏可能与浏览器体感不同：

- 不要假设 `repeat N` 就一定等于 `N` 次格子移动。
- 应通过 `store:state` 迁移（`phase`、`head`、`score` 等）断言，不要只看步数。

若使用 `frame screenshot`，请确认已安装 Chromium：

```bash
npx playwright install chromium
```

## 运行时错误

若 `1gameplay` 以退出码 `5` 失败，请查询邻近帧并检查 stderr/stdout。常见原因：

- 在 `useFrame` 或事件处理器内部抛错。
- 导入了未安装或非法的包路径。
- 在 worker 入口使用了 DOM API。
- 依赖仅浏览器可用的全局对象，导致无头回放不可用。
- 构建脚本被阻止，`better-sqlite3` 原生绑定缺失（执行 `pnpm approve-builds` 后重装）。

为方便自动化失败解析，非 frame 命令默认会在 stdout 以 JSON 形式输出失败信息（`schema: 1gameplay.error`）。

## 回归验证配方

修复 bug 后，请在 PR 或 issue 中保留一组短命令序列：

```bash
pnpm exec 1game build
rm -f out/debug.1gamerecord
pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --repeat 60
pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --event '{"type":"click","sceneStableUid":"<sceneStableUid>","data":{"x":100,"y":100}}'
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload full
```

注：`click` 宏事件中，`x` 和 `y` 是最小必填字段；`id`、`time`、`durationMs`、`domClientX`、`domClientY` 为可选高级参数。
