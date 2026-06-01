# 调试回放站点（Vercel）

将 `1gameplay` 录制与生成的游戏构建打包为静态站，部署到 Vercel 项目 `site`（生产别名：`https://site-five-blush-28.vercel.app`）。

## 本地生成站点

```bash
cd snake-game
pnpm install
pnpm run build:site
```

输出目录：`out/site/`（已在根 `.gitignore` 中忽略）。

## 部署到 Vercel

使用 [Deploy Token](https://vercel.com/account/tokens)（勿提交到 Git）：

```bash
cd out/site
npx vercel deploy --prod --yes --token "$VERCEL_TOKEN"
```

首次部署会关联 `.vercel/project.json`（同样勿提交）。

## 页面结构

| 路径 | 说明 |
|------|------|
| `/` | 导航首页 |
| `/game/` | 可玩构建（`1game build`） |
| `/regression.html` 等 | `bundle-player-html --single-html` 单文件回放 |
