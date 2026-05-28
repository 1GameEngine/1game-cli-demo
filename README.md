# 贪吃蛇小游戏

基于 [1Game](https://www.npmjs.com/package/@1game/engine-bundle) 引擎与 [`@1game/skill`](https://www.npmjs.com/package/@1game/skill) 开发指南实现的简单贪吃蛇游戏。

## 玩法

- **方向键** 或 **WASD** 控制蛇的移动方向
- 吃到橙色食物得分，蛇身变长
- 撞墙或撞到自己身体则游戏结束
- 点击 **Restart** 重新开始

## 开发

```bash
npm install
npm run build
npm run serve
```

浏览器打开 http://localhost:4173 即可游玩。

在线演示（Vercel）：

- 游戏：https://workspace-eta-liard.vercel.app
- 得分 5 分回放：https://workspace-eta-liard.vercel.app/replay/

## 构建产物

- `npm run build` — 输出到 `out/` 目录（`index.html` + worker）
- `npm run build:single` — 单文件 HTML 版本

## 1gameplay 录制

生成得分达到 5 分的无头游戏录制（输出 `out/score-5.1gamerecord`）：

```bash
npm run gameplay:score5
```

导出可浏览器回放的 HTML：

```bash
npm run gameplay:score5:replay
# 打开 out/score-5-replay.html
```

查询最终状态：

```bash
npx 1gameplay frame query out/score-5.1gamerecord --at last --select store:state --payload full
```

## 技术说明

- 游戏逻辑在 `src/game.tsx`，使用 `createGameStore` 保持确定性状态
- 食物位置由可复现的 LCG 随机种子生成，便于 `1gameplay` 回放调试
- 开发规范参考 `node_modules/@1game/skill/skills/1game-game-dev/SKILL.md`
