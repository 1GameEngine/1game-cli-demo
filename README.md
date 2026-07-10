# FC 坦克大战（Battle City）1–10 关

基于 [1Game](https://github.com/1GameEngine) 与 `@1game/skill` 复刻的 FC《坦克大战》（Namco Battle City）前 10 关。

玩法规则、关卡地图与敌军序列对齐 Famicom 原作数据；画面为原创 FC 风格自绘（未使用官方 CHR）。

## 在线预览

PR：https://github.com/1GameEngine/1game-cli-demo/pull/7

Vercel Preview（部署已成功；若团队开启 SSO，需登录 Vercel 后打开）：

- https://1game-cli-demo-git-cursor-bc-0e60dd30-81bf74-linfaxins-projects.vercel.app
- https://workspace-git-cursor-bc-0e60dd30-f977-a280f9-linfaxins-projects.vercel.app

## 操作

| 键 | 作用 |
|---|---|
| 方向键 / WASD | 移动 |
| Space / J / K / Z / X | 开火 |
| Enter / Esc | Start（确认 / 暂停） |
| Shift / B | Select（选关减一） |
| 选关时 ←→ | 切换关卡 |

屏幕底部提供触控虚拟键。


## 素材说明

- `src/assets/*.svg`：统一像素风格的矢量设计源文件（坦克四向、地形、道具、HUD 等）
- 运行时当前使用几何节点按同一配色绘制（1Game 在本项目复杂场景下对大量 `<image>` 资源调度不稳定）
- 可用 `npm run debug:stage1-2` 生成第 1/2 关回放与截图

## 开发

```bash
npm install
npm run build
```

产物在 `out/index.html`。本地预览：

```bash
python3 -m http.server 4173 -d out
```

## 调试回放

```bash
npx 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
npx 1gameplay bundle-player-html out/debug.1gamerecord --out out/replay.html
```
