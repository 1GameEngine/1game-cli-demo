import { For, Show, Index } from 'solid-js';
import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';
import {
  COLORS,
  EAGLE,
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
import { makeTitleState, beginStage } from './data/initial';
import { Sprites, TILE_COORDS, STAGE_MAPS } from './render/sprites';
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
    if (draft.phase === 'select') {
      if (code === 'ArrowRight' || code === 'KeyD') {
        draft.input.fire = pressed;
        if (!pressed) draft.input.firePrev = false;
        return;
      }
      if (code === 'ArrowLeft' || code === 'KeyA') {
        draft.input.select = pressed;
        if (!pressed) draft.input.selectPrev = false;
        return;
      }
    }
    const field = map[code];
    if (!field) return;
    (draft.input as Record<string, boolean>)[field] = pressed;
    if (!pressed) {
      if (field === 'start') draft.input.startPrev = false;
      if (field === 'fire') draft.input.firePrev = false;
      if (field === 'select') draft.input.selectPrev = false;
    }
  });
}

function setTouch(dir: 'up' | 'down' | 'left' | 'right' | 'fire' | 'start', pressed: boolean): void {
  commitChange(`touch:${dir}:${pressed ? 1 : 0}`, (draft: GameState) => {
    if (dir === 'start') {
      draft.input.start = pressed;
      if (!pressed) draft.input.startPrev = false;
    } else {
      draft.input[dir] = pressed;
      if (dir === 'fire' && !pressed) draft.input.firePrev = false;
    }
  });
}

function TileCell(props: { r: number; c: number }) {
  const x = FX + props.c * META;
  const y = FY + props.r * META;
  const tt = store.grid[props.r][props.c];
  const bits = store.brickBits[props.r][props.c];
  if (tt === Tile.EMPTY || tt >= 13 || tt === Tile.FOREST) return null;
  if (tt === Tile.WATER) return <image source={Sprites.tileWater} x={x} y={y} width={META} height={META} imageFit="fill" />;
  if (tt === Tile.ICE) return <image source={Sprites.tileIce} x={x} y={y} width={META} height={META} imageFit="fill" />;
  if (tt === Tile.STEEL || (tt >= Tile.PS0 && tt <= Tile.PS3)) {
    return <image source={Sprites.tileSteel} x={x} y={y} width={META} height={META} imageFit="fill" />;
  }
  if (tt === Tile.BRICK || (tt >= Tile.PB0 && tt <= Tile.PB3)) {
    if (bits === 0) return null;
    return (
      <group x={x} y={y} width={META} height={META}>
        <image source={Sprites.tileBrick} x={0} y={0} width={META} height={META} imageFit="fill" />
        <Index each={[0, 1, 2, 3]}>
          {(q) =>
            !(bits & (1 << q())) ? (
              <node x={(q() & 1) * 8} y={(q() >> 1) * 8} width={8} height={8} backgroundColor="#000" />
            ) : null
          }
        </Index>
      </group>
    );
  }
  return null;
}

function ForestCell(props: { r: number; c: number }) {
  if (store.grid[props.r][props.c] !== Tile.FOREST) return null;
  return (
    <image
      source={Sprites.tileForest}
      x={FX + props.c * META}
      y={FY + props.r * META}
      width={META}
      height={META}
      imageFit="fill"
      zIndex={20}
      alpha={0.92}
    />
  );
}

function TankSprite(props: { e: Entity }) {
  const e = props.e;
  if (!e.alive && e.deathTimer <= 0) return null;
  if (!e.alive) {
    return <image source={Sprites.explode} x={e.x - 8} y={e.y - 8} width={16} height={16} imageFit="fill" zIndex={15} />;
  }
  if (e.spawnAnim > 0) {
    return <image source={Sprites.spawn} x={e.x - 8} y={e.y - 8} width={16} height={16} imageFit="fill" zIndex={15} />;
  }
  if (e.blinkFrame > 0 && (e.blinkFrame & 1) === 0) return null;
  return (
    <group x={e.x - 8} y={e.y - 8} width={16} height={16} zIndex={10}>
      <image source={Sprites.tankSprite(e, store.frame)} x={0} y={0} width={16} height={16} imageFit="fill" />
      <Show when={e.shieldTimer > 0 && (store.frame & 2) === 0}>
        <image source={Sprites.shield} x={0} y={0} width={16} height={16} imageFit="fill" />
      </Show>
    </group>
  );
}

function TouchPad() {
  const y0 = NES_H + 8;
  const btn = (
    label: string,
    x: number,
    y: number,
    w: number,
    h: number,
    dir: 'up' | 'down' | 'left' | 'right' | 'fire' | 'start',
  ) => (
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
      <text x={0} y={h / 2 - 8} width={w} height={16} text={label} textAlign="center" textSize="14" textColor="#fff" />
    </group>
  );
  return (
    <group x={0} y={0} width={SCENE_W} height={SCENE_H}>
      <node x={0} y={NES_H} width={SCENE_W} height={TOUCH_H} backgroundColor="#111" />
      {btn('↑', 40, y0, 36, 28, 'up')}
      {btn('←', 8, y0 + 30, 36, 28, 'left')}
      {btn('→', 72, y0 + 30, 36, 28, 'right')}
      {btn('↓', 40, y0 + 30, 36, 28, 'down')}
      {btn('FIRE', 140, y0 + 8, 52, 48, 'fire')}
      {btn('START', 200, y0 + 16, 48, 36, 'start')}
    </group>
  );
}

function Playfield() {
  return (
    <group x={0} y={0} width={NES_W} height={NES_H}>
      <node x={0} y={0} width={NES_W} height={NES_H} backgroundColor={COLORS.hud} />
      <image source={STAGE_MAPS[Math.min(store.stageIndex, STAGE_MAPS.length - 1)]} x={FX} y={FY} width={13 * META} height={13 * META} imageFit="fill" />
      <image source={Sprites.eagle} x={EAGLE.x - 8} y={EAGLE.y - 8} width={16} height={16} imageFit="fill" zIndex={5} />
      <For each={store.entities}>{(e) => <TankSprite e={e} />}</For>
      <For each={store.bullets}>
        {(b) =>
          b.active || b.explodeTimer > 0 ? (
            <image
              source={b.explodeTimer > 0 ? Sprites.explode : Sprites.bullet}
              x={b.explodeTimer > 0 ? b.x - 8 : b.x - 2}
              y={b.explodeTimer > 0 ? b.y - 8 : b.y - 2}
              width={b.explodeTimer > 0 ? 16 : 4}
              height={b.explodeTimer > 0 ? 16 : 4}
              imageFit="fill"
              zIndex={12}
            />
          ) : null
        }
      </For>
      <text x={8} y={2} width={120} height={12} text={`SCORE ${store.score}`} textColor="#f8e800" textSize="10" zIndex={40} />
      <text x={FX + 13 * META + 4} y={120} width={28} height={14} text={`x${store.lives}`} textColor={COLORS.player} textSize="12" zIndex={40} />
      <text x={FX + 13 * META + 4} y={160} width={28} height={14} text={`${store.stageIndex + 1}`} textColor="#fff" textSize="14" zIndex={40} />
    </group>
  );
}


function Game() {
  useFrame((frame) => {
    const dtMs = Math.min(Math.max(frame.deltaSeconds, 0), 0.25) * 1000;
    commitChange('tick', (draft: GameState) => {
      draft.tickAccMs += dtMs;
      let guard = 0;
      while (draft.tickAccMs >= TICK_MS && guard < 32) {
        draft.tickAccMs -= TICK_MS;
        if (!draft.assetsReady) {
          draft.frame += 1;
          if (draft.frame >= 90) draft.assetsReady = true;
          guard += 1;
          continue;
        }
        const startEdge = draft.input.start && !draft.input.startPrev;
        const fireEdge = draft.input.fire && !draft.input.firePrev;
        const selectEdge = draft.input.select && !draft.input.selectPrev;
        if (draft.phase === 'title') {
          draft.input.startPrev = draft.input.start;
          draft.input.firePrev = draft.input.fire;
          if (startEdge || fireEdge) {
            draft.phase = 'select';
            draft.selectedStage = 0;
          }
        } else if (draft.phase === 'select') {
          if (startEdge) {
            draft.score = 0;
            draft.lives = 3;
            draft.nextLifeAt = 20000;
            beginStage(draft, draft.selectedStage, true);
          } else if (fireEdge) draft.selectedStage = (draft.selectedStage + 1) % 10;
          else if (selectEdge) draft.selectedStage = (draft.selectedStage + 9) % 10;
          draft.input.startPrev = draft.input.start;
          draft.input.firePrev = draft.input.fire;
          draft.input.selectPrev = draft.input.select;
        } else {
          tick(draft);
        }
        guard += 1;
      }
    });
  });

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
      {/* Preload one image so ResourceScheduler warms the pipeline */}
      <image source={Sprites.titleTank} x={-16} y={-16} width={2} height={2} imageFit="fill" />
      <image source={STAGE_MAPS[0]} x={-16} y={-14} width={2} height={2} imageFit="fill" />
      <image source={STAGE_MAPS[1]} x={-16} y={-12} width={2} height={2} imageFit="fill" />
      <image source={Sprites.eagle} x={-16} y={-10} width={2} height={2} imageFit="fill" />
      <image source={Sprites.eagleDead} x={-16} y={-8} width={2} height={2} imageFit="fill" />
      <image source={Sprites.bullet} x={-16} y={-6} width={2} height={2} imageFit="fill" />
      <image source={Sprites.explode} x={-16} y={-4} width={2} height={2} imageFit="fill" />
      <image source={Sprites.spawn} x={-16} y={-2} width={2} height={2} imageFit="fill" />
      <image source={Sprites.puStar} x={-14} y={-16} width={2} height={2} imageFit="fill" />
      <image source={Sprites.shield} x={-12} y={-16} width={2} height={2} imageFit="fill" />

      <Show when={store.assetsReady} keyed>
        <group x={0} y={0} width={SCENE_W} height={SCENE_H}>
          <Show when={store.phase === 'title'}>
            <group x={0} y={0} width={NES_W} height={NES_H} zIndex={100}>
              <node x={0} y={0} width={NES_W} height={NES_H} backgroundColor="#000" />
              <image source={Sprites.titleTank} x={(NES_W - 96) / 2} y={28} width={96} height={48} imageFit="fill" />
              <text x={0} y={84} width={NES_W} height={28} text="BATTLE CITY" textAlign="center" textColor={COLORS.title} textSize="26" />
              <text x={0} y={114} width={NES_W} height={16} text="FC TANK 1-10" textAlign="center" textColor={COLORS.text} textSize="14" />
              <text x={0} y={150} width={NES_W} height={18} text="▶  1 PLAYER" textAlign="center" textColor={COLORS.player} textSize="16" />
              <text x={0} y={178} width={NES_W} height={14} text="ENTER / START" textAlign="center" textColor="#aaa" textSize="12" />
              <text x={0} y={208} width={NES_W} height={14} text={`HI ${store.hiScore}`} textAlign="center" textColor="#ccc" textSize="12" />
            </group>
          </Show>

          <Show when={store.phase === 'select'}>
            <group x={0} y={0} width={NES_W} height={NES_H} zIndex={100}>
              <node x={0} y={0} width={NES_W} height={NES_H} backgroundColor="#000" />
              <image source={Sprites.hudFlag} x={NES_W / 2 - 12} y={56} width={24} height={24} imageFit="fill" />
              <text x={0} y={90} width={NES_W} height={24} text="STAGE" textAlign="center" textColor={COLORS.text} textSize="22" />
              <text
                x={0}
                y={124}
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

          {/* Always mount playfield under overlays so map <image> stays prepared */}
          <Playfield />

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
              <node x={0} y={0} width={NES_W} height={NES_H} backgroundColor="#000" />
              <text x={0} y={100} width={NES_W} height={28} text="GAME OVER" textAlign="center" textColor="#f80000" textSize="26" />
              <text x={0} y={140} width={NES_W} height={16} text={`SCORE ${store.score}`} textAlign="center" textColor="#fff" textSize="14" />
              <text x={0} y={170} width={NES_W} height={14} text="ENTER 返回" textAlign="center" textColor="#aaa" textSize="12" />
            </group>
          </Show>

          <Show when={store.phase === 'cleared'}>
            <group x={0} y={0} width={NES_W} height={NES_H} zIndex={50}>
              <node x={0} y={0} width={NES_W} height={NES_H} backgroundColor="#000" />
              <text x={0} y={90} width={NES_W} height={24} text="STAGE 1-10 CLEAR!" textAlign="center" textColor={COLORS.player} textSize="20" />
              <text x={0} y={130} width={NES_W} height={16} text={`SCORE ${store.score}`} textAlign="center" textColor="#fff" textSize="14" />
              <text x={0} y={160} width={NES_W} height={14} text="ENTER 返回标题" textAlign="center" textColor="#aaa" textSize="12" />
            </group>
          </Show>
        </group>
      </Show>

      <TouchPad />
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
