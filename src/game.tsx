import { For, Show } from 'solid-js';
import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';
import {
  COLORS,
  EAGLE,
  ENEMIES_PER_STAGE,
  FX,
  FY,
  META,
  NES_H,
  NES_W,
  SCENE_H,
  SCENE_W,
  TOUCH_H,
  TICK_MS,
  Tile,
} from './data/constants';
import { makeTitleState } from './data/initial';
import { tick } from './sim/tick';
import type { Entity, GameState } from './state/types';

const { store, commitChange, storeHistory } = createGameStore(makeTitleState(), {
  enableHistory: true,
});

function setKey(code: string, pressed: boolean): void {
  commitChange(`key:${code}:${pressed ? 'down' : 'up'}`, (draft: GameState) => {
    const map: Record<string, keyof GameState['input']> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      KeyW: 'up',
      KeyS: 'down',
      KeyA: 'left',
      KeyD: 'right',
      Space: 'fire',
      KeyJ: 'fire',
      KeyK: 'fire',
      KeyZ: 'fire',
      KeyX: 'fire',
      Enter: 'start',
      Escape: 'start',
      ShiftLeft: 'select',
      ShiftRight: 'select',
      KeyB: 'select',
    };

    // Stage select: Left/Right also pulse select/fire
    if (draft.phase === 'select') {
      if (code === 'ArrowRight' || code === 'KeyD') {
        if (pressed) draft.input.fire = true;
        else draft.input.fire = false;
        return;
      }
      if (code === 'ArrowLeft' || code === 'KeyA') {
        if (pressed) draft.input.select = true;
        else draft.input.select = false;
        return;
      }
    }

    const field = map[code];
    if (!field) return;
    if (field === 'fire' || field === 'start' || field === 'select' || field === 'up' || field === 'down' || field === 'left' || field === 'right') {
      (draft.input as Record<string, boolean>)[field] = pressed;
    }
  });
}

function setTouch(dir: 'up' | 'down' | 'left' | 'right' | 'fire' | 'start', pressed: boolean): void {
  commitChange(`touch:${dir}:${pressed ? 1 : 0}`, (draft: GameState) => {
    if (dir === 'start') draft.input.start = pressed;
    else draft.input[dir] = pressed;
  });
}

function tankColor(e: Entity): string {
  if (e.isPlayer) {
    if (e.starLevel >= 0x60) return '#f8f800';
    if (e.starLevel >= 0x40) return '#e8d060';
    if (e.starLevel >= 0x20) return '#d0b020';
    return COLORS.player;
  }
  if (e.powerUpTank && (store.frame >> 2) & 1) return '#f80000';
  if (e.type === 3) {
    const hp = e.armorHits + 1;
    if (hp >= 4) return COLORS.armor4;
    if (hp === 3) return COLORS.armor3;
    if (hp === 2) return COLORS.armor2;
    return COLORS.armor1;
  }
  if (e.type === 1) return COLORS.enemyFast;
  if (e.type === 2) return COLORS.enemyPower;
  return COLORS.enemy;
}

function TileCell(props: { row: number; col: number; t: number; bits: number }) {
  const x = FX + props.col * META;
  const y = FY + props.row * META;
  const t = props.t;

  if (t === Tile.EMPTY || t >= 13) return null;

  if (t === Tile.WATER) {
    const flash = (store.frame >> 4) & 1;
    return (
      <node
        x={x}
        y={y}
        width={META}
        height={META}
        backgroundColor={flash ? COLORS.waterLight : COLORS.water}
      />
    );
  }

  if (t === Tile.ICE) {
    return <node x={x} y={y} width={META} height={META} backgroundColor={COLORS.ice} />;
  }

  if (t === Tile.STEEL || (t >= Tile.PS0 && t <= Tile.PS3)) {
    const STEEL_BLOCK = [0b1010, 0b1100, 0b0101, 0b0011];
    const mask = t === Tile.STEEL ? 0b1111 : STEEL_BLOCK[t - Tile.PS0];
    return (
      <group x={x} y={y} width={META} height={META}>
        {[0, 1, 2, 3].map((q) =>
          mask & (1 << q) ? (
            <node
              x={(q & 1) * 8}
              y={(q >> 1) * 8}
              width={8}
              height={8}
              backgroundColor={COLORS.steel}
              borderWidth={1}
              borderColor={COLORS.steelDark}
            />
          ) : null,
        )}
      </group>
    );
  }

  if (t === Tile.BRICK || (t >= Tile.PB0 && t <= Tile.PB3)) {
    const bits = props.bits;
    return (
      <group x={x} y={y} width={META} height={META}>
        {[0, 1, 2, 3].map((q) =>
          bits & (1 << q) ? (
            <node
              x={(q & 1) * 8}
              y={(q >> 1) * 8}
              width={8}
              height={8}
              backgroundColor={COLORS.brick}
              borderWidth={1}
              borderColor={COLORS.brickDark}
            />
          ) : null,
        )}
      </group>
    );
  }

  return null;
}

function ForestLayer() {
  const cells: { r: number; c: number }[] = [];
  for (let r = 0; r < 13; r += 1) {
    for (let c = 0; c < 13; c += 1) {
      if (store.grid[r][c] === Tile.FOREST) cells.push({ r, c });
    }
  }
  return (
    <For each={cells}>
      {(cell) => (
        <node
          x={FX + cell.c * META}
          y={FY + cell.r * META}
          width={META}
          height={META}
          backgroundColor={COLORS.forest}
          alpha={0.85}
          zIndex={20}
        />
      )}
    </For>
  );
}

function TankSprite(props: { e: Entity }) {
  const e = props.e;
  if (!e.alive && e.deathTimer <= 0) return null;
  if (!e.alive) {
    const s = 8 + (24 - e.deathTimer);
    return (
      <node
        x={e.x - s / 2}
        y={e.y - s / 2}
        width={s}
        height={s}
        shape="circular"
        backgroundColor="#fc9838"
        zIndex={15}
      />
    );
  }
  if (e.spawnAnim > 0) {
    const s = 4 + ((30 - e.spawnAnim) % 8);
    return (
      <node
        x={e.x - s / 2}
        y={e.y - s / 2}
        width={s}
        height={s}
        backgroundColor="#f8f8f8"
        zIndex={15}
      />
    );
  }
  if (e.blinkFrame > 0 && (e.blinkFrame & 1) === 0) return null;

  const body = tankColor(e);
  const barrelW = e.dir === 1 || e.dir === 3 ? 10 : 4;
  const barrelH = e.dir === 0 || e.dir === 2 ? 10 : 4;
  const bx = e.dir === 3 ? 8 : e.dir === 1 ? -2 : 6;
  const by = e.dir === 2 ? 8 : e.dir === 0 ? -2 : 6;

  return (
    <group x={e.x - 8} y={e.y - 8} width={16} height={16} zIndex={10}>
      <node x={1} y={1} width={14} height={14} backgroundColor={body} borderWidth={1} borderColor="#000" />
      <node x={bx} y={by} width={barrelW} height={barrelH} backgroundColor={body} />
      <Show when={e.shieldTimer > 0 && (store.frame & 2) === 0}>
        <node x={0} y={0} width={16} height={16} borderWidth={2} borderColor="#3cbcfc" backgroundColor="transparent" />
      </Show>
    </group>
  );
}

function TouchPad() {
  const y0 = NES_H + 8;
  const btn = (label: string, x: number, y: number, w: number, h: number, dir: 'up' | 'down' | 'left' | 'right' | 'fire' | 'start') => (
    <group
      x={x}
      y={y}
      width={w}
      height={h}
      clickable
      onPointerDown={() => setTouch(dir, true)}
      onPointerUp={() => setTouch(dir, false)}
      onPointerUpOutside={() => setTouch(dir, false)}
    >
      <node x={0} y={0} width={w} height={h} shape="roundedRect(6 6 6 6)" backgroundColor="#374151" />
      <text x={0} y={h / 2 - 8} width={w} height={16} text={label} textAlign="center" textColor="#fff" textSize="14" />
    </group>
  );

  return (
    <group x={0} y={0} width={SCENE_W} height={SCENE_H}>
      <node x={0} y={NES_H} width={SCENE_W} height={TOUCH_H} backgroundColor="#111" />
      {btn('↑', 40, y0, 36, 28, 'up')}
      {btn('←', 8, y0 + 30, 36, 28, 'left')}
      {btn('→', 72, y0 + 30, 36, 28, 'right')}
      {btn('↓', 40, y0 + 30, 36, 28, 'down')}
      {btn('FIRE', 160, y0 + 8, 56, 48, 'fire')}
      {btn('START', 220, y0 + 16, 32, 36, 'start')}
    </group>
  );
}

function Game() {
  useFrame((frame) => {
    const dtMs = Math.min(frame.deltaSeconds, 0.05) * 1000;
    commitChange('tick', (draft: GameState) => {
      draft.tickAccMs += dtMs;
      let guard = 0;
      while (draft.tickAccMs >= TICK_MS && guard < 5) {
        draft.tickAccMs -= TICK_MS;
        tick(draft);
        guard += 1;
      }
    });
  });

  const remainingIcons = () => {
    const n = store.enemiesLeft + store.activeEnemyCount;
    // show remaining to spawn + alive roughly as enemiesLeft icons historically
    return Math.max(0, store.enemiesLeft);
  };

  return (
    <scene
      name="main"
      width={SCENE_W}
      height={SCENE_H}
      backgroundColor={COLORS.bg}
      onKeyDown={(e) => {
        const code = e.detail?.code;
        if (code) setKey(code, true);
      }}
      onKeyUp={(e) => {
        const code = e.detail?.code;
        if (code) setKey(code, false);
      }}
    >
      {/* NES playfield chrome */}
      <node x={0} y={0} width={NES_W} height={NES_H} backgroundColor={COLORS.hud} />
      <node x={FX} y={FY} width={13 * META} height={13 * META} backgroundColor="#000" />

      <Show when={store.phase === 'title'}>
        <group x={0} y={0} width={NES_W} height={NES_H} zIndex={50}>
          <text x={0} y={48} width={NES_W} height={28} text="BATTLE CITY" textAlign="center" textColor={COLORS.title} textSize="28" />
          <text x={0} y={88} width={NES_W} height={18} text="FC TANK 1-10" textAlign="center" textColor={COLORS.text} textSize="14" />
          <text x={0} y={130} width={NES_W} height={18} text="▶  1 PLAYER" textAlign="center" textColor={COLORS.player} textSize="16" />
          <text x={0} y={160} width={NES_W} height={16} text="ENTER / START" textAlign="center" textColor="#aaa" textSize="12" />
          <text x={0} y={200} width={NES_W} height={14} text={`HI ${store.hiScore}`} textAlign="center" textColor="#ccc" textSize="12" />
        </group>
      </Show>

      <Show when={store.phase === 'select'}>
        <group x={0} y={0} width={NES_W} height={NES_H} zIndex={50}>
          <text x={0} y={80} width={NES_W} height={24} text="STAGE" textAlign="center" textColor={COLORS.text} textSize="22" />
          <text
            x={0}
            y={120}
            width={NES_W}
            height={32}
            text={String(store.selectedStage + 1).padStart(2, '0')}
            textAlign="center"
            textColor={COLORS.player}
            textSize="32"
          />
          <text x={0} y={170} width={NES_W} height={14} text="←/→ 或 FIRE/SHIFT 选关" textAlign="center" textColor="#aaa" textSize="11" />
          <text x={0} y={190} width={NES_W} height={14} text="ENTER 开始" textAlign="center" textColor="#aaa" textSize="11" />
        </group>
      </Show>

      <Show when={store.phase === 'playing' || store.phase === 'paused'}>
        {/* map tiles except forest */}
        <For each={store.grid.flatMap((row, r) => row.map((t, c) => ({ r, c, t, bits: store.brickBits[r][c] })))}>
          {(cell) =>
            cell.t !== Tile.FOREST ? (
              <TileCell row={cell.r} col={cell.c} t={cell.t} bits={cell.bits} />
            ) : null
          }
        </For>

        {/* eagle */}
        <Show when={store.eagleAlive}>
          <group x={EAGLE.x - 8} y={EAGLE.y - 8} width={16} height={16} zIndex={5}>
            <node x={2} y={4} width={12} height={10} backgroundColor={COLORS.eagle} />
            <node x={6} y={1} width={4} height={5} backgroundColor="#f8d878" />
          </group>
        </Show>
        <Show when={!store.eagleAlive}>
          <node x={EAGLE.x - 10} y={EAGLE.y - 10} width={20} height={20} shape="circular" backgroundColor="#f83800" zIndex={5} />
        </Show>

        <For each={store.entities}>{(e) => <TankSprite e={e} />}</For>

        <For each={store.bullets}>
          {(b) =>
            b.active || b.explodeTimer > 0 ? (
              <node
                x={b.x - 2}
                y={b.y - 2}
                width={4}
                height={4}
                backgroundColor={b.explodeTimer > 0 ? '#fc9838' : '#f8f8f8'}
                zIndex={12}
              />
            ) : null
          }
        </For>

        <Show when={!!store.powerup}>
          <node
            x={(store.powerup?.x ?? 0) - 8}
            y={(store.powerup?.y ?? 0) - 8}
            width={16}
            height={16}
            backgroundColor={COLORS.powerup}
            borderWidth={2}
            borderColor="#f80000"
            zIndex={18}
            alpha={(store.frame >> 3) & 1 ? 1 : 0.4}
          />
        </Show>

        <ForestLayer />

        {/* HUD right */}
        <group x={FX + 13 * META + 4} y={FY} width={28} height={200} zIndex={30}>
          <For each={Array.from({ length: Math.min(20, remainingIcons()) }, (_, i) => i)}>
            {(i) => (
              <node
                x={(i % 2) * 10}
                y={Math.floor(i / 2) * 10}
                width={8}
                height={8}
                backgroundColor="#c8c8c8"
              />
            )}
          </For>
          <text x={0} y={110} width={28} height={12} text="IP" textColor="#fff" textSize="10" />
          <text x={0} y={124} width={28} height={12} text={`×${Math.max(0, store.lives)}`} textColor={COLORS.player} textSize="12" />
          <text x={0} y={150} width={28} height={12} text="ST" textColor="#fff" textSize="10" />
          <text x={0} y={164} width={28} height={14} text={`${store.stageIndex + 1}`} textColor="#fff" textSize="14" />
        </group>

        <text x={8} y={2} width={120} height={12} text={`SCORE ${store.score}`} textColor="#f8e800" textSize="10" zIndex={40} />

        <Show when={store.phase === 'paused'}>
          <text x={0} y={110} width={NES_W} height={24} text="PAUSE" textAlign="center" textColor="#fff" textSize="22" zIndex={60} />
        </Show>
      </Show>

      <Show when={store.phase === 'tally'}>
        <group x={0} y={0} width={NES_W} height={NES_H} zIndex={50}>
          <node x={0} y={0} width={NES_W} height={NES_H} backgroundColor="#000" />
          <text x={0} y={40} width={NES_W} height={20} text={`STAGE ${store.stageIndex + 1}`} textAlign="center" textColor="#fff" textSize="18" />
          <text x={40} y={80} width={180} height={16} text={`BASIC  ×${store.killCounts[0]}  ${store.killCounts[0] * 100}`} textColor="#ccc" textSize="12" />
          <text x={40} y={100} width={180} height={16} text={`FAST   ×${store.killCounts[1]}  ${store.killCounts[1] * 200}`} textColor="#ccc" textSize="12" />
          <text x={40} y={120} width={180} height={16} text={`POWER  ×${store.killCounts[2]}  ${store.killCounts[2] * 300}`} textColor="#ccc" textSize="12" />
          <text x={40} y={140} width={180} height={16} text={`ARMOR  ×${store.killCounts[3]}  ${store.killCounts[3] * 400}`} textColor="#ccc" textSize="12" />
          <text x={0} y={180} width={NES_W} height={18} text={`SCORE ${store.score}`} textAlign="center" textColor="#f8e800" textSize="16" />
        </group>
      </Show>

      <Show when={store.phase === 'gameover'}>
        <group x={0} y={0} width={NES_W} height={NES_H} zIndex={50}>
          <text x={0} y={100} width={NES_W} height={28} text="GAME OVER" textAlign="center" textColor="#f80000" textSize="26" />
          <text x={0} y={140} width={NES_W} height={16} text={`SCORE ${store.score}`} textAlign="center" textColor="#fff" textSize="14" />
          <text x={0} y={170} width={NES_W} height={14} text="ENTER 返回" textAlign="center" textColor="#aaa" textSize="12" />
        </group>
      </Show>

      <Show when={store.phase === 'cleared'}>
        <group x={0} y={0} width={NES_W} height={NES_H} zIndex={50}>
          <text x={0} y={90} width={NES_W} height={24} text="STAGE 1-10 CLEAR!" textAlign="center" textColor={COLORS.player} textSize="20" />
          <text x={0} y={130} width={NES_W} height={16} text={`SCORE ${store.score}`} textAlign="center" textColor="#fff" textSize="14" />
          <text x={0} y={160} width={NES_W} height={14} text="ENTER 返回标题" textAlign="center" textColor="#aaa" textSize="12" />
        </group>
      </Show>

      <TouchPad />
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });

void ENEMIES_PER_STAGE;
