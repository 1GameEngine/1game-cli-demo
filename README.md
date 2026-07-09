# 2048

基于 `@1game/skill` 工作流、用 `@1game/engine-bundle` 实现的经典 2048。

## 玩法

- 滑动屏幕或使用方向键合并相同数字
- 目标：合成 **2048**
- 点击「新游戏」或按 `R` 重开

## 命令

```bash
npm install
npm run activate-skill   # 将 1game-game-dev skill 激活到 .cursor/skills/
npm run build            # 输出到 out/（默认 single-file）
```

调试（事件驱动网格）：

```bash
npx 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
npx 1gameplay step out/debug.1gamerecord --event '{"type":"keypress","sceneStableUid":"<uid>","data":{"code":"ArrowLeft","ms":160}}'
npx 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload full
```

## 目录

- `src/game.tsx`：游戏入口
- `1game.config.ts`：构建配置
- `AGENTS.md`：指向 `@1game/skill` 的项目内速查
