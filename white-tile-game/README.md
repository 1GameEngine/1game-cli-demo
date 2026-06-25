# 别踩白块

基于 [1Game](https://www.npmjs.com/package/@1game/engine-bundle) 开发的触屏小游戏。黑色方块从上往下滚动，只点黑块、别碰白块；漏点或点错即游戏结束。

## 玩法

- 4 列方块持续向下滚动，每行恰好 1 个黑块
- 点击黑块得分，每 5 分滚动速度略微提升
- 点击白块或让黑块滑过底部判定区 → 游戏结束
- 支持记录最高分，可一键重开

## 开发

```bash
npm install
npm run build
```

构建产物位于 `out/index.html`，用浏览器打开即可游玩（推荐手机或触屏设备）。

## 调试回放

```bash
npx 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
npx 1gameplay step out/debug.1gamerecord --event '{"type":"click","sceneStableUid":"<sceneStableUid>","data":{"x":180,"y":524}}'
npx 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload full
```

导出可分享回放：

```bash
npx 1gameplay bundle-player-html out/debug.1gamerecord --out out/replay-single.html --single-html
```
