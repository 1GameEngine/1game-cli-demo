import { For, Show } from 'solid-js';
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
import { makeTitleState } from './data/initial';
import { Sprites } from './render/sprites';
import { tick } from './sim/tick';
import type { Entity, GameState } from './state/types';
import tankBasicUp from './assets/tank-basic-up.svg';
import tankFastUp from './assets/tank-fast-up.svg';
import tankPowerUp from './assets/tank-power-up.svg';
import tankArmor4Up from './assets/tank-armor4-up.svg';

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
        return;
      }
      if (code === 'ArrowLeft' || code === 'KeyA') {
        draft.input.select = pressed;
        return;
      }
    }

    const field = map[code];
    if (!field) return;
    (draft.input as Record<string, boolean>)[field] = pressed;
  });
}

function setTouch(dir: 'up' | 'down' | 'left' | 'right' | 'fire' | 'start', pressed: boolean): void {
  commitChange(`touch:${dir}:${pressed ? 1 : 0}`, (draft: GameState) => {
    if (dir === 'start') draft.input.start = pressed;
    else draft.input[dir] = pressed;
  });
}

function TileCell(props: { row: number; col: number; t: number; bits: number }) {
  const x = FX + props.col * META;
  const y = FY + props.row * META;
  const t = props.t;

  if (t === Tile.EMPTY || t >= 13) return null;

  if (t === Tile.WATER) {
    return <image source={Sprites.waterSprite(store.frame)} x={x} y={y} width={META} height={META} imageFit="fill" />;
  }
  if (t === Tile.ICE) {
    return <image source={Sprites.tileIce} x={x} y={y} width={META} height={META} imageFit="fill" />;
  }
  if (t === Tile.STEEL) {
    return <image source={Sprites.tileSteel} x={x} y={y} width={META} height={META} imageFit="fill" />;
  }
  if (t >= Tile.PS0 && t <= Tile.PS3) {
    const STEEL_BLOCK = [0b1010, 0b1100, 0b0101, 0b0011];
    const mask = STEEL_BLOCK[t - Tile.PS0];
    return (
      <group x={x} y={y} width={META} height={META}>
        {[0, 1, 2, 3].map((q) =>
          mask & (1 << q) ? (
            <image
              source={Sprites.steelQuadSprite(q)}
              x={0}
              y={0}
              width={META}
              height={META}
              imageFit="fill"
            />
          ) : null,
        )}
      </group>
    );
  }
  if (t === Tile.BRICK || (t >= Tile.PB0 && t <= Tile.PB3)) {
    const bits = props.bits;
    if (bits === 0b1111) {
      return <image source={Sprites.tileBrick} x={x} y={y} width={META} height={META} imageFit="fill" />;
    }
    return (
      <group x={x} y={y} width={META} height={META}>
        {[0, 1, 2, 3].map((q) =>
          bits & (1 << q) ? (
            <image source={Sprites.brickQuadSprite(q)} x={0} y={0} width={META} height={META} imageFit="fill" />
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
        <image
          source={Sprites.tileForest}
          x={FX + cell.c * META}
          y={FY + cell.r * META}
          width={META}
          height={META}
          imageFit="fill"
          alpha={0.92}
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
    return (
      <image
        source={Sprites.explode}
        x={e.x - 8}
        y={e.y - 8}
        width={16}
        height={16}
        imageFit="fill"
        zIndex={15}
      />
    );
  }
  if (e.spawnAnim > 0) {
    return (
      <image
        source={Sprites.spawn}
        x={e.x - 8}
        y={e.y - 8}
        width={16}
        height={16}
        imageFit="fill"
        zIndex={15}
        alpha={0.5 + ((e.spawnAnim % 6) / 12)}
      />
    );
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
    const dtMs = Math.min(Math.max(frame.deltaSeconds, 0), 0.25) * 1000;
    commitChange('tick', (draft: GameState) => {
      draft.tickAccMs += dtMs;
      let guard = 0;
      while (draft.tickAccMs >= TICK_MS && guard < 32) {
        draft.tickAccMs -= TICK_MS;
        tick(draft);
        guard += 1;
      }
    });
  });

  const remainingIcons = () => Math.max(0, store.enemiesLeft);

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
      <Show when={store.phase === 'playing' || store.phase === 'paused'}>
        <node x={0} y={0} width={NES_W} height={NES_H} backgroundColor={COLORS.hud} />
        <node x={FX} y={FY} width={13 * META} height={13 * META} backgroundColor="#000" />
      </Show>
      <Show when={store.phase !== 'playing' && store.phase !== 'paused'}>
        <node x={0} y={0} width={NES_W} height={NES_H} backgroundColor="#000" />
      </Show>

      <Show when={store.phase === 'title'}>
        <group x={0} y={0} width={NES_W} height={NES_H} zIndex={50}>
          <image source={Sprites.titleTank} x={(NES_W - 96) / 2} y={28} width={96} height={48} imageFit="contain" />
          <text x={0} y={84} width={NES_W} height={28} text="BATTLE CITY" textAlign="center" textColor={COLORS.title} textSize="26" />
          <text x={0} y={114} width={NES_W} height={16} text="FC TANK 1-10" textAlign="center" textColor={COLORS.text} textSize="14" />
          <text x={0} y={150} width={NES_W} height={18} text="▶  1 PLAYER" textAlign="center" textColor={COLORS.player} textSize="16" />
          <text x={0} y={178} width={NES_W} height={14} text="ENTER / START" textAlign="center" textColor="#aaa" textSize="12" />
          <text x={0} y={208} width={NES_W} height={14} text={`HI ${store.hiScore}`} textAlign="center" textColor="#ccc" textSize="12" />
        </group>
      </Show>

      <Show when={store.phase === 'select'}>
        <group x={0} y={0} width={NES_W} height={NES_H} zIndex={50}>
          <image source={Sprites.hudFlag} x={NES_W / 2 - 12} y={56} width={24} height={24} imageFit="contain" />
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

      <Show when={store.phase === 'playing' || store.phase === 'paused'}>
        <For each={store.grid.flatMap((row, r) => row.map((t, c) => ({ r, c, t, bits: store.brickBits[r][c] })))}>
          {(cell) =>
            cell.t !== Tile.FOREST ? <TileCell row={cell.r} col={cell.c} t={cell.t} bits={cell.bits} /> : null
          }
        </For>

        <image
          source={store.eagleAlive ? Sprites.eagle : Sprites.eagleDead}
          x={EAGLE.x - 8}
          y={EAGLE.y - 8}
          width={16}
          height={16}
          imageFit="fill"
          zIndex={5}
        />

        <For each={store.entities}>{(e) => <TankSprite e={e} />}</For>

        <For each={store.bullets}>
          {(b) =>
            b.active || b.explodeTimer > 0 ? (
              <image
                source={b.explodeTimer > 0 ? Sprites.bulletExplode : Sprites.bullet}
                x={b.explodeTimer > 0 ? b.x - 4 : b.x - 2}
                y={b.explodeTimer > 0 ? b.y - 4 : b.y - 2}
                width={b.explodeTimer > 0 ? 8 : 4}
                height={b.explodeTimer > 0 ? 8 : 4}
                imageFit="fill"
                zIndex={12}
              />
            ) : null
          }
        </For>

        <Show when={!!store.powerup}>
          <image
            source={Sprites.powerupSprite(store.powerup?.type ?? 0)}
            x={(store.powerup?.x ?? 0) - 8}
            y={(store.powerup?.y ?? 0) - 8}
            width={16}
            height={16}
            imageFit="fill"
            zIndex={18}
            alpha={(store.frame >> 3) & 1 ? 1 : 0.35}
          />
        </Show>

        <ForestLayer />

        <group x={FX + 13 * META + 4} y={FY} width={28} height={200} zIndex={30}>
          <For each={Array.from({ length: Math.min(20, remainingIcons()) }, (_, i) => i)}>
            {(i) => (
              <image
                source={Sprites.hudEnemy}
                x={(i % 2) * 10}
                y={Math.floor(i / 2) * 10}
                width={8}
                height={8}
                imageFit="fill"
              />
            )}
          </For>
          <image source={Sprites.hudPlayer} x={0} y={112} width={12} height={12} imageFit="fill" />
          <text x={12} y={112} width={16} height={12} text={`${Math.max(0, store.lives)}`} textColor={COLORS.player} textSize="11" />
          <image source={Sprites.hudFlag} x={0} y={150} width={12} height={12} imageFit="fill" />
          <text x={12} y={150} width={16} height={14} text={`${store.stageIndex + 1}`} textColor="#fff" textSize="12" />
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
          <image source={tankBasicUp} x={40} y={78} width={16} height={16} imageFit="fill" />
          <text x={64} y={80} width={160} height={16} text={`BASIC  ×${store.killCounts[0]}  ${store.killCounts[0] * 100}`} textColor="#ccc" textSize="12" />
          <image source={tankFastUp} x={40} y={98} width={16} height={16} imageFit="fill" />
          <text x={64} y={100} width={160} height={16} text={`FAST   ×${store.killCounts[1]}  ${store.killCounts[1] * 200}`} textColor="#ccc" textSize="12" />
          <image source={tankPowerUp} x={40} y={118} width={16} height={16} imageFit="fill" />
          <text x={64} y={120} width={160} height={16} text={`POWER  ×${store.killCounts[2]}  ${store.killCounts[2] * 300}`} textColor="#ccc" textSize="12" />
          <image source={tankArmor4Up} x={40} y={138} width={16} height={16} imageFit="fill" />
          <text x={64} y={140} width={160} height={16} text={`ARMOR  ×${store.killCounts[3]}  ${store.killCounts[3] * 400}`} textColor="#ccc" textSize="12" />
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
