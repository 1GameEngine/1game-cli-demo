# 触屏扫雷小游戏

基于 [@1game/skill](https://www.npmjs.com/package/@1game/skill) 工作流与 [1Game](https://www.npmjs.com/package/@1game/engine-bundle) 引擎开发的简单扫雷游戏，针对触屏操作优化。

## 玩法

- **点开格子**：默认模式下点击格子揭开；数字表示周围 8 格中的地雷数。
- **插旗**：点底部「插旗」进入插旗模式，再点格子标记/取消旗帜；左上角显示剩余雷数。
- **重来**：游戏结束或想重开时点「重来」。

9×8 棋盘，共 12 颗雷；首次点击保证不会踩雷。

## 开发

```bash
pnpm install
pnpm build
```

浏览器打开 `out/index.html` 试玩。

单文件构建：

```bash
pnpm run build:single
```

## 调试（1gameplay）

```bash
pnpm run gameplay:create
pnpm run gameplay:step
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload summary
```
