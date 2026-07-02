# 触屏 2048 小游戏

基于 [1Game](https://github.com/1GameEngine) 引擎开发的简单触屏 2048 游戏，支持滑动操作与方块移动/合并动画。

## 开发

```bash
npm install
npm run build
```

构建产物在 `out/` 目录，用浏览器打开 `out/index.html` 即可游玩。

## 操作

- **触屏/鼠标**：在屏幕上滑动（上/下/左/右）移动方块
- **键盘**：方向键（需先点击画面获取焦点）

## 技术说明

- 使用 `@1game/engine-bundle` 运行时与 `createGameStore` 管理确定性状态
- 动画采用「逻辑状态 + 显示插值」模式（滑动 140ms + 新方块弹出 100ms）
- 随机生成使用确定性种子，支持 `1gameplay` 回放调试

## Agent 技能

本项目参考 `@1game/skill` 中的 `1game-game-dev` 技能包开发。若要在 Cursor 中激活该技能，请将 `node_modules/@1game/skill/skills/1game-game-dev` 软链接到 `.cursor/skills/` 目录。
