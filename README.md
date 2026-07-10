# FC 坦克大战（Battle City）1–10 关

基于 [1Game](https://github.com/1GameEngine) 与 `@1game/skill` 复刻的 FC《坦克大战》（Namco Battle City）前 10 关。

玩法规则、关卡地图与敌军序列对齐 Famicom 原作数据；画面为原创 FC 风格自绘（未使用官方 CHR）。

## 操作

| 键 | 作用 |
|---|---|
| 方向键 / WASD | 移动 |
| Space / J / K / Z / X | 开火 |
| Enter / Esc | Start（确认 / 暂停） |
| Shift / B | Select（选关减一） |
| 选关时 ←→ | 切换关卡 |

屏幕底部提供触控虚拟键。

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
```
