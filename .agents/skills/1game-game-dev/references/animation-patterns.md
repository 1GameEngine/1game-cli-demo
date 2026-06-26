# 事件驱动网格解谜的 1Game 动画模式

本指南用于“单次用户操作触发短时可视动画（如 2048 的滑动/合并）再落稳状态”的拼图/网格类游戏。

## 适用类型

当玩法具备以下特征时使用本模式：

- 输入驱动（`onKeyDown`、滑动、点击），而非持续自动移动。
- 每回合确定性推进（一次动作 -> 一个确定的下一状态）。
- 需要跨多帧呈现视觉动画（`useFrame`）。

典型生命周期：

1. 空闲：等待一次输入。
2. 接收动作：计算逻辑结果。
3. 动画阶段：从旧位置插值到新位置。
4. 落稳：提交权威状态。
5. 回到空闲。

## 推荐状态拆分

将权威逻辑状态与显示插值状态分离：

- `grid`：权威棋盘状态，用于规则与断言。
- `displayTiles`：仅渲染快照，服务动画过程。
- `anim`：动画状态（`phase`、`elapsedMs`、`durationMs`）。

最小结构：

```ts
type AnimPhase = 'idle' | 'slide' | 'spawn';

type GameState = {
  grid: number[][];
  displayTiles: { id: string; value: number; fromRow: number; fromCol: number; toRow: number; toCol: number }[];
  anim: { phase: AnimPhase; elapsedMs: number; durationMs: number };
};
```

规则：

- 仅在 `anim.phase === 'idle'` 时接收输入。
- 随机生成与合并决策应写入 `grid`，不要放在纯渲染字段里。
- 动画时钟通过 `useFrame + commitChange` 更新。

## 帧更新约定

仅在动画阶段推进动画：

```tsx
useFrame((frame) => {
  const dtMs = Math.min(frame.deltaSeconds, 0.05) * 1000;
  commitChange('anim:tick', (draft) => {
    if (draft.anim.phase === 'idle') return;
    draft.anim.elapsedMs += dtMs;
    if (draft.anim.elapsedMs < draft.anim.durationMs) return;
    finalizeAnimation(draft);
  });
});
```

在一次事务中完成落稳：

- 落稳 `grid`。
- 从落稳后的 `grid` 重建 `displayTiles`。
- 将 `anim` 重置为空闲。

## 插值辅助函数

使用归一化进度 `t` 与 easing：

```ts
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutCubic(t: number): number {
  const x = clamp01(t) - 1;
  return x * x * x + 1;
}
```

渲染位置计算：

- `progress = easeOutCubic(anim.elapsedMs / anim.durationMs)`
- `displayX = lerp(fromX, toX, progress)`
- `displayY = lerp(fromY, toY, progress)`

## 动画游戏的无头调试（`1gameplay`）

`1gameplay step` 每步严格应用传入的 `--ms`，不会自动等待你的游戏进入 `anim.phase === 'idle'`。

推荐流程：

1. 注入一次动作事件。
2. 用 `--ms >= anim.durationMs + buffer` 进行步进（`buffer` 建议先用 `20~40` ms）。
3. 查询 `store:state` 并断言 `anim.phase === 'idle'`。
4. 若仍在动画中，再执行一次无输入步进。

最小可执行流程（先拿真实 `sceneStableUid`，再注入）：

1. 先执行 `frame query --select render --payload summary`（或 `--select 'hit:point=<x>,<y>' --payload full`）拿到真实 `sceneStableUid`。
2. 将该 stableUid 填入注入事件，不要写 scene name。

示例：

```bash
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select render --payload summary
pnpm exec 1gameplay step out/debug.1gamerecord --ms 160 --event '{"type":"keypress","sceneStableUid":"<sceneStableUid>","data":{"code":"ArrowLeft"}}'
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload full
```

断言建议：

- 用权威字段（`grid`、score、phase）判断正确性。
- 显示插值字段只作为临时诊断信息。
