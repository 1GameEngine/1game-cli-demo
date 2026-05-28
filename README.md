# 贪吃蛇小游戏

基于 [1Game](https://www.npmjs.com/package/@1game/engine-bundle) 与 [@1game/skill](https://www.npmjs.com/package/@1game/skill) 开发的简单贪吃蛇游戏。

## 玩法

- 方向键或 **WASD** 控制蛇的移动方向
- 吃到红色食物得分，蛇身变长
- 撞墙或咬到自己则游戏结束
- 游戏结束后按 **空格** 或点击「再来一局」重新开始
- 屏幕底部提供触控方向按钮，方便手机操作

## 开发

```bash
pnpm install
pnpm build
```

在 `out/` 目录用静态服务器预览：

```bash
python3 -m http.server 4173 -d out
```

浏览器打开 http://localhost:4173

单文件构建（便于分享）：

```bash
pnpm run build:single
```

## 技术说明

- 游戏逻辑在 `src/game.tsx`，使用 `@1game/engine-bundle` 的 Worker 运行时
- 状态通过 `createGameStore` 管理，支持 `1gameplay` 录制与回放调试
- 食物位置使用确定性伪随机，便于自动化测试
