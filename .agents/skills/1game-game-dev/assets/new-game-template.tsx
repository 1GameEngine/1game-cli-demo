import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Enemy = {
  id: string;
  x: number;
  y: number;
  vx: number;
};

type GameState = {
  phase: 'playing' | 'won' | 'lost';
  score: number;
  timeMs: number;
  player: {
    x: number;
    y: number;
    speed: number;
  };
  input: {
    left: boolean;
    right: boolean;
  };
  enemies: Enemy[];
};

const SCENE_WIDTH = 320;
const SCENE_HEIGHT = 180;
const PLAYER_SIZE = 18;

const { store, commitChange, storeHistory } = createGameStore(
  {
    phase: 'playing',
    score: 0,
    timeMs: 0,
    player: { x: 151, y: 142, speed: 110 },
    input: { left: false, right: false },
    enemies: [
      { id: 'enemy-1', x: 16, y: 44, vx: 45 },
      { id: 'enemy-2', x: 210, y: 78, vx: -35 },
    ],
  } satisfies GameState,
  { enableHistory: true },
);

function intersects(a: { x: number; y: number; size: number }, b: { x: number; y: number; size: number }): boolean {
  return a.x < b.x + b.size && a.x + a.size > b.x && a.y < b.y + b.size && a.y + a.size > b.y;
}

function tickGame(draft: GameState, deltaSeconds: number): void {
  if (draft.phase !== 'playing') return;

  draft.timeMs += deltaSeconds * 1000;
  const direction = Number(draft.input.right) - Number(draft.input.left);
  draft.player.x = Math.max(0, Math.min(SCENE_WIDTH - PLAYER_SIZE, draft.player.x + direction * draft.player.speed * deltaSeconds));

  for (const enemy of draft.enemies) {
    enemy.x += enemy.vx * deltaSeconds;
    if (enemy.x <= 0 || enemy.x >= SCENE_WIDTH - 16) {
      enemy.vx *= -1;
      enemy.x = Math.max(0, Math.min(SCENE_WIDTH - 16, enemy.x));
    }
    if (intersects({ x: draft.player.x, y: draft.player.y, size: PLAYER_SIZE }, { x: enemy.x, y: enemy.y, size: 16 })) {
      draft.phase = 'lost';
    }
  }

  draft.score = Math.floor(draft.timeMs / 1000);
  if (draft.score >= 30) draft.phase = 'won';
}

function setInput(key: 'left' | 'right', pressed: boolean): void {
  commitChange(`输入:${key}:${pressed ? '按下' : '抬起'}`, (draft: GameState) => {
    draft.input[key] = pressed;
  });
}

function phaseLabel(phase: GameState['phase']): string {
  if (phase === 'playing') return '进行中';
  if (phase === 'won') return '胜利';
  return '失败';
}

function Game() {
  useFrame((frame) => {
    const deltaSeconds = Math.min(frame.deltaSeconds, 0.05);
    commitChange('逻辑帧', (draft: GameState) => tickGame(draft, deltaSeconds));
  });

  return (
    <scene
      name="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#111827"
      onKeyDown={(event) => {
        if (event.detail?.code === 'ArrowLeft') setInput('left', true);
        if (event.detail?.code === 'ArrowRight') setInput('right', true);
      }}
      onKeyUp={(event) => {
        if (event.detail?.code === 'ArrowLeft') setInput('left', false);
        if (event.detail?.code === 'ArrowRight') setInput('right', false);
      }}
    >
      <text x={8} y={8} width={180} height={20} text={`得分：${store.score}`} textColor="#f9fafb" textSize="16" />
      <text x={190} y={8} width={120} height={20} text={phaseLabel(store.phase)} textColor="#facc15" textAlign="right" textSize="16" />

      <node
        x={store.player.x}
        y={store.player.y}
        width={PLAYER_SIZE}
        height={PLAYER_SIZE}
        shape="roundedRect(5 5 5 5)"
        backgroundColor="#38bdf8"
      />

      {store.enemies.map((enemy) => (
        <node x={enemy.x} y={enemy.y} width={16} height={16} shape="circular" backgroundColor="#fb7185" />
      ))}

      <group
        x={16}
        y={132}
        width={64}
        height={32}
        clickable
        onPointerDown={() => setInput('left', true)}
        onPointerUp={() => setInput('left', false)}
      >
        <node x={0} y={0} width={64} height={32} shape="roundedRect(8 8 8 8)" backgroundColor="#374151" />
        <text x={0} y={7} width={64} height={18} text="左移" textColor="#fff" textAlign="center" textSize="16" />
      </group>

      <group
        x={240}
        y={132}
        width={64}
        height={32}
        clickable
        onPointerDown={() => setInput('right', true)}
        onPointerUp={() => setInput('right', false)}
      >
        <node x={0} y={0} width={64} height={32} shape="roundedRect(8 8 8 8)" backgroundColor="#374151" />
        <text x={0} y={7} width={64} height={18} text="右移" textColor="#fff" textAlign="center" textSize="16" />
      </group>
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
