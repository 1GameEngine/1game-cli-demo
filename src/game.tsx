import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Pipe = {
  id: number;
  x: number;
  gapY: number;
  scored: boolean;
};

type GameState = {
  phase: 'ready' | 'playing' | 'lost';
  score: number;
  bestScore: number;
  bird: { y: number; vy: number };
  pipes: Pipe[];
  nextPipeId: number;
  spawnTimer: number;
  rngSeed: number;
};

type Rect = { x: number; y: number; width: number; height: number };

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const BIRD_X = 88;
const BIRD_SIZE = 32;
const GROUND_HEIGHT = 72;
const PLAY_HEIGHT = SCENE_HEIGHT - GROUND_HEIGHT;
const PIPE_WIDTH = 64;
const PIPE_GAP = 148;
const PIPE_SPAWN_INTERVAL = 1.75;
const PIPE_SPEED = 128;
const GRAVITY = 920;
const FLAP_VELOCITY = -300;
const GAP_MARGIN = 72;

function nextRandom(seed: number): { value: number; seed: number } {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return { value: next / 0xffffffff, seed: next };
}

function makeInitialState(bestScore = 0): GameState {
  return {
    phase: 'ready',
    score: 0,
    bestScore,
    bird: { y: PLAY_HEIGHT * 0.42, vy: 0 },
    pipes: [],
    nextPipeId: 1,
    spawnTimer: PIPE_SPAWN_INTERVAL * 0.55,
    rngSeed: 0xf1a991,
  };
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function birdRect(y: number): Rect {
  return { x: BIRD_X, y, width: BIRD_SIZE, height: BIRD_SIZE };
}

function pipeRects(pipe: Pipe): [Rect, Rect] {
  const gapTop = pipe.gapY - PIPE_GAP / 2;
  const gapBottom = pipe.gapY + PIPE_GAP / 2;
  return [
    { x: pipe.x, y: 0, width: PIPE_WIDTH, height: gapTop },
    { x: pipe.x, y: gapBottom, width: PIPE_WIDTH, height: PLAY_HEIGHT - gapBottom },
  ];
}

function spawnPipe(draft: GameState): void {
  const random = nextRandom(draft.rngSeed);
  draft.rngSeed = random.seed;
  const minY = GAP_MARGIN + PIPE_GAP / 2;
  const maxY = PLAY_HEIGHT - GAP_MARGIN - PIPE_GAP / 2;
  const gapY = minY + random.value * (maxY - minY);

  draft.pipes.push({
    id: draft.nextPipeId,
    x: SCENE_WIDTH + 8,
    gapY,
    scored: false,
  });
  draft.nextPipeId += 1;
}

function flap(draft: GameState): void {
  if (draft.phase === 'ready') {
    draft.phase = 'playing';
    draft.bird.vy = FLAP_VELOCITY;
    if (draft.pipes.length === 0) spawnPipe(draft);
    return;
  }
  if (draft.phase === 'playing') {
    draft.bird.vy = FLAP_VELOCITY;
  }
}

function restart(draft: GameState): void {
  const best = Math.max(draft.bestScore, draft.score);
  Object.assign(draft, makeInitialState(best));
}

function tickGame(draft: GameState, deltaSeconds: number): void {
  if (draft.phase !== 'playing') return;

  draft.spawnTimer += deltaSeconds;
  while (draft.spawnTimer >= PIPE_SPAWN_INTERVAL) {
    draft.spawnTimer -= PIPE_SPAWN_INTERVAL;
    spawnPipe(draft);
  }

  draft.bird.vy += GRAVITY * deltaSeconds;
  draft.bird.y += draft.bird.vy * deltaSeconds;

  const bird = birdRect(draft.bird.y);

  if (draft.bird.y < 0 || draft.bird.y + BIRD_SIZE > PLAY_HEIGHT) {
    draft.phase = 'lost';
    draft.bestScore = Math.max(draft.bestScore, draft.score);
    return;
  }

  for (const pipe of draft.pipes) {
    pipe.x -= PIPE_SPEED * deltaSeconds;

    const [top, bottom] = pipeRects(pipe);
    if (intersects(bird, top) || intersects(bird, bottom)) {
      draft.phase = 'lost';
      draft.bestScore = Math.max(draft.bestScore, draft.score);
      return;
    }

    if (!pipe.scored && pipe.x + PIPE_WIDTH < BIRD_X) {
      pipe.scored = true;
      draft.score += 1;
    }
  }

  draft.pipes = draft.pipes.filter((pipe) => pipe.x + PIPE_WIDTH > -24);
}

const { store, commitChange, storeHistory } = createGameStore(makeInitialState(), { enableHistory: true });

function handleFlap(): void {
  commitChange('flap', (draft: GameState) => flap(draft));
}

function handleRestart(): void {
  commitChange('restart', (draft: GameState) => restart(draft));
}

function phaseHint(phase: GameState['phase']): string {
  if (phase === 'ready') return '点击或按空格开始';
  if (phase === 'lost') return '游戏结束 · 点击重玩';
  return '';
}

function Game() {
  useFrame((frame) => {
    const deltaSeconds = Math.min(frame.deltaSeconds, 0.05);
    commitChange('tick', (draft: GameState) => tickGame(draft, deltaSeconds));
  });

  return (
    <scene
      name="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#70c5ce"
      clickable
      onClick={() => {
        if (store.phase === 'lost') handleRestart();
        else handleFlap();
      }}
      onKeyDown={(event) => {
        if (event.detail?.code === 'Space') {
          if (store.phase === 'lost') handleRestart();
          else handleFlap();
        }
      }}
    >
      <node x={0} y={PLAY_HEIGHT} width={SCENE_WIDTH} height={GROUND_HEIGHT} backgroundColor="#ded895" />
      <node x={0} y={PLAY_HEIGHT - 6} width={SCENE_WIDTH} height={6} backgroundColor="#8b9a46" />

      {store.pipes.map((pipe) => {
        const gapTop = pipe.gapY - PIPE_GAP / 2;
        const gapBottom = pipe.gapY + PIPE_GAP / 2;
        return (
          <group>
            <node x={pipe.x} y={0} width={PIPE_WIDTH} height={gapTop} backgroundColor="#73bf2e" borderWidth={3} borderColor="#558c22" />
            <node
              x={pipe.x - 4}
              y={gapTop - 18}
              width={PIPE_WIDTH + 8}
              height={18}
              shape="roundedRect(4 4 4 4)"
              backgroundColor="#73bf2e"
              borderWidth={3}
              borderColor="#558c22"
            />
            <node
              x={pipe.x}
              y={gapBottom}
              width={PIPE_WIDTH}
              height={PLAY_HEIGHT - gapBottom}
              backgroundColor="#73bf2e"
              borderWidth={3}
              borderColor="#558c22"
            />
            <node
              x={pipe.x - 4}
              y={gapBottom}
              width={PIPE_WIDTH + 8}
              height={18}
              shape="roundedRect(4 4 4 4)"
              backgroundColor="#73bf2e"
              borderWidth={3}
              borderColor="#558c22"
            />
          </group>
        );
      })}

      <group x={BIRD_X} y={store.bird.y} width={BIRD_SIZE} height={BIRD_SIZE}>
        <node x={0} y={0} width={BIRD_SIZE} height={BIRD_SIZE} shape="circular" backgroundColor="#f7d308" borderWidth={2} borderColor="#c9a400" />
        <node x={20} y={10} width={8} height={8} shape="circular" backgroundColor="#ffffff" />
        <node x={22} y={11} width={4} height={4} shape="circular" backgroundColor="#1f2937" />
        <node x={26} y={16} width={10} height={7} shape="roundedRect(2 2 2 2)" backgroundColor="#ef6c00" />
      </group>

      <text
        x={0}
        y={48}
        width={SCENE_WIDTH}
        height={56}
        text={`${store.score}`}
        textAlign="center"
        textSize="48"
        textColor="#ffffff"
        zIndex={10}
      />

      {store.phase !== 'playing' && (
        <group x={48} y={220} width={264} height={180} zIndex={20}>
          <node x={0} y={0} width={264} height={180} shape="roundedRect(16 16 16 16)" backgroundColor="#00000055" />
          <text
            x={0}
            y={28}
            width={264}
            height={40}
            text={store.phase === 'ready' ? 'Flappy Bird' : '撞到了!'}
            textAlign="center"
            textSize="28"
            textColor="#ffffff"
          />
          <text
            x={0}
            y={88}
            width={264}
            height={28}
            text={phaseHint(store.phase)}
            textAlign="center"
            textSize="18"
            textColor="#f8fafc"
          />
          {store.bestScore > 0 && (
            <text
              x={0}
              y={128}
              width={264}
              height={24}
              text={`最高分 ${store.bestScore}`}
              textAlign="center"
              textSize="16"
              textColor="#fde68a"
            />
          )}
        </group>
      )}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
