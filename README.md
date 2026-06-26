# Flappy Bird（1Game）

基于 [@1game/skill](https://www.npmjs.com/package/@1game/skill) 工作流开发的 Flappy Bird 小游戏。

## 玩法

- 点击屏幕或按空格 / 上方向键让小鸟扑翅上升
- 穿过绿色管道缝隙得分
- 撞到管道或落地则游戏结束，再次点击重玩

## 开发

```bash
npm install
npm run build
```

构建产物在 `out/index.html`，用浏览器打开即可游玩。

## 回放调试

```bash
npm run replay:create
npm run replay:step
npm run replay:html
```
