# 贪吃蛇小游戏

基于 [1Game](https://github.com/1GameEngine) 引擎开发的简单贪吃蛇游戏，使用 `@1game/skill` 提供的开发规范实现。

## 玩法

- 使用 **方向键** 或 **WASD** 控制蛇的移动方向
- 吃到红色食物得分，蛇身变长，移动速度逐渐加快
- 撞墙或撞到自己则游戏结束
- 游戏结束后点击「重新开始」或按 **空格 / Enter** 重开

## 开发

```bash
npm install
npm run build
```

构建产物在 `out/` 目录。本地预览：

```bash
python3 -m http.server 4173 -d out
```

然后访问 http://localhost:4173

## 单文件构建

```bash
npm run build:single
```

生成单个 `out/index.html`，可直接在浏览器中打开。

## 在线预览（Vercel）

**生产地址**：https://workspace-eta-liard.vercel.app

重新部署（需设置 `VERCEL_TOKEN` 环境变量）：

```bash
export VERCEL_TOKEN=your_token
npx vercel deploy --prod --yes --scope linfaxins-projects
```

## 调试

```bash
npm run gameplay:create
npm run gameplay:list
```

## 生成得分 5 分的游戏记录

```bash
npm run gameplay:score5
```

产物：

- `out/score-5.1gamerecord` — 1gameplay 录制文件（58 步操作，最终得分 5）
- `out/score-5-replay.html` — 浏览器回放页面（需先执行上面的 bundle 命令，或运行下方命令）

```bash
npx 1gameplay bundle-player-html out/score-5.1gamerecord --out out/score-5-replay.html
```
