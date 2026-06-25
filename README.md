# 别踩白块

基于 [1Game](https://github.com/1GameEngine/1game-engine) 开发的触屏小游戏：只点底部黑块，踩到白块就结束。

## 玩法

- 4×4 方块网格，每行只有一个黑块
- 点击最底行的黑块得分，方块上移并生成新行
- 点到白块游戏结束，可点击「再来一局」重开

## 开发

```bash
npm install
npm run build          # 输出到 out/index.html
npm run build:single   # 单文件 HTML
```

## 调试回放

```bash
npx 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
npx 1gameplay step out/debug.1gamerecord --event '{"type":"click","sceneStableUid":"<uid>","data":{"x":306,"y":470}}'
npx 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload full
```
