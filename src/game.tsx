import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';
import {
  BOARD_LEFT,
  BOARD_TOP,
  BUBBLE_DIAMETER,
  BUBBLE_RADIUS,
  CANNON_X,
  CANNON_Y,
  COLOR_HEX,
  COLS,
  DANGER_Y,
  ROW_HEIGHT,
  ROWS,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  cellCenter,
  cellCoords,
  type ColorId,
} from './grid';
import {
  AIM_STEP,
  COLLISION_DIST,
  PROJECTILE_SPEED,
  type GameState,
  attachProjectile,
  clampAim,
  finalizeFalling,
  finalizePopping,
  makeInitialState,
} from './rules';

const WALL_LEFT = BOARD_LEFT - BUBBLE_RADIUS;
const WALL_RIGHT = BOARD_LEFT + (COLS - 1) * BUBBLE_DIAMETER + BUBBLE_DIAMETER / 2 + BUBBLE_RADIUS;
const BOARD_CEILING = BOARD_TOP - BUBBLE_RADIUS;

const { store, commitChange, storeHistory } = createGameStore(makeInitialState(), { enableHistory: true });

function aimFromPointer(x: number, y: number): number {
  const dx = x - CANNON_X;
  const dy = y - CANNON_Y;
  // Angle from upward axis: 0 = straight up, negative = left, positive = right.
  return clampAim(Math.atan2(dx, -dy));
}

function setAim(angle: number): void {
  commitChange('瞄准', (draft: GameState) => {
    if (draft.phase === 'lost' || draft.phase === 'won') return;
    draft.aimAngle = clampAim(angle);
  });
}

function nudgeAim(delta: number): void {
  commitChange('微调瞄准', (draft: GameState) => {
    if (draft.phase === 'lost' || draft.phase === 'won') return;
    draft.aimAngle = clampAim(draft.aimAngle + delta);
  });
}

function fire(): void {
  commitChange('发射', (draft: GameState) => {
    if (draft.phase === 'won' || draft.phase === 'lost') return;
    if (draft.anim.phase !== 'idle') return;
    if (draft.projectile) return;

    if (draft.phase === 'ready') draft.phase = 'playing';

    const speed = PROJECTILE_SPEED;
    const vx = Math.sin(draft.aimAngle) * speed;
    const vy = -Math.cos(draft.aimAngle) * speed;

    draft.projectile = {
      x: CANNON_X,
      y: CANNON_Y,
      vx,
      vy,
      color: draft.currentColor,
    };
    draft.anim.phase = 'flying';
    draft.anim.elapsedMs = 0;
    draft.anim.durationMs = 0;
    draft.anim.popIndices = [];
    draft.anim.fallItems = [];
  });
}

function swapBalls(): void {
  commitChange('交换', (draft: GameState) => {
    if (draft.phase === 'won' || draft.phase === 'lost') return;
    if (draft.anim.phase !== 'idle') return;
    const tmp = draft.currentColor;
    draft.currentColor = draft.nextColor;
    draft.nextColor = tmp;
  });
}

function restart(): void {
  commitChange('重开', (draft: GameState) => {
    const next = makeInitialState(Math.max(draft.bestScore, draft.score), draft.rngSeed);
    Object.assign(draft, next);
  });
}

function handlePrimaryAction(): void {
  if (store.phase === 'won' || store.phase === 'lost') {
    restart();
    return;
  }
  fire();
}

function collidesWithGrid(draft: GameState, x: number, y: number): boolean {
  for (let i = 0; i < draft.grid.length; i += 1) {
    if (!draft.grid[i]) continue;
    const { col, row } = cellCoords(i);
    const center = cellCenter(col, row);
    const dx = center.x - x;
    const dy = center.y - y;
    if (dx * dx + dy * dy <= COLLISION_DIST * COLLISION_DIST) return true;
  }
  return false;
}

function advanceProjectile(draft: GameState, dt: number): void {
  const p = draft.projectile;
  if (!p || draft.anim.phase !== 'flying') return;

  const steps = 4;
  const stepDt = dt / steps;

  for (let s = 0; s < steps; s += 1) {
    p.x += p.vx * stepDt;
    p.y += p.vy * stepDt;

    if (p.x - BUBBLE_RADIUS <= WALL_LEFT) {
      p.x = WALL_LEFT + BUBBLE_RADIUS;
      p.vx = Math.abs(p.vx);
    } else if (p.x + BUBBLE_RADIUS >= WALL_RIGHT) {
      p.x = WALL_RIGHT - BUBBLE_RADIUS;
      p.vx = -Math.abs(p.vx);
    }

    if (p.y - BUBBLE_RADIUS <= BOARD_CEILING) {
      p.y = BOARD_CEILING + BUBBLE_RADIUS;
      attachProjectile(draft);
      return;
    }

    if (collidesWithGrid(draft, p.x, p.y)) {
      attachProjectile(draft);
      return;
    }

    // Fell below playfield — recycle without ceiling drop penalty beyond a wasted shot.
    if (p.y > SCENE_HEIGHT + BUBBLE_DIAMETER) {
      draft.projectile = null;
      draft.anim.phase = 'idle';
      draft.anim.elapsedMs = 0;
      draft.anim.popIndices = [];
      draft.anim.fallItems = [];
      // Still consume a shot toward ceiling drop.
      draft.shotsUntilDrop -= 1;
      const colors = draft.grid.flatMap((c) => (c ? [c.color] : []));
      const unique = [...new Set(colors)] as ColorId[];
      if (unique.length > 0) {
        draft.currentColor = unique.includes(draft.nextColor) ? draft.nextColor : unique[0]!;
        // Keep next as-is if still valid; otherwise mirror current.
        if (!unique.includes(draft.nextColor)) draft.nextColor = draft.currentColor;
      }
      return;
    }
  }
}

function tickGame(draft: GameState, dt: number): void {
  if (draft.phase !== 'playing' && draft.phase !== 'ready') return;

  if (draft.anim.phase === 'flying') {
    advanceProjectile(draft, dt);
    return;
  }

  if (draft.anim.phase === 'popping') {
    draft.anim.elapsedMs += dt * 1000;
    if (draft.anim.elapsedMs >= draft.anim.durationMs) finalizePopping(draft);
    return;
  }

  if (draft.anim.phase === 'falling') {
    draft.anim.elapsedMs += dt * 1000;
    if (draft.anim.elapsedMs >= draft.anim.durationMs) finalizeFalling(draft);
  }
}

function BubbleNode(props: { x: number; y: number; color: ColorId; alpha?: number; key?: string }): unknown {
  const size = BUBBLE_DIAMETER - 2;
  return (
    <node
      x={props.x - size / 2}
      y={props.y - size / 2}
      width={size}
      height={size}
      shape="circular"
      backgroundColor={COLOR_HEX[props.color]}
      alpha={props.alpha ?? 1}
      border
      borderWidth={2}
      borderColor="#ffffff88"
    />
  );
}

function statusText(): string {
  if (store.phase === 'ready') return '点击或空格发射';
  if (store.phase === 'won') return '胜利！清空棋盘';
  if (store.phase === 'lost') return '失败：触碰危险线';
  if (store.anim.phase === 'flying') return '飞行中…';
  if (store.anim.phase === 'popping') return '消除中…';
  if (store.anim.phase === 'falling') return '掉落中…';
  return `下压倒计时 ${store.shotsUntilDrop}`;
}

function aimLineEnd(): { x: number; y: number } {
  const len = 120;
  return {
    x: CANNON_X + Math.sin(store.aimAngle) * len,
    y: CANNON_Y - Math.cos(store.aimAngle) * len,
  };
}

function Game(): unknown {
  useFrame((frame) => {
    const dt = Math.min(frame.deltaSeconds, 0.05);
    commitChange('tick', (draft: GameState) => tickGame(draft, dt));
  });

  const end = aimLineEnd();
  const popSet = new Set(store.anim.popIndices);
  const popProgress =
    store.anim.phase === 'popping' ? Math.min(1, store.anim.elapsedMs / Math.max(1, store.anim.durationMs)) : 0;
  const fallProgress =
    store.anim.phase === 'falling' ? Math.min(1, store.anim.elapsedMs / Math.max(1, store.anim.durationMs)) : 0;

  const boardBubbles: unknown[] = [];
  for (let i = 0; i < store.grid.length; i += 1) {
    const cell = store.grid[i];
    if (!cell) continue;
    if (popSet.has(i)) continue;
    const { col, row } = cellCoords(i);
    const center = cellCenter(col, row);
    boardBubbles.push(<BubbleNode x={center.x} y={center.y} color={cell.color} />);
  }

  for (const index of store.anim.popIndices) {
    const cell = store.grid[index];
    if (!cell) continue;
    const { col, row } = cellCoords(index);
    const center = cellCenter(col, row);
    boardBubbles.push(<BubbleNode x={center.x} y={center.y} color={cell.color} alpha={1 - popProgress} />);
  }

  for (const item of store.anim.fallItems) {
    boardBubbles.push(
      <BubbleNode x={item.x} y={item.y + fallProgress * 140} color={item.color} alpha={1 - fallProgress * 0.85} />,
    );
  }

  return (
    <scene
      name="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#0b1220"
      onKeyDown={(event) => {
        const code = event.detail?.code;
        if (code === 'ArrowLeft' || code === 'KeyA') nudgeAim(-AIM_STEP);
        if (code === 'ArrowRight' || code === 'KeyD') nudgeAim(AIM_STEP);
        if (code === 'Space' || code === 'Enter') handlePrimaryAction();
        if (code === 'KeyC') swapBalls();
        if (code === 'KeyR') restart();
      }}
      onPointerMove={(event) => {
        if (store.phase === 'won' || store.phase === 'lost') return;
        setAim(aimFromPointer(event.x, event.y));
      }}
      clickable
      onClick={(event) => {
        // Ignore clicks on bottom UI strip buttons by approximate y.
        if (event.y >= 575) return;
        if (store.phase === 'won' || store.phase === 'lost') {
          restart();
          return;
        }
        setAim(aimFromPointer(event.x, event.y));
        fire();
      }}
    >
      {/* Background panels */}
      <node x={0} y={0} width={SCENE_WIDTH} height={56} backgroundColor="#111827" />
      <node
        x={BOARD_LEFT - BUBBLE_RADIUS - 4}
        y={BOARD_TOP - BUBBLE_RADIUS - 4}
        width={COLS * BUBBLE_DIAMETER + BUBBLE_DIAMETER / 2 + 8}
        height={ROWS * ROW_HEIGHT + 8}
        shape="roundedRect(12 12 12 12)"
        backgroundColor="#1e293b"
      />

      {/* Danger line */}
      <line
        from={{ x: 16, y: DANGER_Y }}
        to={{ x: SCENE_WIDTH - 16, y: DANGER_Y }}
        borderColor="#f87171"
        borderWidth={2}
        alpha={0.7}
      />
      <text x={16} y={DANGER_Y + 4} width={120} height={16} text="危险线" textColor="#fca5a5" textSize="12" />

      {/* HUD */}
      <text x={12} y={10} width={160} height={20} text={`分数 ${store.score}`} textColor="#f8fafc" textSize="16" />
      <text
        x={188}
        y={10}
        width={160}
        height={20}
        text={`最高 ${store.bestScore}`}
        textAlign="right"
        textColor="#94a3b8"
        textSize="16"
      />
      <text x={12} y={32} width={336} height={18} text={statusText()} textColor="#facc15" textSize="14" />

      {boardBubbles}

      {/* Aim line */}
      {store.anim.phase === 'idle' && store.phase !== 'won' && store.phase !== 'lost' ? (
        <line
          from={{ x: CANNON_X, y: CANNON_Y }}
          to={{ x: end.x, y: end.y }}
          borderColor="#93c5fd"
          borderWidth={2}
          alpha={0.85}
        />
      ) : null}

      {/* Cannon base */}
      <node
        x={CANNON_X - 28}
        y={CANNON_Y + 10}
        width={56}
        height={22}
        shape="roundedRect(8 8 8 8)"
        backgroundColor="#334155"
      />

      {/* Current ball on cannon (hidden while flying that color projectile) */}
      {store.anim.phase === 'idle' || store.anim.phase === 'popping' || store.anim.phase === 'falling' ? (
        <BubbleNode x={CANNON_X} y={CANNON_Y} color={store.currentColor} />
      ) : null}

      {store.projectile ? <BubbleNode x={store.projectile.x} y={store.projectile.y} color={store.projectile.color} /> : null}

      {/* Next ball + controls */}
      <text x={24} y={578} width={48} height={16} text="下一个" textColor="#94a3b8" textSize="12" />
      <BubbleNode x={48} y={612} color={store.nextColor} />

      <group
        x={100}
        y={592}
        width={72}
        height={36}
        clickable
        onClick={() => {
          swapBalls();
        }}
      >
        <node x={0} y={0} width={72} height={36} shape="roundedRect(8 8 8 8)" backgroundColor="#2563eb" />
        <text x={0} y={8} width={72} height={20} text="交换" textAlign="center" textColor="#fff" textSize="14" />
      </group>

      <group
        x={184}
        y={592}
        width={72}
        height={36}
        clickable
        onClick={() => {
          handlePrimaryAction();
        }}
      >
        <node x={0} y={0} width={72} height={36} shape="roundedRect(8 8 8 8)" backgroundColor="#16a34a" />
        <text
          x={0}
          y={8}
          width={72}
          height={20}
          text={store.phase === 'won' || store.phase === 'lost' ? '重开' : '发射'}
          textAlign="center"
          textColor="#fff"
          textSize="14"
        />
      </group>

      <group
        x={268}
        y={592}
        width={72}
        height={36}
        clickable
        onClick={() => {
          restart();
        }}
      >
        <node x={0} y={0} width={72} height={36} shape="roundedRect(8 8 8 8)" backgroundColor="#475569" />
        <text x={0} y={8} width={72} height={20} text="重开" textAlign="center" textColor="#fff" textSize="14" />
      </group>

      {/* End overlay */}
      {store.phase === 'won' || store.phase === 'lost' ? (
        <group x={40} y={220} width={280} height={140} clickable onClick={() => restart()}>
          <node x={0} y={0} width={280} height={140} shape="roundedRect(16 16 16 16)" backgroundColor="#0f172acc" />
          <text
            x={0}
            y={28}
            width={280}
            height={32}
            text={store.phase === 'won' ? '胜利！' : '游戏结束'}
            textAlign="center"
            textColor={store.phase === 'won' ? '#4ade80' : '#f87171'}
            textSize="28"
          />
          <text
            x={0}
            y={70}
            width={280}
            height={24}
            text={`得分 ${store.score}  ·  点击重开`}
            textAlign="center"
            textColor="#e2e8f0"
            textSize="16"
          />
        </group>
      ) : null}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
