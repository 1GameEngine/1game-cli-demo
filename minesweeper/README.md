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

本地预览：用浏览器打开 `out/index.html`。
