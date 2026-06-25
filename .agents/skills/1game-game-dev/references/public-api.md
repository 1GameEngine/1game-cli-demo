# 1Game 公开 API 与命令参考

本参考面向仅依赖公开 npm 包的独立游戏项目。

命令启动器说明：

- 本技能示例使用 `pnpm exec`。
- 若项目使用 npm，请用 `npx` 作为等价启动方式。

## 包说明

### `@1game/engine-bundle`

用于游戏运行时 API 与公开类型导出。

Worker 侧游戏代码应从这里导入：

```tsx
import { createGameStore, renderGame, useFrame, useAudio } from '@1game/engine-bundle/runtime/worker';
```

主线程自定义宿主可从这里导入：

```ts
import { createWorkerEngine } from '@1game/engine-bundle/runtime/main';
```

多数项目不需要自定义主线程宿主，因为 `1game build` 会自动生成。

### `@1game/cli`

安装后提供 `1game` 命令。

命令：

- `1game init [project-name]`：创建新游戏项目（包含 `.gitignore`，默认忽略 `out/`、`*.1gamerecord`、`dist/` 及常见产物）。
- `1game build [--target web|single-file|worker] [--entry path] [--outDir path]`：构建浏览器应用或 worker 包。

默认配置文件 `1game.config.ts`：

```ts
export default {
  entry: 'src/game.tsx',
  outDir: 'out',
  target: 'web',
};
```

默认构建输出（`--target web`）：

- `out/index.html`
- `out/game.worker.js`
- `out/worker-bootstrap.js`

单文件 HTML 输出（`--target single-file`）：

- `out/index.html`

Worker 产物（`--target worker`）：

- `out/game.worker.js`

### `@1game/cli-1gameplay`

安装后提供 `1gameplay` 命令。该包仅用于 CLI，不要在游戏代码中 import。

命令：

- `1gameplay create --entry <path> --out <file.1gamerecord>`。推荐输出到 `out/` 下（如 `out/debug.1gamerecord`），便于和 `1game build` 产物放在一起，并匹配 `1game init` 生成的默认 `.gitignore`。
- `1gameplay step <file.1gamerecord> [--ms <n>=100] [--repeat <n>] [--event <json>] [--event-file <path>] [--from-frame <seq>] [--capture-console off|error|warn|info|log|debug|all] [--console-max-per-step <n>] [--console-max-bytes <n>]`
- `1gameplay comments add <file.1gamerecord> --at <seq|last> --body <text> [--author-id <id>] [--anchor-json <json>] [--comment-id <id>]`
- `1gameplay frames list <file.1gamerecord> [--from <n>] [--to <n>]`（`--from`/`--to` 必须是 `>= 0` 的整数，且 `from <= to`）
- `1gameplay frame query <file.1gamerecord> --at <seq|last> --select <expr>... [--payload summary|full]`
- `1gameplay frame diff <file.1gamerecord> --from <seq> --to <seq|last> --select <expr>... [--payload summary|full]`
- `1gameplay frame simulate <file.1gamerecord> --from <seq|last> --ms <n> [--event <json> | --event-file <path>]... --select <expr>... [--payload summary|full]`
- `1gameplay frame batch <file.1gamerecord> --plan-file <path> [--payload summary|full]`
- `1gameplay frame screenshot <file.1gamerecord> --at <seq|last> --out <file.png|jpg> [--scene-stable-uid <stableUid>] [--width <n>] [--height <n>] [--dpr <n>] [--format png|jpeg] [--quality <1-100>]`（依赖环境中存在 Playwright Chromium；缺失时执行 `npx playwright install chromium`）
- `1gameplay bundle-player-html <file.1gamerecord> --out <replay.html> [--title <s>] [--single-html]`（推荐 `--out out/replay.html`，便于与 `out/` 产物统一忽略；默认导出 `replay.html` + `player.bundle.js` + 复制出的 `.1gamerecord`；`--single-html` 只导出一个内联 bundle + record base64 的 HTML）
- `1gameplay frames delete <file.1gamerecord> --ranges <spec> [--compact]`

归档是常规 SQLite 支撑的 `.1gamerecord` 文件，不是目录。

环境排障：

- 若 `1gameplay` 报 `better-sqlite3` 绑定缺失，请放行原生构建脚本（`pnpm approve-builds`）或配置 `pnpm.onlyBuiltDependencies` 允许 `better-sqlite3`，然后重装依赖。
- 若 `1game build` 报缺少 esbuild 二进制，同样按上述方式放行/安装 esbuild 构建脚本。

单步标准检查可省略 `--ms`（默认步进间隔 `100` ms）。使用 `--repeat`（或调试时序敏感问题）时，需显式传入 `--ms`（如实时循环用 `--ms 16`，固定 tick 用游戏对应间隔）。

通过 `--event` / `--event-file` 传入的无头事件，遵循运行时 worker 事件类型：

- `touch`（指针按下/移动/释放快照）
- `hover`
- `keyboard`（当前所有按下按键的快照）
- `visibleChange`

CLI 也支持宏事件，并会展开为运行时 worker 事件：

- `click` → `touch` down + up
- `keypress` → `keyboard` press + release
- `keydown` → 将按键加入场景按下集合并发送 `keyboard` 快照
- `keyup` → 从场景按下集合移除按键并发送 `keyboard` 快照
- `pointer.down` → 将指针写入活跃指针集合（touch down）
- `pointer.move` → 更新 touch 快照中的活跃指针坐标
- `pointer.up` → 从活跃快照移除指针并输出 `removedPointers`

`keydown`、`keyup` 与 `pointer.*` 是面向 schema v7 归档的 **1gameplay CLI 宏**，该 schema 采用逐帧统一输入快照（`keyboard` + `touch`）。

指针宏细节：

- `pointer.up` 使用活跃 touch 快照中的指针位置（`removedPointers`）。
- 若释放位置与按下位置不同，请在 `pointer.up` 前注入 `pointer.move`。

`1gameplay step` 可省略 `--ms`；默认步进间隔为 `100` ms。

若需要不用宏的底层控制，可直接发送运行时 `keyboard` 事件：

- `keyboard` 且 `data` 非空数组：表示完整“当前按下按键快照”
- `keyboard` 且 `data: []`：释放该 scene 中所有按键

常用选择器：

- `runtime`
- `events`
- `logs`
- `logs:level=<error|warn|info|log|debug>`
- `store:dump`
- `store:frame`
- `store:state`
- `render`
- `render:sceneStableUid=<sceneStableUid>`
- `hit:point=<x>,<y>:sceneStableUid=<sceneStableUid>[:mode=clickable|any][:pick=top|all]` —— Worker 内场景空间命中测试（语义同 DSL `nodeFromPoint` / `nodesFromPoint`：z 顺序、`hidden`、`overflowVisible`、拦截、可点击性）。默认 `mode=clickable`（匹配交互命中）；默认 `pick=top`（最深单命中）。`mode=any` 用于几何命中；`pick=all` 以**优先级顺序**列出该点全部命中目标（高优先级在前）。`items[0]` 始终与 `pick=top` 一致；`hidden` 节点会被过滤；`mode=clickable` 仅返回可点击目标；`touchInterceptMode='intercepted'` 会在该分支停止向下搜索（与指针命中一致）。结果最多 256 条。**Top** 输出：`{ hit: true, stableUid: "<uid>", stableChain: ["<sceneUid>", ...] }`，未命中为 `{ hit: false, stableUid: null, stableChain: [] }`。**All** 输出：`{ hit: boolean, count: number, items: [{ stableUid, stableChain }, ...] }`，满足 `hit === count > 0`。`stableUid` 片段格式为 `sid@k_<encodeURIComponent(String(key))>` 或 `sid@i_<index>`（无 `:`，可安全用于 CLI `:` 分段）。未知 `sceneStableUid` 以 NOT_FOUND 失败（退出码 `3`）。与 `render` 和实时 store 视图一致，该选择器会重放归档后再查询 worker。
- `hit:sceneStableUid=<sceneStableUid>:uid=<stableUid>[:shape=polygon|aabb][:space=scene|local][:include=meta,path,matrix,polygon,aabb]` —— **节点命中区域快照**（scene/local 空间 polygon/AABB）、推导出的**可点击性**（与指针命中规则一致）、`touchInterceptMode`，可选 `pathStableUids` / `transformMatrix`。默认：`shape=polygon`、`space=scene`、`include=meta,path`。若仅要包围盒且不需完整 polygon，用 `shape=aabb`。`uid=*` 表示该 scene 下首个非 scene 节点；也可先用 `hit:point=…` 取得 `stableUid` 再传入 `uid=`。scene/node 不存在时返回 `NOT_FOUND`（退出码 `3`）。它与 `hit:point=…` 不同：这里描述“某个节点本身区域”，不是“某坐标下命中的节点”。旧 `node=` 参数不再支持。

错误输出契约：

- `step`、`frame query|diff|simulate|batch`、`comments add` 成功时都输出 JSON envelope。
- `frame query|diff|simulate|batch` 总是在 stdout 输出 JSON envelope（`1gameplay.frame` / `1gameplay.error`）。
- `frames list` 成功 schema 为 `1gameplay.frames.list.v1`（摘要行在 `result.rows`）。
- 非 frame 命令失败时，默认在 stdout 输出 `1gameplay.error` schema 的 JSON。

### `@1game/solid-particles-proton`

可选粒子扩展。安装：

```bash
pnpm add @1game/solid-particles-proton proton-engine
```

可用 `ParticlesEmitter` 将视觉粒子效果映射到 1Game `<draw>` 节点。

## 运行时 API

### `createGameStore(initialState, options)`

创建响应式游戏 store，以及状态变更与历史辅助能力。

常见返回值：

- `store`：在 JSX 中使用的响应式状态。
- `commitChange(label, mutator)`：事务式状态修改入口。
- `storeHistory`：供回放、seek 与 `1gameplay` 使用的历史对象。

适合 Agent 可调试游戏的推荐选项：

```ts
{
  enableHistory: true;
}
```

### `renderGame(root, options?)`

启动 Worker 侧游戏。

用法：

```tsx
renderGame(() => <Game />, { bindStore: storeHistory });
```

将根级 `storeHistory` 通过 `bindStore` 传入，这样 `1gameplay` 才能查看时光回溯状态。

### `useFrame(callback)`

在组件内每引擎帧执行一次回调，用于模拟 tick。

作用域规则：

- `useFrame` 必须在 `renderGame()` 渲染的组件内部调用。
- 不要在模块顶层调用 `useFrame`。

最佳实践：

- 运动积分时对过大 `deltaSeconds` 做 clamp。
- `deltaSeconds` 已是“秒”单位，可直接用于速度计算。
- 在 `useFrame` 内用 `commitChange` 更新状态。

### `useAudio()`

Worker 侧音频辅助：

- `loadAudio(resourceId)`
- `playOnce(resourceId, { volume, playbackRate })`

背景音乐或循环音效建议使用由 store 驱动的声明式 `<audio>` 状态。

## JSX 标签

标签均为小写 JSX 元素：

- `<scene>`：场景根。
- `<group>`：分组与嵌套。
- `<node>`：基础图形节点。
- `<text>`：文本节点。
- `<image>`：图片节点。
- `<line>`：线段节点。
- `<draw>`：自定义绘制数据。
- `<audio>`：音频节点。

常见属性：

- 位置与尺寸：`x`、`y`、`width`、`height`。
- 可见性：`hidden`、`alpha`、`zIndex`。
- 形状：`shape="rect"`、`shape="circular"`、`shape="triangle"`、`shape="roundedRect(8 8 8 8)"`、`shape="polygon(50,0 100,100 0,100)"`。
- 颜色与边框：`backgroundColor`、`foregroundColor`、`border`、`borderWidth`、`borderColor`。
- 文本：`text`、`textSize`、`textColor`、`textAlign`、`textVerticalAlign`、`autoWrap`。
- 图片：使用 `source={localImage}`（推荐本地导入），并可配合 `imageFit`、`imageCutArea`。

图片资源示例：

```tsx
import playerShip from './assets/player-ship.svg';

function SpriteExample() {
  return (
    <scene name="main" width={320} height={180}>
      <image source={playerShip} x={32} y={48} width={48} height={48} imageFit="contain" />
    </scene>
  );
}
```

本地图片导入会被构建流程内联，且必须小于 1MB。对于仅使用 `@1game/engine-bundle/runtime/worker` 的项目，优先使用本地导入资源；若要接入外链资源，请按你项目实际暴露的资源 API 规范处理。

## 事件

指针与手势处理器：

- `onClick`
- `onPointerDown`
- `onPointerMove`
- `onPointerUp`
- `onPointerUpOutside`
- `onPointerCancel`
- `onPointerEnter`
- `onPointerLeave`
- `onHover`
- `onDragStart`
- `onDrag`
- `onDragEnd`

可通过追加 `Capture` 使用捕获阶段变体。

键盘处理器为 scene 级：

- `onKeyDown`
- `onKeyUp`

键盘 `detail.code` 使用标准 Web `KeyboardEvent.code` 字符串（不是 1Game 自定义枚举）。

常见按键码：

- 方向键：`ArrowLeft`、`ArrowRight`、`ArrowUp`、`ArrowDown`
- WASD：`KeyW`、`KeyA`、`KeyS`、`KeyD`
- 常见动作键：`Space`、`Enter`、`Escape`、`Tab`、`Backspace`
- 修饰键：`ShiftLeft`、`ShiftRight`、`ControlLeft`、`ControlRight`、`AltLeft`、`AltRight`、`MetaLeft`、`MetaRight`
- 数字行：`Digit0` 到 `Digit9`

标准参考：

- MDN `KeyboardEvent.code`：https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values
- W3C UI Events KeyboardEvent code Values：https://www.w3.org/TR/uievents-code/

事件对象常见字段：

- `x`、`y`：场景坐标。
- `target`、`currentTarget`。
- `pointerId`。
- `detail`。
- `stopPropagation()`。
- `stopImmediatePropagation()`。
