# 2048（1Game）

基于 [@1game/skill](https://www.npmjs.com/package/@1game/skill) 工作流与 [@1game/engine-bundle](https://www.npmjs.com/package/@1game/engine-bundle) 实现的经典 **2048** 益智游戏。

## 玩法

- 方向键或 **W/A/S/D** 滑动方块
- 屏幕下方方向按钮支持触控
- 相同数字碰撞合并，目标是合成 **2048**
- 达成后可选择继续挑战更高分；无法移动时游戏结束

## 开发

```bash
cd game-2048
pnpm install
pnpm build          # 输出到 out/
pnpm run build:single  # 单文件 HTML
```

本地预览：

```bash
pnpm build
python3 -m http.server 4173 -d out
```

浏览器打开 `http://localhost:4173`。

## 调试（1gameplay）

```bash
pnpm run gameplay:create
pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --repeat 30 --event-file <(node -e "
const fs=require('fs');
const ev={type:'keypress',detail:{code:'ArrowLeft'}};
for(let i=0;i<10;i++) console.log(JSON.stringify(ev));
")
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload summary
```

## 技术要点

- 游戏状态集中在 `createGameStore`，通过 `commitChange` 更新，支持 `1gameplay` 回放
- 随机生成方块使用确定性种子（`rngSeed`），便于自动化测试
- 场景尺寸 360×560，经典 2048 配色
