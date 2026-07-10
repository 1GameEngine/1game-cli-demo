import { For, Show } from 'solid-js';
import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';
import { MONSTERS } from './data/monsters';
import { FLOOR_BG, FLOOR_GRID, ITEM_COLOR, MONSTER_COLOR, NPC_COLOR, PLAYER_COLOR, TILE_COLOR, TILE_LABEL } from './data/labels';
import {
  advanceDialog,
  chooseDialog,
  chooseShop,
  closeOverlay,
  finishIntro,
  getFloorEntities,
  listFloorEntities,
  loadFromSlot,
  resolveMonster,
  saveToSlot,
  startNewGame,
  teleportToFloor,
  tickAnim,
  tryMove,
  INTRO_TEXT,
  ENDING_TEXT,
} from './logic/actions';
import { previewCombat } from './logic/combat';
import { makeInitialState } from './logic/state';
import type { Direction, GameState } from './logic/types';
import { CELL, HUD_H, MAP_COLS, MAP_ROWS, MAP_Y, PAD_H, SCENE_H, SCENE_W } from './logic/types';
import { FLOORS } from './data/floors';
import { PLAYER_SPRITE, spriteFor, type SpriteRef } from './utils/sprites';
const ENABLE_SPRITES = true;

const { store, commitChange, storeHistory } = createGameStore<GameState>(makeInitialState(), {
  enableHistory: true,
});

function action(label: string, mutator: (draft: GameState) => void): void {
  commitChange(label, mutator);
}

function handleDirection(dir: Direction): void {
  action(`move:${dir}`, (draft) => tryMove(draft, dir));
}

function codeToDir(code?: string): Direction | null {
  if (code === 'ArrowUp' || code === 'KeyW') return 'up';
  if (code === 'ArrowDown' || code === 'KeyS') return 'down';
  if (code === 'ArrowLeft' || code === 'KeyA') return 'left';
  if (code === 'ArrowRight' || code === 'KeyD') return 'right';
  return null;
}

function displayPos(draftLike: GameState): { x: number; y: number } {
  if (draftLike.anim.phase !== 'moving') {
    return { x: draftLike.player.x, y: draftLike.player.y };
  }
  const t = Math.min(1, draftLike.anim.elapsedMs / draftLike.anim.durationMs);
  const ease = t * t * (3 - 2 * t);
  return {
    x: draftLike.anim.fromX + (draftLike.anim.toX - draftLike.anim.fromX) * ease,
    y: draftLike.anim.fromY + (draftLike.anim.toY - draftLike.anim.fromY) * ease,
  };
}

function entityLabel(type: string, id: string): string {
  if (type === 'tile') return TILE_LABEL[id] || id.slice(0, 2);
  if (type === 'monster') return (MONSTERS[id]?.name || id).slice(0, 2);
  if (type === 'item') {
    const map: Record<string, string> = {
      yellowKey: '黄钥',
      blueKey: '蓝钥',
      redKey: '红钥',
      redPotion: '红瓶',
      bluePotion: '蓝瓶',
      redGem: '红宝',
      blueGem: '蓝宝',
      monsterBook: '图鉴',
      floorTeleporter: '传送',
      cross: '十字',
      holyWater: '圣水',
      coinBag: '钱袋',
      keyBox: '钥盒',
      ironSword: '铁剑',
      silverSword: '银剑',
      steelSword: '青剑',
      holySword: '圣剑',
      starSword: '星剑',
      ironShield: '铁盾',
      silverShield: '银盾',
      knightShield: '骑盾',
      holyShield: '圣盾',
      divineShield: '神盾',
      smallWing: '小羽',
      bigWing: '大羽',
    };
    return map[id] || id.slice(0, 2);
  }
  if (type === 'npc') {
    const map: Record<string, string> = {
      fairy: '仙子',
      merchantF2: '商人',
      elderF2: '老人',
      thief: '杰克',
      princess: '公主',
      goldShopF3: '商店',
      goldShopF11: '商店',
      keyShopF5: '钥商',
      keyShopF12: '钥商',
      expElderF5: '经验',
      expElderF13: '经验',
      elderF15: '老人',
      merchantF15: '商人',
    };
    return map[id] || 'NPC';
  }
  if (type === 'trigger') return '!!';
  return '?';
}

function entityColor(type: string, id: string): string {
  if (type === 'tile') return TILE_COLOR[id] || '#64748b';
  if (type === 'monster') return MONSTER_COLOR;
  if (type === 'item') return ITEM_COLOR[id] || '#f472b6';
  if (type === 'npc') return NPC_COLOR;
  if (type === 'trigger') return '#f43f5e';
  return '#94a3b8';
}

function SpriteCell(props: { sprite?: SpriteRef | null; fallbackColor: string; label: string }) {
  return (
    <Show
      when={ENABLE_SPRITES ? props.sprite : null}
      fallback={
        <group x={0} y={0} width={CELL} height={CELL}>
          <node
            x={2}
            y={2}
            width={CELL - 4}
            height={CELL - 4}
            shape="roundedRect(4 4 4 4)"
            backgroundColor={props.fallbackColor}
          />
          <text
            x={0}
            y={8}
            width={CELL}
            height={16}
            text={props.label}
            textAlign="center"
            textColor="#0f172a"
            textSize="11"
            bold
          />
        </group>
      }
    >
      {(sp) => (
        <image
          source={sp().source as never}
          x={0}
          y={0}
          width={CELL}
          height={CELL}
          imageFit="fill"
          imageCutArea={sp().cut || undefined}
          imageRenderSmoothing={false}
        />
      )}
    </Show>
  );
}

function isEntityVisible(state: GameState, ent: { uid: string; special?: string; hidden?: boolean; id: string }): boolean {
  if (state.removed.includes(ent.uid)) return false;
  if (ent.special === 'f2StoryDoor' && state.flags.f2DoorOpen) return false;
  if (ent.special === 'princessPath' && state.flags.f18PathOpen) return false;
  if (ent.special === 'hiddenStair18') return state.flags.stair18Shown;
  if (ent.special === 'hiddenStair20') return state.flags.stair20Shown;
  if (ent.hidden) return false;
  return true;
}

function PadButton(props: { x: number; y: number; label: string; onPress: () => void }) {
  return (
    <group x={props.x} y={props.y} width={64} height={48} clickable onClick={props.onPress}>
      <node x={0} y={0} width={64} height={48} shape="roundedRect(8 8 8 8)" backgroundColor="#1e293b" borderWidth={2} borderColor="#475569" />
      <text x={0} y={12} width={64} height={24} text={props.label} textAlign="center" textColor="#e2e8f0" textSize="18" />
    </group>
  );
}

function Hud() {
  const p = () => store.player;
  return (
    <group x={0} y={0} width={SCENE_W} height={HUD_H}>
      <node x={0} y={0} width={SCENE_W} height={HUD_H} backgroundColor="#0f172a" />
      <text x={8} y={6} width={200} height={20} text={`魔塔  ${store.floor} 层`} textColor="#f8fafc" textSize="16" bold />
      <text x={8} y={28} width={200} height={18} text={`生命 ${p().hp}`} textColor="#f87171" textSize="14" />
      <text x={8} y={48} width={200} height={18} text={`攻击 ${p().atk}   防御 ${p().def}`} textColor="#93c5fd" textSize="14" />
      <text x={8} y={68} width={200} height={18} text={`金币 ${p().gold}   经验 ${p().exp}`} textColor="#fde68a" textSize="14" />
      <text x={8} y={88} width={240} height={18} text={`黄${p().yellowKey} 蓝${p().blueKey} 红${p().redKey}  LV${p().lv}`} textColor="#e2e8f0" textSize="14" />

      <group
        x={SCENE_W - 78}
        y={8}
        width={70}
        height={28}
        clickable
        onClick={() =>
          action('open-save', (d) => {
            if (d.phase !== 'playing') return;
            d.phase = 'save';
            d.inputLock = true;
          })
        }
      >
        <node x={0} y={0} width={70} height={28} shape="roundedRect(6 6 6 6)" backgroundColor="#334155" />
        <text x={0} y={5} width={70} height={18} text="存档" textAlign="center" textColor="#fff" textSize="14" />
      </group>

      <Show when={store.inventory.hasBook}>
        <group
          x={SCENE_W - 78}
          y={42}
          width={70}
          height={28}
          clickable
          onClick={() =>
            action('open-book', (d) => {
              if (d.phase !== 'playing') return;
              d.phase = 'book';
              d.inputLock = true;
            })
          }
        >
          <node x={0} y={0} width={70} height={28} shape="roundedRect(6 6 6 6)" backgroundColor="#7c3aed" />
          <text x={0} y={5} width={70} height={18} text="图鉴" textAlign="center" textColor="#fff" textSize="14" />
        </group>
      </Show>

      <Show when={store.inventory.hasTeleporter}>
        <group
          x={SCENE_W - 78}
          y={76}
          width={70}
          height={28}
          clickable
          onClick={() =>
            action('open-teleport', (d) => {
              if (d.phase !== 'playing') return;
              d.phase = 'teleport';
              d.inputLock = true;
            })
          }
        >
          <node x={0} y={0} width={70} height={28} shape="roundedRect(6 6 6 6)" backgroundColor="#0891b2" />
          <text x={0} y={5} width={70} height={18} text="传送" textAlign="center" textColor="#fff" textSize="14" />
        </group>
      </Show>
    </group>
  );
}

function MapView() {
  const floorEntities = () => FLOORS[store.floor]?.entities || [];
  const pos = () => displayPos(store as unknown as GameState);

  return (
    <group x={0} y={MAP_Y} width={SCENE_W} height={MAP_ROWS * CELL}>
      <node x={0} y={0} width={SCENE_W} height={MAP_ROWS * CELL} backgroundColor={FLOOR_BG} />
      <For each={Array.from({ length: MAP_ROWS * MAP_COLS }, (_, i) => i)}>
        {(i) => {
          const x = i % MAP_COLS;
          const y = Math.floor(i / MAP_COLS);
          return (
            <node
              id={`floor-${x}-${y}`}
              x={x * CELL}
              y={y * CELL}
              width={CELL}
              height={CELL}
              backgroundColor={(x + y) % 2 === 0 ? FLOOR_BG : FLOOR_GRID}
            />
          );
        }}
      </For>
      <For each={floorEntities()}>
        {(ent) => (
          <group
            id={ent.uid}
            x={ent.x * CELL}
            y={ent.y * CELL}
            width={CELL}
            height={CELL}
            hidden={!isEntityVisible(store as unknown as GameState, ent)}
          >
            <SpriteCell
              sprite={spriteFor(ent.type, ent.id)}
              fallbackColor={entityColor(ent.type, ent.id)}
              label={entityLabel(ent.type, ent.id)}
            />
          </group>
        )}
      </For>
      <group id="player" x={pos().x * CELL} y={pos().y * CELL} width={CELL} height={CELL} zIndex={10}>
        <SpriteCell sprite={PLAYER_SPRITE} fallbackColor={PLAYER_COLOR} label="勇" />
      </group>
    </group>
  );
}

function Controls() {
  const baseY = HUD_H + MAP_ROWS * CELL;
  return (
    <group x={0} y={baseY} width={SCENE_W} height={PAD_H}>
      <node x={0} y={0} width={SCENE_W} height={PAD_H} backgroundColor="#020617" />
      <PadButton x={SCENE_W / 2 - 32} y={12} label="↑" onPress={() => handleDirection('up')} />
      <PadButton x={SCENE_W / 2 - 104} y={68} label="←" onPress={() => handleDirection('left')} />
      <PadButton x={SCENE_W / 2 - 32} y={68} label="↓" onPress={() => handleDirection('down')} />
      <PadButton x={SCENE_W / 2 + 40} y={68} label="→" onPress={() => handleDirection('right')} />
      <text
        x={8}
        y={120}
        width={SCENE_W - 16}
        height={20}
        text="方向键/WASD 移动 · 点击对话框继续"
        textAlign="center"
        textColor="#64748b"
        textSize="12"
      />
    </group>
  );
}

function Toast() {
  return (
    <Show when={store.toastText}>
      {(t) => (
        <group x={24} y={MAP_Y + 8} width={SCENE_W - 48} height={40} zIndex={50}>
          <node x={0} y={0} width={SCENE_W - 48} height={40} shape="roundedRect(8 8 8 8)" backgroundColor="rgba(15,23,42,0.92)" />
          <text x={8} y={10} width={SCENE_W - 64} height={24} text={t()} textAlign="center" textColor="#f8fafc" textSize="13" />
        </group>
      )}
    </Show>
  );
}

function DialogOverlay() {
  return (
    <Show when={store.dialog}>
      {(d) => {
        const line = () => d().lines[d().lineIndex];
        return (
          <group
            x={16}
            y={MAP_Y + 40}
            width={SCENE_W - 32}
            height={280}
            zIndex={60}
            clickable
            onClick={() => action('dialog:next', (draft) => advanceDialog(draft))}
          >
            <node x={0} y={0} width={SCENE_W - 32} height={280} shape="roundedRect(12 12 12 12)" backgroundColor="#0f172a" borderWidth={2} borderColor="#64748b" />
            <text x={12} y={10} width={SCENE_W - 56} height={22} text={d().title} textColor="#fbbf24" textSize="16" bold />
            <text
              x={12}
              y={40}
              width={SCENE_W - 56}
              height={140}
              text={`${line()?.speaker ? `【${line()?.speaker}】\n` : ''}${line()?.text || ''}`}
              textColor="#e2e8f0"
              textSize="14"
              autoWrap
            />
            <Show when={!d().choices?.length}>
              <text x={12} y={250} width={SCENE_W - 56} height={20} text="点击继续" textAlign="center" textColor="#94a3b8" textSize="12" />
            </Show>
            <Show when={d().choices?.length}>
              <For each={d().choices || []}>
                {(c, i) => (
                  <group
                    x={20}
                    y={190 + i() * 36}
                    width={SCENE_W - 72}
                    height={32}
                    clickable
                    onClick={() => action(`dialog:${c.action}`, (draft) => chooseDialog(draft, c.action))}
                  >
                    <node x={0} y={0} width={SCENE_W - 72} height={32} shape="roundedRect(6 6 6 6)" backgroundColor="#1e293b" />
                    <text x={0} y={6} width={SCENE_W - 72} height={20} text={c.label} textAlign="center" textColor="#fff" textSize="14" />
                  </group>
                )}
              </For>
            </Show>
          </group>
        );
      }}
    </Show>
  );
}

function ShopOverlay() {
  return (
    <Show when={store.shop}>
      {(s) => (
        <group x={16} y={MAP_Y + 30} width={SCENE_W - 32} height={320} zIndex={60}>
          <node x={0} y={0} width={SCENE_W - 32} height={320} shape="roundedRect(12 12 12 12)" backgroundColor="#0f172a" borderWidth={2} borderColor="#38bdf8" />
          <text x={12} y={10} width={SCENE_W - 56} height={22} text={s().title} textColor="#38bdf8" textSize="16" bold />
          <text x={12} y={40} width={SCENE_W - 56} height={70} text={s().text} textColor="#e2e8f0" textSize="13" autoWrap />
          <For each={s().options}>
            {(opt, i) => (
              <group
                x={20}
                y={120 + i() * 42}
                width={SCENE_W - 72}
                height={36}
                clickable
                onClick={() => action(`shop:${opt.action}`, (draft) => chooseShop(draft, opt.action))}
              >
                <node x={0} y={0} width={SCENE_W - 72} height={36} shape="roundedRect(6 6 6 6)" backgroundColor="#1e293b" />
                <text x={0} y={8} width={SCENE_W - 72} height={20} text={opt.label} textAlign="center" textColor="#fff" textSize="14" />
              </group>
            )}
          </For>
        </group>
      )}
    </Show>
  );
}

function BookOverlay() {
  const rows = () => {
    const seen = new Map<string, ReturnType<typeof resolveMonster>>();
    for (const ent of listFloorEntities(store as unknown as GameState)) {
      if (ent.type !== 'monster') continue;
      if (!seen.has(ent.id)) seen.set(ent.id, resolveMonster(store as unknown as GameState, ent));
    }
    return [...seen.values()].map((m) => {
      const prev = previewCombat(store.player, m);
      return {
        name: m.name,
        hp: m.hp,
        atk: m.atk,
        def: m.def,
        dmg: prev.canFight ? String(prev.damage) : '???',
        ok: prev.canFight ? '可打' : '打不过',
      };
    });
  };

  return (
    <Show when={store.phase === 'book'}>
      <group x={12} y={MAP_Y + 20} width={SCENE_W - 24} height={360} zIndex={60} clickable onClick={() => action('close-book', closeOverlay)}>
        <node x={0} y={0} width={SCENE_W - 24} height={360} shape="roundedRect(12 12 12 12)" backgroundColor="#111827" borderWidth={2} borderColor="#a78bfa" />
        <text x={12} y={10} width={SCENE_W - 48} height={22} text="圣光徽 · 本层怪物" textColor="#c4b5fd" textSize="16" bold />
        <For each={rows().slice(0, 10)}>
          {(r, i) => (
            <text
              x={12}
              y={40 + i() * 28}
              width={SCENE_W - 48}
              height={24}
              text={`${r.name} HP${r.hp} 攻${r.atk} 防${r.def} 伤${r.dmg} ${r.ok}`}
              textColor="#e5e7eb"
              textSize="12"
            />
          )}
        </For>
        <text x={12} y={330} width={SCENE_W - 48} height={20} text="点击关闭" textAlign="center" textColor="#9ca3af" textSize="12" />
      </group>
    </Show>
  );
}

function TeleportOverlay() {
  const floors = () => Array.from({ length: store.maxFloorReached + 1 }, (_, i) => i);
  return (
    <Show when={store.phase === 'teleport'}>
      <group x={12} y={MAP_Y + 20} width={SCENE_W - 24} height={360} zIndex={60}>
        <node x={0} y={0} width={SCENE_W - 24} height={360} shape="roundedRect(12 12 12 12)" backgroundColor="#082f49" borderWidth={2} borderColor="#22d3ee" />
        <text x={12} y={10} width={SCENE_W - 48} height={22} text="楼层传送器" textColor="#67e8f9" textSize="16" bold />
        <For each={floors()}>
          {(f, i) => (
            <group
              x={12 + (i() % 4) * 90}
              y={50 + Math.floor(i() / 4) * 44}
              width={80}
              height={36}
              clickable
              onClick={() => action(`teleport:${f}`, (d) => teleportToFloor(d, f))}
            >
              <node x={0} y={0} width={80} height={36} shape="roundedRect(6 6 6 6)" backgroundColor="#155e75" />
              <text x={0} y={8} width={80} height={20} text={`${f}层`} textAlign="center" textColor="#fff" textSize="14" />
            </group>
          )}
        </For>
        <group x={(SCENE_W - 24) / 2 - 40} y={310} width={80} height={32} clickable onClick={() => action('close-teleport', closeOverlay)}>
          <node x={0} y={0} width={80} height={32} shape="roundedRect(6 6 6 6)" backgroundColor="#334155" />
          <text x={0} y={6} width={80} height={20} text="关闭" textAlign="center" textColor="#fff" textSize="14" />
        </group>
      </group>
    </Show>
  );
}

function SaveOverlay() {
  return (
    <Show when={store.phase === 'save' || store.phase === 'load'}>
      <group x={16} y={MAP_Y + 40} width={SCENE_W - 32} height={300} zIndex={60}>
        <node x={0} y={0} width={SCENE_W - 32} height={300} shape="roundedRect(12 12 12 12)" backgroundColor="#0f172a" borderWidth={2} borderColor="#94a3b8" />
        <text
          x={12}
          y={12}
          width={SCENE_W - 56}
          height={22}
          text={store.phase === 'save' ? '写入存档' : '读取存档'}
          textColor="#e2e8f0"
          textSize="16"
          bold
        />
        <For each={store.saves}>
          {(slot, i) => (
            <group
              x={20}
              y={50 + i() * 50}
              width={SCENE_W - 72}
              height={42}
              clickable
              onClick={() =>
                action(`slot:${i()}`, (d) => {
                  if (d.phase === 'save') saveToSlot(d, i());
                  else loadFromSlot(d, i());
                })
              }
            >
              <node x={0} y={0} width={SCENE_W - 72} height={42} shape="roundedRect(6 6 6 6)" backgroundColor="#1e293b" />
              <text x={8} y={10} width={SCENE_W - 88} height={22} text={`存档${i() + 1} - ${slot.desc}`} textColor="#fff" textSize="14" />
            </group>
          )}
        </For>
        <group x={(SCENE_W - 32) / 2 - 40} y={250} width={80} height={32} clickable onClick={() => action('close-save', closeOverlay)}>
          <node x={0} y={0} width={80} height={32} shape="roundedRect(6 6 6 6)" backgroundColor="#334155" />
          <text x={0} y={6} width={80} height={20} text="取消" textAlign="center" textColor="#fff" textSize="14" />
        </group>
      </group>
    </Show>
  );
}

function TitleScreen() {
  return (
    <Show when={store.phase === 'title'}>
      <group x={0} y={0} width={SCENE_W} height={SCENE_H} zIndex={80}>
        <node x={0} y={0} width={SCENE_W} height={SCENE_H} backgroundColor="#000" />
        <text x={0} y={120} width={SCENE_W} height={40} text="魔塔 21 层" textAlign="center" textColor="#fbbf24" textSize="32" bold />
        <text x={40} y={170} width={SCENE_W - 80} height={40} text="基于 1Game / @1game/skill 复刻" textAlign="center" textColor="#94a3b8" textSize="14" />
        <group
          x={SCENE_W / 2 - 90}
          y={260}
          width={180}
          height={48}
          clickable
          onClick={() => action('new-game', startNewGame)}
        >
          <node x={0} y={0} width={180} height={48} shape="roundedRect(10 10 10 10)" backgroundColor="#2563eb" />
          <text x={0} y={12} width={180} height={24} text="开始游戏" textAlign="center" textColor="#fff" textSize="18" />
        </group>
        <group
          x={SCENE_W / 2 - 90}
          y={330}
          width={180}
          height={48}
          clickable
          onClick={() =>
            action('open-load', (d) => {
              d.phase = 'load';
              d.inputLock = true;
            })
          }
        >
          <node x={0} y={0} width={180} height={48} shape="roundedRect(10 10 10 10)" backgroundColor="#334155" />
          <text x={0} y={12} width={180} height={24} text="读取存档" textAlign="center" textColor="#fff" textSize="18" />
        </group>
      </group>
    </Show>
  );
}

function IntroScreen() {
  return (
    <Show when={store.phase === 'intro'}>
      <group
        x={0}
        y={0}
        width={SCENE_W}
        height={SCENE_H}
        zIndex={80}
        clickable
        onClick={() => action('finish-intro', finishIntro)}
      >
        <node x={0} y={0} width={SCENE_W} height={SCENE_H} backgroundColor="#000" />
        <text x={24} y={80} width={SCENE_W - 48} height={400} text={INTRO_TEXT} textColor="#e2e8f0" textSize="14" autoWrap />
        <text x={0} y={SCENE_H - 60} width={SCENE_W} height={24} text="点击继续" textAlign="center" textColor="#94a3b8" textSize="14" />
      </group>
    </Show>
  );
}

function EndingScreen() {
  return (
    <Show when={store.phase === 'ending'}>
      <group
        x={0}
        y={0}
        width={SCENE_W}
        height={SCENE_H}
        zIndex={80}
        clickable
        onClick={() => action('back-title', (d) => { d.phase = 'title'; })}
      >
        <node x={0} y={0} width={SCENE_W} height={SCENE_H} backgroundColor="#000" />
        <text x={24} y={80} width={SCENE_W - 48} height={400} text={ENDING_TEXT} textColor="#fde68a" textSize="14" autoWrap />
        <text x={0} y={SCENE_H - 60} width={SCENE_W} height={24} text="点击返回标题" textAlign="center" textColor="#94a3b8" textSize="14" />
      </group>
    </Show>
  );
}

function DeadScreen() {
  return (
    <Show when={store.phase === 'dead'}>
      <group x={40} y={MAP_Y + 80} width={SCENE_W - 80} height={180} zIndex={70}>
        <node x={0} y={0} width={SCENE_W - 80} height={180} shape="roundedRect(12 12 12 12)" backgroundColor="#450a0a" />
        <text x={0} y={30} width={SCENE_W - 80} height={30} text="你倒下了……" textAlign="center" textColor="#fecaca" textSize="20" bold />
        <group
          x={(SCENE_W - 80) / 2 - 70}
          y={90}
          width={140}
          height={40}
          clickable
          onClick={() => action('retry', startNewGame)}
        >
          <node x={0} y={0} width={140} height={40} shape="roundedRect(8 8 8 8)" backgroundColor="#b91c1c" />
          <text x={0} y={10} width={140} height={20} text="重新开始" textAlign="center" textColor="#fff" textSize="16" />
        </group>
      </group>
    </Show>
  );
}

function Game() {
  useFrame((frame) => {
    const dt = Math.min(frame.deltaSeconds, 0.05) * 1000;
    commitChange('tick', (draft: GameState) => {
      tickAnim(draft, dt);
    });
  });

  return (
    <scene
      name="main"
      width={SCENE_W}
      height={SCENE_H}
      backgroundColor="#020617"
      onKeyDown={(e) => {
        const dir = codeToDir(e.detail?.code);
        if (dir) handleDirection(dir);
        if (e.detail?.code === 'Escape') action('esc', closeOverlay);
        if (e.detail?.code === 'Enter' || e.detail?.code === 'Space') {
          action('confirm', (d) => {
            if (d.phase === 'dialog') advanceDialog(d);
            else if (d.phase === 'intro') finishIntro(d);
            else if (d.phase === 'title') startNewGame(d);
          });
        }
      }}
    >
      <Show when={store.phase === 'playing' || store.phase === 'dialog' || store.phase === 'shop' || store.phase === 'book' || store.phase === 'teleport' || store.phase === 'save' || store.phase === 'dead'}>
        <Hud />
        <MapView />
        <Controls />
        <Toast />
        <DialogOverlay />
        <ShopOverlay />
        <BookOverlay />
        <TeleportOverlay />
        <SaveOverlay />
        <DeadScreen />
      </Show>
      <TitleScreen />
      <IntroScreen />
      <EndingScreen />
      <Show when={store.phase === 'load'}>
        <SaveOverlay />
      </Show>
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
