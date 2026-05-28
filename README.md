# 1Game Snake Demo

使用 `npm` + `@1game/skill` 指导的 1Game 项目结构，实现了一个简单贪吃蛇小游戏。

## 功能

- 键盘控制：方向键 / WASD
- 吃到食物后加分并增长
- 撞墙或撞到自己则失败
- 顶部状态栏显示分数和游戏状态
- 支持点击 `Restart` 重新开始

## 开发与运行

```bash
npm install
npm run build
npm run serve
```

启动后访问：`http://localhost:4173`

## 构建单文件 HTML

```bash
npm run build:single
```

产物位于 `out/` 目录。
