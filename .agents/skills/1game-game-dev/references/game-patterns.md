# 1Game 游戏实现模式

在创建或修改基于公开包的 1Game 项目时，优先采用这些模式。

## 状态结构

建议从“明确阶段 + 小型嵌套对象”开始：

- `phase`：`menu`、`playing`、`paused`、`won`、`lost`。
- `player`：位置、速度、生命、冷却。
- `enemies`：带稳定 ID 的敌人数据数组。
- `items` / `projectiles`：带稳定 ID 的数组。
- `input`：当前按住方向或最后动作。
- `rng`：当玩法含随机性时，保存确定性 seed/cursor。

避免存储 `scoreText` 这类派生字段，渲染时从 `store.score` 计算。

## 更新循环

模拟逻辑使用 `useFrame`：

```tsx
useFrame((frame) => {
  const dt = Math.min(frame.deltaSeconds, 0.05);
  commitChange('tick', (draft: GameState) => {
    if (draft.phase !== 'playing') return;
    updatePlayer(draft, dt);
    updateEnemies(draft, dt);
    resolveCollisions(draft);
  });
});
```

规则：

- 对 `dt` 进行 clamp，防止标签页挂起后一次跨过碰撞。
- 辅助函数应对 draft 保持“纯逻辑”。
- 自动生成游戏优先使用简单 AABB 或圆形碰撞。
- `commitChange` 标签应有业务语义，如 `tick`、`spawn enemy`、`collect coin`、`player hit`。

## 确定性反模式

避免破坏回放/调试一致性的写法：

- 在玩法状态迁移里直接使用未播种的 `Math.random()`。
- 用 `Date.now()` 或墙钟时间直接驱动玩法规则。
- 在 store 外维护模块级可变玩法状态（如 `let swipeStartX`）。

推荐方式：

- 把玩法相关状态都放进 store（`draft`），包括 RNG seed/cursor、手势数据。
- 使用确定性辅助函数（如 `nextRandom(seed)`），并回写更新后的 seed。

## 重开 / 重置状态

重置必须在 `commitChange` 内通过修改 draft 完成：

```tsx
function makeInitialState(): GameState {
  return {
    phase: 'ready',
    score: 0,
    player: { x: 120, y: 90, hp: 3 },
  };
}

function restartGame() {
  commitChange('restart', (draft: GameState) => {
    Object.assign(draft, makeInitialState());
  });
}
```

硬性规则：

- ✅ 原地修改 `draft`（`Object.assign`、逐字段赋值、替换 draft 上的数组字段）。
- ❌ 不要在 `commitChange` mutator 中 `return makeInitialState()`。

## 输入

虚拟按钮示例：

```tsx
<group
  x={232}
  y={128}
  width={72}
  height={36}
  clickable
  onClick={() => {
    commitChange('jump', (draft: GameState) => {
      if (draft.player.grounded) draft.player.vy = -220;
    });
  }}
>
  <node x={0} y={0} width={72} height={36} shape="roundedRect(8 8 8 8)" backgroundColor="#2563eb" />
  <text x={0} y={8} width={72} height={18} text="Jump" textAlign="center" textColor="#fff" textSize="16" />
</group>
```

场景键盘示例：

```tsx
<scene
  name="main"
  width={320}
  height={180}
  onKeyDown={(e) => {
    commitChange('key down', (draft: GameState) => {
      if (e.detail?.code === 'ArrowLeft') draft.input.left = true;
      if (e.detail?.code === 'ArrowRight') draft.input.right = true;
    });
  }}
  onKeyUp={(e) => {
    commitChange('key up', (draft: GameState) => {
      if (e.detail?.code === 'ArrowLeft') draft.input.left = false;
      if (e.detail?.code === 'ArrowRight') draft.input.right = false;
    });
  }}
>
```

浏览器焦点说明：

- 场景键盘事件需要浏览器运行时下 canvas/scene 获得焦点。
- 键盘重玩法推荐 UX：先处于 `ready` 阶段，先显示“点击/触摸开始”再期待键盘输入。

触摸滑动（场景级手势）示例：

```tsx
<scene
  name="main"
  width={360}
  height={640}
  onPointerDown={(e) => {
    commitChange('swipe:start', (draft: GameState) => {
      draft.input.swipeStart = { x: e.x, y: e.y };
    });
  }}
  onPointerMove={(e) => {
    commitChange('swipe:move', (draft: GameState) => {
      draft.input.swipeLast = { x: e.x, y: e.y };
    });
  }}
  onPointerUp={(e) => {
    commitChange('swipe:end', (draft: GameState) => {
      const from = draft.input.swipeStart;
      if (!from) return;
      const dx = e.x - from.x;
      const dy = e.y - from.y;
      const threshold = 24;
      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
      draft.input.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      draft.input.swipeStart = null;
      draft.input.swipeLast = null;
    });
  }}
>
```

手势路由说明：

- 全屏滑动通常用场景级 handler 最简单。
- 子节点若 `clickable` 且 `zIndex` 更高，可能拦截指针事件。
- 弹窗/结算遮罩场景下，应提高遮罩 `zIndex`，并按需禁用下层点击区域。

## 碰撞辅助函数

将碰撞辅助函数放在组件外：

```ts
type Rect = { x: number; y: number; width: number; height: number };

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
```

碰撞结果若影响玩法，必须写回 store。

网格/贪吃蛇碰撞说明：

- 贪吃蛇类游戏里，如果同一 tick 尾巴会移走，头进入“当前尾格”可能是合法的。
- 自碰撞应按“移动后”身体布局判断，不能只看“移动前”完整身体。
- 将排队方向（`nextDirection`）与已生效方向分开，避免瞬时反向输入 bug。

## 资源与图片

需要图片时使用 `<image source={asset} />`。优先导入本地图片，让构建流程内联为 `ImageSource`：

```tsx
import playerIcon from './assets/player-icon.svg';

function PlayerBadge() {
  return <image source={playerIcon} x={20} y={20} width={32} height={32} imageFit="contain" />;
}
```

本地图片导入会被完整内联，大小上限 1MB。对于仅使用 `@1game/engine-bundle/runtime/worker` 的项目，推荐优先使用本地导入资源；如果确实需要外链资源与加载态控制，请按项目中实际暴露的资源 API 接入。

SVG 图片渲染示例：

```tsx
import logo from './assets/logo.svg';

function SvgTitle() {
  return (
    <scene name="main" width={320} height={180} backgroundColor="#0f172a">
      <node x={76} y={32} width={168} height={92} shape="roundedRect(12 12 12 12)" backgroundColor="#1e293b" />
      <image source={logo} x={96} y={44} width={128} height={64} imageFit="contain" />
      <text
        x={0}
        y={124}
        width={320}
        height={24}
        text="SVG 资源已作为图片渲染"
        textAlign="center"
        textColor="#e2e8f0"
        textSize="16"
      />
    </scene>
  );
}
```

对于简单自动生成游戏，优先用基础图形与文本：构建更快、调试更简单、无需素材加载。

## 音频

一次性音效示例：

```tsx
import { onMount } from 'solid-js';
import { useAudio } from '@1game/engine-bundle/runtime/worker';

function Game() {
  const { loadAudio, playOnce } = useAudio();

  onMount(() => {
    void loadAudio('hit.mp3');
  });

  return <node clickable onClick={() => playOnce('hit.mp3', { volume: 0.8 })} x={0} y={0} width={40} height={40} />;
}
```

状态驱动背景音乐示例：

```tsx
<audio src="bgm.mp3" playing={store.phase === 'playing'} loop volume={0.5} />
```

音频应以浏览器/手工测试为主。`1gameplay` 更适合验证确定性逻辑与渲染数据，不适合主观音频时序体验。

## 布局与镜头

- 选定固定逻辑分辨率，如 `320x180`、`360x640` 或 `640x360`。
- 使用 `scene` 尺寸作为游戏坐标系。
- 玩家与敌人位置使用世界坐标。
- 做镜头移动时，将 `camera.x`、`camera.y` 存入状态，并统一偏移 group 或 scene 视口。
- 对 HUD、子弹、玩家、敌人、背景有意识设置 `zIndex`。
- 交互 UI 保持在 scene 边界内（`x + width <= scene.width` 且 `y + height <= scene.height`），避免控件重叠或跑出可玩区。
- 弹层/模态若非刻意拦截，不要与实时玩法控件重叠。

## 生成游戏检查清单

- 可通过 `pnpm exec 1game build` 构建。
- `src/game.tsx` 从 `@1game/engine-bundle/runtime/worker` 导入。
- Store 使用 `enableHistory: true`。
- `renderGame` 传入 `{ bindStore: storeHistory }`。
- 玩法状态仅通过 `commitChange` 变更。
- `1gameplay create`、`step`、`frame query --select store:state` 可正常执行。
- 玩家动作可通过事件注入或清晰的浏览器交互进行验证。
