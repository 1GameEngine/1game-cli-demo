# 魔塔 21 层

基于 [1Game](https://github.com/1GameEngine) 公开包与 [`@1game/skill`](https://www.npmjs.com/package/@1game/skill) 工作流，复刻经典 **魔塔 21 层**。

地图、怪物数值、道具、商店与剧情以官方示例工程为准：

- https://1game.design/demo_projects/魔塔21层/魔塔21层.1game

## 技术栈

| 包 | 用途 |
|----|------|
| `@1game/engine-bundle` | 运行时 / JSX 场景 |
| `@1game/cli` | `1game build` |
| `@1game/cli-1gameplay` | 无头回放调试 |
| `@1game/skill` | Agent 开发技能文档 |

## 安装与构建

```bash
npm install
npm run build          # 输出 out/index.html（单文件）
```

本地预览：

```bash
python3 -m http.server 4173 -d out
# 打开 http://localhost:4173
```

## 操作

- **键盘**：方向键 / WASD 移动；Enter/空格确认对话；Esc 关闭面板
- **触屏**：底部方向键
- **HUD**：存档 / 圣光徽图鉴 / 楼层传送器（获得对应道具后显示）

## 玩法概要

- 0–21 层完整地图（数据由 `npm run extract` 从参考工程提取）
- 回合式一格移动；钥匙开门；踩楼梯换层
- 战斗伤害公式与参考工程一致（含固伤、吸血）
- NPC 对话、金币/钥匙/经验商店、仙子与杰克主线、Boss 与通关结局
- 会话内 3 槽存档

## 数据提取

若需从参考 `.1game` 重新生成数据与贴图：

```bash
# 默认读取 /tmp/mota-ref/mota-extracted
npm run extract
# 或
node scripts/extract-mota-data.mjs /path/to/魔塔21层.1game
```

## 调试

```bash
npm run gameplay:smoke   # 1gameplay 冒烟：开局 → 移动
node --experimental-strip-types scripts/combat-check.mjs
```

按 `@1game/skill` 约定：玩法状态经 `createGameStore` + `commitChange` 更新，并开启 `enableHistory` 以便回放。

## 目录

```
src/game.tsx          # 入口与 UI
src/logic/            # 战斗、移动、剧情
src/data/             # 楼层/怪物/道具/对话（可提取再生）
src/assets/           # 从参考工程解码的图片
scripts/              # 提取与冒烟脚本
```
