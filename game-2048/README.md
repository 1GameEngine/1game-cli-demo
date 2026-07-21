# 2048

基于 1Game 实现的经典 2048，支持方向键 / WASD / 触摸滑动，并带有方块滑动与新生动画。

## 技术栈

| 包 | 版本 | 说明 |
| --- | --- | --- |
| `@1game/skill` | **1.10.0**（最新） | Agent 开发/调试工作流 |
| `@1game/engine-bundle` | 1.9.1 | 游戏运行时 |
| `@1game/cli` / `@1game/cli-1gameplay` | 1.9.1 | 构建与无头回放 |

> 说明：`@1game/engine-bundle@1.10.0` 在 store 响应式更新时会触发 `E_STABLE_UID_COLLISION`（官方 puzzle 模板同样复现），因此运行时对齐到可稳定调试的 1.9.1；技能文档仍使用最新 `@1game/skill@1.10.0`。

## 玩法

- 合并相同数字，冲向 2048
- 输入：方向键、WASD、滑动手势
- 动画：滑动插值（easeOutCubic）→ 新生缩放 → idle 后接受下一次输入

## 开发

```bash
cd game-2048
npm install
npm run build
```

浏览器打开 `out/index.html`。

### 无头调试（1gameplay）

```bash
npx 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
# 记下 create 输出的 sceneStableUids[0]
npx 1gameplay step out/debug.1gamerecord --event '{"type":"keypress","sceneStableUid":"<uid>","data":{"code":"ArrowLeft","ms":180}}'
npx 1gameplay step out/debug.1gamerecord --ms 20 --repeat 15   # 等到 anim.phase === idle
npx 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload full
npx 1gameplay frame screenshot out/debug.1gamerecord --at last --out out/frame.png
```

滑动：

```bash
npx 1gameplay step out/debug.1gamerecord --event '{"type":"swipe","sceneStableUid":"<uid>","data":{"from":{"x":80,"y":300},"to":{"x":280,"y":300},"ms":300}}'
```
