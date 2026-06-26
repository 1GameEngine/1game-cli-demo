# Flappy Bird（1Game）

基于 [@1game/skill](https://www.npmjs.com/package/@1game/skill) 与 1Game 引擎开发的 Flappy Bird 小游戏。

## 玩法

- 点击画面或按空格 / 上方向键让小鸟拍翅上升
- 穿过绿色管道缝隙得分
- 撞到管道或地面则游戏结束，再次点击重开

## 开发

```bash
npm install
npm run build
```

构建产物在 `out/index.html`，用浏览器打开即可游玩。

## 回放调试

```bash
npx 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
npx 1gameplay step out/debug.1gamerecord --ms 16 --repeat 120 --event '{"type":"click","sceneStableUid":"<sceneStableUid>","data":{"x":180,"y":320}}'
npx 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload summary
```
