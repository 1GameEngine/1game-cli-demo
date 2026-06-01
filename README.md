# 触屏扫雷小游戏

基于 [1Game](https://github.com/1GameEngine) 引擎开发的简单扫雷游戏，遵循 `@1game/skill` 开发规范实现。

## 玩法

- **点击格子**：揭开格子（首次点击保证不是雷）
- **插旗模式**：点击底部「揭开 / 插旗中」按钮切换模式，在插旗模式下点击格子可插旗/取消插旗
- 揭开所有非雷格子即获胜，踩到雷则游戏结束
- 9×12 棋盘，共 15 颗雷

## 开发

```bash
npm install
npm run build
```

构建产物在 `out/` 目录。本地预览：

```bash
python3 -m http.server 4173 -d out
```

然后访问 http://localhost:4173

## 单文件构建

```bash
npm run build:single
```

生成单个 `out/index.html`，可直接在浏览器中打开。

## 调试

```bash
npm run gameplay:create
npm run gameplay:list
```
