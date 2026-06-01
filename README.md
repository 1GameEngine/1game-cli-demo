# 触屏贪吃蛇（1Game）

基于 [@1game/skill](https://www.npmjs.com/package/@1game/skill) 与 [@1game/engine-bundle](https://www.npmjs.com/package/@1game/engine-bundle) 开发的简单贪吃蛇小游戏，支持**触屏滑动**控制方向（也兼容键盘 WASD / 方向键）。

## 玩法

- 在棋盘上**滑动**即可转向（上下左右）
- 吃到红色食物得分，撞墙或撞到自己则游戏结束
- 结束后点击画面或按空格重新开始

## 开发

```bash
npm install
npm run build          # 输出到 out/index.html
npm run build:single   # 单文件 HTML（便于分享）
```

本地预览：用浏览器打开 `out/index.html`，或在 `out/` 目录启动静态服务。

## 在线部署（Vercel）

| 页面 | 地址 |
|------|------|
| 导航首页 | https://workspace-eta-liard.vercel.app/ |
| 可玩游戏 | https://workspace-eta-liard.vercel.app/play/ |
| 调试回放 | https://workspace-eta-liard.vercel.app/replay/debug.html 等 |

重新生成并部署：

```bash
npm run build:deploy
# 需配置 VERCEL_TOKEN，然后：
npx vercel deploy --prod --yes --scope linfaxins-projects
```

## 调试（1gameplay）

```bash
npm run debug:record
npx 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload summary
```

Agent 开发规范见 `.agents/skills/1game-game-dev/SKILL.md`（来自 `@1game/skill`）。
