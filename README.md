# 别踩白块

基于 [@1game/skill](https://www.npmjs.com/package/@1game/skill) 与 1Game 引擎开发的触屏小游戏。

## 玩法

- 四列方块自上而下滚动，每行仅有一个黑块。
- 在底部判定区点击黑块得分，点击白块或漏掉黑块则游戏结束。
- 得分越高，滚动速度越快。

## 开发

```bash
npm install
npm run build
```

构建产物位于 `out/index.html`，用浏览器打开即可游玩。

单文件版本：

```bash
npm run build:single
```

## 调试回放

```bash
npm run debug:create
npx 1gameplay step out/debug.1gamerecord --ms 16 --repeat 120
npx 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload full
npm run debug:replay
```
