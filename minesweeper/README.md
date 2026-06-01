# 触屏扫雷

基于 [1Game](https://www.npmjs.com/package/@1game/engine-bundle) 的竖屏触屏扫雷小游戏（9×12，18 颗雷）。

## 玩法

- **点击格子**：揭开（首次点击保证安全区，不会踩雷）
- **插旗**：点底部「插旗」进入插旗模式，再点格子标记/取消地雷
- **重新开始**：清空棋盘再来一局
- 揭开所有非雷格子即胜利；点到雷则失败并显示全部地雷

## 开发与构建

```bash
cd minesweeper
pnpm install
pnpm build
```

在浏览器中打开 `out/index.html` 即可游玩。

单文件 HTML（便于分享）：

```bash
pnpm exec 1game build --singleHtml
```

## 技术说明

- 游戏逻辑在 `src/game.tsx`，使用 `@1game/engine-bundle` 与 `createGameStore` + `commitChange`
- 场景尺寸 360×640，针对触屏竖屏布局
- 状态可回放调试：`pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord`
