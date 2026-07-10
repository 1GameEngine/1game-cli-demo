# mota-21

由 @1game/cli 初始化的游戏项目。

## 命令

- pnpm build: 打包浏览器产物到 `out/`（默认目标为 single-file，见 `1game.config.ts`）

## 目录

- src/game.tsx: 游戏入口
- 1game.config.ts: 构建配置
- .gitignore: 忽略 `out/`、`*.1gamerecord` 等常见产物，避免误提交
