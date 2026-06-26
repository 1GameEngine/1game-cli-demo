import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Pipe = {
  id: string;
  x: number;
  gapY: number;
  scored: boolean;
};

type GameState = {
  phase: 'ready' | 'playing' | 'lost';
  score: number;
  bird: {
    y: number;
    vy: number;
  };
  pipes: Pipe[];
  rng: { seed: number; cursor: number };
  nextPipeId: number;
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const BIRD_X = 88;
const BIRD_SIZE = 30;
const GRAVITY = 920;
const FLAP_VELOCITY = -310;
const PIPE_WIDTH = 58;
const PIPE_GAP = 128;
const PIPE_SPEED = 150;
const PIPE_SPACING = 200;
const GROUND_HEIGHT = 72;
const CEILING = 0;
const FLOOR = SCENE_HEIGHT - GROUND_HEIGHT - BIRD_SIZE;

function nextRandom(rng: { seed: number; cursor: number }): number {
  rng.cursor += 1;
  rng.seed = (rng.seed * 1664525 + 1013904223) >>> 0;
  return rng.seed / 0xffffffff;
}

function makeInitialState(): GameState {
  return {
    phase: 'ready',
    score: 0,
    bird: { y: SCENE_HEIGHT * 0.42, vy: 0 },
    pipes: [],
    rng: { seed: 0xf1a990, cursor: 0 },
    nextPipeId: 1,
  };
}

const { store, commitChange, storeHistory } = createGameStore(makeInitialState(), { enableHistory: true });

type Rect = { x: number; y: number; width: number; height: number };

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function birdRect(y: number): Rect {
  return { x: BIRD_X, y, width: BIRD_SIZE, height: BIRD_SIZE };
}

function spawnPipe(draft: GameState, x: number): void {
  const minGapCenter = PIPE_GAP / 2 + 48;
  const maxGapCenter = FLOOR + BIRD_SIZE / 2 - PIPE_GAP / 2;
  const gapY = minGapCenter + nextRandom(draft.rng) * (maxGapCenter - minGapCenter);
  draft.pipes.push({
    id: `pipe-${draft.nextPipeId}`,
    x,
    gapY,
    scored: false,
  });
  draft.nextPipeId += 1;
}

function ensurePipes(draft: GameState): void {
  if (draft.pipes.length === 0) {
    spawnPipe(draft, SCENE_WIDTH + 40);
    return;
  }
  const rightmost = draft.pipes.reduce((max, pipe) => Math.max(max, pipe.x), 0);
  if (rightmost < SCENE_WIDTH + PIPE_SPACING) {
    spawnPipe(draft, rightmost + PIPE_SPACING);
  }
}

function tickGame(draft: GameState, deltaSeconds: number): void {
  if (draft.phase === 'ready') {
    draft.bird.y = SCENE_HEIGHT * 0.42 + Math.sin(draft.rng.cursor * 0.08) * 6;
    return;
  }
  if (draft.phase !== 'playing') return;

  draft.bird.vy += GRAVITY * deltaSeconds;
  draft.bird.y += draft.bird.vy * deltaSeconds;

  if (draft.bird.y < CEILING) {
    draft.bird.y = CEILING;
    draft.bird.vy = 0;
  }
  if (draft.bird.y > FLOOR) {
    draft.phase = 'lost';
    return;
  }

  ensurePipes(draft);

  for (const pipe of draft.pipes) {
    pipe.x -= PIPE_SPEED * deltaSeconds;

    const topPipe: Rect = { x: pipe.x, y: 0, width: PIPE_WIDTH, height: pipe.gapY - PIPE_GAP / 2 };
    const bottomPipe: Rect = {
      x: pipe.x,
      y: pipe.gapY + PIPE_GAP / 2,
      width: PIPE_WIDTH,
      height: SCENE_HEIGHT - GROUND_HEIGHT - (pipe.gapY + PIPE_GAP / 2),
    };
    const bird = birdRect(draft.bird.y);
    if (intersects(bird, topPipe) || intersects(bird, bottomPipe)) {
      draft.phase = 'lost';
      return;
    }

    if (!pipe.scored && BIRD_X > pipe.x + PIPE_WIDTH) {
      pipe.scored = true;
      draft.score += 1;
    }
  }

  draft.pipes = draft.pipes.filter((pipe) => pipe.x + PIPE_WIDTH > -20);
}

function flap(): void {
  commitChange('flap', (draft: GameState) => {
    if (draft.phase === 'ready') {
      draft.phase = 'playing';
      draft.bird.vy = FLAP_VELOCITY;
      ensurePipes(draft);
      return;
    }
    if (draft.phase === 'playing') {
      draft.bird.vy = FLAP_VELOCITY;
      return;
    }
    if (draft.phase === 'lost') {
      Object.assign(draft, makeInitialState());
      draft.phase = 'playing';
      draft.bird.vy = FLAP_VELOCITY;
      ensurePipes(draft);
    }
  });
}

function phaseTitle(phase: GameState['phase']): string {
  if (phase === 'ready') return '点击或按空格开始';
  if (phase === 'lost') return '游戏结束 · 点击重玩';
  return '';
}

function Game() {
  useFrame((frame) => {
    const deltaSeconds = Math.min(frame.deltaSeconds, 0.05);
    commitChange('tick', (draft: GameState) => {
      if (draft.phase === 'playing' || draft.phase === 'ready') {
        draft.rng.cursor += 1;
      }
      tickGame(draft, deltaSeconds);
    });
  });

  return (
    <scene
      name="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#4ec0ca"
      clickable
      onClick={flap}
      onKeyDown={(event) => {
        if (event.detail?.code === 'Space' || event.detail?.code === 'ArrowUp') {
          flap();
        }
      }}
    >
      <node x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT - GROUND_HEIGHT} backgroundColor="#70c5ce" alpha={0.35} />

      <node x={40} y={80} width={64} height={28} shape="roundedRect(14 14 14 14)" backgroundColor="#ffffff" alpha={0.55} />
      <node x={220} y={140} width={88} height={34} shape="roundedRect(17 17 17 17)" backgroundColor="#ffffff" alpha={0.45} />
      <node x={150} y={220} width={52} height={22} shape="roundedRect(11 11 11 11)" backgroundColor="#ffffff" alpha={0.35} />

      {store.pipes.map((pipe) => (
        <group key={pipe.id}>
          <node
            x={pipe.x}
            y={0}
            width={PIPE_WIDTH}
            height={pipe.gapY - PIPE_GAP / 2}
            shape="roundedRect(6 0 6 0)"
            backgroundColor="#73bf2e"
            borderWidth={3}
            borderColor="#558c22"
          />
          <node
            x={pipe.x - 4}
            y={pipe.gapY - PIPE_GAP / 2 - 18}
            width={PIPE_WIDTH + 8}
            height={18}
            shape="roundedRect(4 4 4 4)"
            backgroundColor="#8fd43a"
            borderWidth={3}
            borderColor="#558c22"
          />
          <node
            x={pipe.x}
            y={pipe.gapY + PIPE_GAP / 2}
            width={PIPE_WIDTH}
            height={SCENE_HEIGHT - GROUND_HEIGHT - (pipe.gapY + PIPE_GAP / 2)}
            shape="roundedRect(0 6 0 6)"
            backgroundColor="#73bf2e"
            borderWidth={3}
            borderColor="#558c22"
          />
          <node
            x={pipe.x - 4}
            y={pipe.gapY + PIPE_GAP / 2}
            width={PIPE_WIDTH + 8}
            height={18}
            shape="roundedRect(4 4 4 4)"
            backgroundColor="#8fd43a"
            borderWidth={3}
            borderColor="#558c22"
          />
        </group>
      ))}

      <node x={0} y={SCENE_HEIGHT - GROUND_HEIGHT} width={SCENE_WIDTH} height={GROUND_HEIGHT} backgroundColor="#ded895" />
      <node x={0} y={SCENE_HEIGHT - GROUND_HEIGHT} width={SCENE_WIDTH} height={14} backgroundColor="#c8b66f" />

      <group x={BIRD_X} y={store.bird.y}>
        <node x={0} y={4} width={BIRD_SIZE} height={BIRD_SIZE - 6} shape="roundedRect(10 10 10 10)" backgroundColor="#f7d308" />
        <node x={BIRD_SIZE - 10} y={10} width={10} height={10} shape="circular" backgroundColor="#ffffff" />
        <node x={BIRD_SIZE - 4} y={12} width={5} height={5} shape="circular" backgroundColor="#1f2937" />
        <node x={BIRD_SIZE - 2} y={16} width={12} height={8} shape="triangle" backgroundColor="#f59e0b" />
      </group>

      <text
        x={0}
        y={36}
        width={SCENE_WIDTH}
        height={56}
        text={String(store.score)}
        textAlign="center"
        textColor="#ffffff"
        textSize="48"
        zIndex={10}
      />

      {phaseTitle(store.phase) ? (
        <group x={36} y={SCENE_HEIGHT * 0.38} width={288} height={96} zIndex={20}>
          <node x={0} y={0} width={288} height={96} shape="roundedRect(16 16 16 16)" backgroundColor="#0f172a" alpha={0.55} />
          <text
            x={0}
            y={20}
            width={288}
            height={28}
            text="Flappy Bird"
            textAlign="center"
            textColor="#fde047"
            textSize="24"
          />
          <text
            x={0}
            y={54}
            width={288}
            height={24}
            text={phaseTitle(store.phase)}
            textAlign="center"
            textColor="#f8fafc"
            textSize="16"
          />
        </group>
      ) : null}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
