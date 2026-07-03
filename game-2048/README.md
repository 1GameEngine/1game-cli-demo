# 2048 触屏小游戏

基于 1Game 引擎的 4×4 触屏 2048，含方块滑动合并动画。

## 命令

```bash
npm install
npm run build        # 构建到 out/index.html
```

## 玩法

- **滑动操作**：在屏幕上向上下左右滑动即可移动方块
- **合并规则**：相同数字碰撞后合并为两倍
- **动画**：每次移动有 160ms 缓动滑动动画
- **计分**：合并得分，界面显示当前分数与最高分
- **重开**：游戏结束后点击「再来一局」

## 技术要点

- 使用 `@1game/engine-bundle` 的 `createGameStore` + `commitChange` 保证状态可回放
- 逻辑状态（`tiles`）与显示插值（`fromRow/fromCol` → `toRow/toCol`）分离
- `useFrame` 驱动 `anim.phase === 'sliding'` 阶段的动画时钟
- 场景级 `onPointerDown` / `onPointerUp` 识别滑动手势

## 目录

- `src/game.tsx` — 游戏入口
- `1game.config.ts` — 构建配置
- `out/` — 构建产物（已 gitignore）
