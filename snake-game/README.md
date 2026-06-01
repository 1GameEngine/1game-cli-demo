# 触屏贪吃蛇

基于 [1Game](https://www.npmjs.com/package/@1game/engine-bundle) 的简单贪吃蛇小游戏，支持触屏滑动控制方向（也支持键盘方向键 / WASD）。

## 运行

```bash
cd snake-game
pnpm install
pnpm build
```

在浏览器中打开 `out/index.html` 即可游玩。

## 操作

- **滑动**：在游戏区域滑动即可转向（上下左右）
- **点击**：准备界面点击开始；游戏结束后点击重玩
- **键盘**：方向键或 WASD 转向（便于桌面调试）

## 调试回放站点

`1gameplay` 无头调试录制已打包为静态站并部署到 Vercel：

**https://site-five-blush-28.vercel.app/**

- 首页：可玩版本 + 各调试会话单文件 HTML 回放
- 本地重建：`pnpm run build:site`（输出 `out/site/`）
- 部署说明：见 [deploy/README.md](./deploy/README.md)
