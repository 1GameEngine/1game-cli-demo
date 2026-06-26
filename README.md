# Flappy Bird

基于 [1Game](https://github.com/1GameEngine) 与 `@1game/skill` 开发的 Flappy Bird 小游戏。

## 玩法

- 点击屏幕或按 **空格** 让小鸟向上飞
- 穿过绿色管道之间的缝隙得分
- 撞到管道、天花板或地面则游戏结束

## 开发

```bash
npm install
npm run build
```

构建产物在 `out/index.html`，用浏览器打开即可游玩。

## 技术栈

- `@1game/engine-bundle` — 游戏运行时
- `@1game/cli` — 构建工具
- `@1game/skill` — Agent 开发技能文档

## 调试回放

```bash
npx 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
npx 1gameplay step out/debug.1gamerecord --ms 16 --repeat 120
npx 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload summary
```
