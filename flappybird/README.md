# Flappy Bird

基于 [1Game](https://www.npmjs.com/package/@1game/engine-bundle) 引擎开发的 Flappy Bird 小游戏。

## 玩法

- 点击屏幕、触摸或按 **空格 / ↑ / W** 让小鸟向上飞
- 穿过绿色管道之间的空隙得分
- 撞到管道、天花板或地面则游戏结束
- 结束后再次点击可重新开始

## 开发

```bash
npm install
npm run build
```

构建产物位于 `out/` 目录，用浏览器打开 `out/index.html` 即可游玩。

## 调试回放

```bash
npx 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
npx 1gameplay step out/debug.1gamerecord --ms 16 --repeat 120
npx 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload summary
```
