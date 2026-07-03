# 2048 触屏小游戏

基于 [1Game](https://www.npmjs.com/package/@1game/engine-bundle) 开发的经典 2048 拼图游戏，支持触屏滑动操作与方块移动/合并动画。

## 特性

- 触屏滑动控制（上/下/左/右）
- 方块滑动与合并动画（easeOutCubic 缓动）
- 新方块生成缩放动画
- 分数与最高分记录
- 达成 2048 后可继续游戏
- 游戏结束后点击重开
- 键盘方向键与 `R` 重开（调试用）

## 开发与运行

```bash
npm install
npm run build
```

构建产物位于 `out/index.html`，用浏览器打开即可游玩。

## 技术说明

- 使用 `@1game/skill` 技能包指导开发
- 玩法状态通过 `createGameStore` + `commitChange` 管理，支持确定性回放
- 动画采用「逻辑状态 + 显示插值」模式（`idle → sliding → spawning → idle`）
