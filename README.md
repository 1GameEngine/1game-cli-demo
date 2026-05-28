# 贪吃蛇小游戏

基于 [1Game](https://github.com/1GameEngine) 公共包与 `@1game/skill` 开发流程实现的简单贪吃蛇游戏。

## 技术栈

- `@1game/skill`：Agent 开发技能包（见 `.agents/skills/1game-game-dev`）
- `@1game/engine-bundle`：游戏运行时与 JSX 场景
- `@1game/cli`：浏览器构建

## 安装

```bash
npm install
```

## 构建

```bash
npm run build
```

构建产物输出到 `out/` 目录。本地预览：

```bash
python3 -m http.server 4173 -d out
```

然后在浏览器打开 `http://localhost:4173`。

单文件版本：

```bash
npm run build:single
```

## 操作说明

- 键盘：方向键 / WASD 控制蛇的移动
- 游戏结束后按空格键重新开始
- 屏幕底部提供方向按钮，支持触控操作

## 游戏规则

- 吃到红色食物得分，蛇身变长
- 撞墙或撞到自己身体则游戏结束
- 界面显示当前分数与历史最高分
