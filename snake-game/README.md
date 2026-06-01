# 触屏贪吃蛇

基于 [@1game/skill](https://www.npmjs.com/package/@1game/skill) 工作流与 `@1game/engine-bundle` 实现的竖屏贪吃蛇小游戏，支持**滑动**控制方向。

## 玩法

- 在画面上**滑动**：上 / 下 / 左 / 右改变蛇头方向（不可直接反向）
- **轻触**开始游戏；游戏结束后**轻触**重新开始
- 吃到红色食物得分并变长；撞墙或咬到自己则游戏结束

## 开发与构建

```bash
npm install
npm run build              # 输出到 out/index.html
npm exec 1game build -- --singleHtml   # 单文件 HTML，便于分享
```

## 调试（可选）

```bash
npx 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
npx 1gameplay step out/debug.1gamerecord --ms 140 --repeat 60
npx 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload summary
```
