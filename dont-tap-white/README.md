# 别踩白块

基于 [1Game](https://www.npmjs.com/package/@1game/engine-bundle) 开发的触屏小游戏：黑块从上往下滚动，只点黑色、别碰白块，漏点或踩白即失败。

## 玩法

- 4 列方块持续向下滚动，每行仅 1 个黑块
- 点击黑块得分，速度随分数提升
- 点到白块或黑块滚出底部未点击则游戏结束
- 竖屏触控布局（360×640）

## 开发

```bash
npm install
npm run build
```

构建产物：`out/index.html`，用浏览器打开即可试玩。

## 回放调试

```bash
npx 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
npx 1gameplay step out/debug.1gamerecord --event '{"type":"click","sceneStableUid":"1@i_0","data":{"x":45,"y":60}}'
npx 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload summary
```
