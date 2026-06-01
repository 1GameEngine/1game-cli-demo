# 触屏扫雷（1Game）

基于 [@1game/skill](https://www.npmjs.com/package/@1game/skill) 与 1Game 引擎的简易扫雷小游戏，面向手机触屏操作。

## 玩法

- **点击格子**：翻开（首次点击后生成地雷，首格安全）
- **插旗按钮**：切换插旗模式，再点格子可插旗/取消
- **重新开始**：随时重开一局
- 键盘：`F` 切换插旗，`R` / `Enter` 重开

9×12 棋盘，15 颗雷。

## 开发

```bash
cd minesweeper
npm install
npm run build          # 输出到 out/index.html
npm run build:single   # 单文件 HTML
```

本地预览：用浏览器打开 `out/play.html`（部署构建后）或先 `npm run build` 再打开 `out/index.html`。

## 在线预览（Vercel）

**入口（游戏 + 调试录播列表）**：https://out-seven-tau.vercel.app

| 页面 | 地址 |
|------|------|
| 玩游戏 | https://out-seven-tau.vercel.app/play.html |
| 自动化测试录播 | https://out-seven-tau.vercel.app/replay-autotest.html |
| 胜利流程录播 | https://out-seven-tau.vercel.app/replay-win.html |
| 遮罩重开验证 | https://out-seven-tau.vercel.app/replay-overlay.html |
| 基础调试录播 | https://out-seven-tau.vercel.app/replay-debug.html |

重新部署（需本机已有 `out/*.1gamerecord`，并设置环境变量 `VERCEL_TOKEN`）：

```bash
npm run build:deploy
npx vercel deploy out --prod --yes --scope linfaxins-projects
```
