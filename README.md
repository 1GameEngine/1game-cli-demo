# 泡泡龙

基于 [1Game](https://github.com/1GameEngine) 公共包与 `@1game/skill` 开发流程实现的经典泡泡龙（Puzzle Bobble 风格）。

## 技术栈

- `@1game/skill`：Agent 开发技能包（见 `1game-game-dev`）
- `@1game/engine-bundle`：游戏运行时与 JSX 场景
- `@1game/cli` / `@1game/cli-1gameplay`：构建与无头回放调试

## 安装

```bash
pnpm install
pnpm exec 1game-skill activate --cursor
```

## 构建与预览

```bash
pnpm build
python3 -m http.server 4173 -d out
```

浏览器打开 `http://localhost:4173`。

单文件构建：

```bash
pnpm build:single
```

## 操作说明

| 操作 | 效果 |
|------|------|
| 鼠标/触控移动 | 瞄准 |
| 点击棋盘区域 / 空格 / Enter | 发射（结束态为重开） |
| ← → / A D | 微调角度 |
| C 或「交换」按钮 | 交换当前球与下一球 |
| R 或「重开」按钮 | 重新开始 |

## 游戏规则

- 将同色泡泡连成 **3 个及以上** 即可消除
- 与顶部断开连接的泡泡会掉落，额外得分
- 每发射 **5** 次，天花板下压一行
- 清空棋盘胜利；泡泡越过危险线失败
- 下一球颜色从棋盘上仍存在的颜色中抽取

## 1gameplay 回归（可选）

```bash
pnpm build
rm -f out/debug.1gamerecord
pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord --checkpoint-every 60
# 从 create 输出复制 sceneStableUids[0] 填入下方 <uid>
pnpm exec 1gameplay step out/debug.1gamerecord --event '{"type":"click","sceneStableUid":"<uid>","data":{"x":180,"y":400,"ms":200}}'
pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --repeat 90
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload full
```

导出 HTML 回放：

```bash
pnpm gameplay:replay
```
