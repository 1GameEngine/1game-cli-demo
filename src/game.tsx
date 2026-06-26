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
  bird: { y: number; vy: number };
  pipes: Pipe[];
  rngSeed: number;
  pipeSpawnTimer: number;
  nextPipeId: number;
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const BIRD_X = 72;
const BIRD_SIZE = 28;
const GROUND_HEIGHT = 56;
const PLAY_HEIGHT = SCENE_HEIGHT - GROUND_HEIGHT;

const GRAVITY = 920;
const FLAP_VELOCITY = -300;
const PIPE_WIDTH = 52;
const PIPE_GAP = 148;
const PIPE_SPEED = 128;
const PIPE_SPAWN_INTERVAL = 1.65;
const PIPE_MARGIN = 72;

const { store, commitChange, storeHistory } = createGameStore(
  {
    phase: 'ready',
    score: 0,
    bird: { y: PLAY_HEIGHT * 0.42, vy: 0 },
    pipes: [],
    rngSeed: 42_001,
    pipeSpawnTimer: 0.9,
    nextPipeId: 1,
  } satisfies GameState,
  { enableHistory: true },
);

function nextRandom(seed: number): [number, number] {
  const next = (seed * 1_664_525 + 1_013_903_223) >>> 0;
  return [next, next / 0xffff_ffff];
}

function makeInitialState(): GameState {
  return {
    phase: 'ready',
    score: 0,
    bird: { y: PLAY_HEIGHT * 0.42, vy: 0 },
    pipes: [],
    rngSeed: 42_001,
    pipeSpawnTimer: 0.9,
    nextPipeId: 1,
  };
}

type Rect = { x: number; y: number; width: number; height: number };

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
  const [nextSeed, random] = nextRandom(draft.rngSeed);
  draft.rngSeed = nextSeed;
  const minGapY = PIPE_MARGIN + PIPE_GAP / 2;
  const maxGapY = PLAY_HEIGHT - PIPE_MARGIN - PIPE_GAP / 2;
  const gapY = minGapY + random * (maxGapY - minGapY);
  draft.pipes.push({
    id: `pipe-${draft.nextPipeId}`,
    x: SCENE_WIDTH + 8,
    gapY,
    scored: false,
  });
  draft.nextPipeId += 1;
}

function tickGame(draft: GameState, deltaSeconds: number): void {
  if (draft.phase === 'ready') {
    draft.bird.vy = Math.sin(draft.pipeSpawnTimer * 4) * 28;
    draft.bird.y += draft.bird.vy * deltaSeconds;
    draft.bird.y = Math.max(BIRD_SIZE, Math.min(PLAY_HEIGHT - BIRD_SIZE, draft.bird.y));
    draft.pipeSpawnTimer += deltaSeconds;
    return;
  }

  if (draft.phase !== 'playing') return;

  draft.bird.vy += GRAVITY * deltaSeconds;
  draft.bird.y += draft.bird.vy * deltaSeconds;

  draft.pipeSpawnTimer += deltaSeconds;
  if (draft.pipeSpawnTimer >= PIPE_SPAWN_INTERVAL) {
    draft.pipeSpawnTimer -= PIPE_SPAWN_INTERVAL;
    spawnPipe(draft);
  }

  for (const pipe of draft.pipes) {
    pipe.x -= PIPE_SPEED * deltaSeconds;
  }
  draft.pipes = draft.pipes.filter((pipe) => pipe.x + PIPE_WIDTH > -16);

  const bird = birdRect(draft.bird.y);
  if (draft.bird.y <= 0 || draft.bird.y + BIRD_SIZE >= PLAY_HEIGHT) {
    draft.phase = 'lost';
    return;
  }

  for (const pipe of draft.pipes) {
    const [top, bottom] = pipeRects(pipe);
    if (intersects(bird, top) || intersects(bird, bottom)) {
      draft.phase = 'lost';
      return;
    }
    if (!pipe.scored && pipe.x + PIPE_WIDTH < BIRD_X) {
      pipe.scored = true;
      draft.score += 1;
    }
  }
}

function flap(): void {
  commitChange('拍翅', (draft: GameState) => {
    if (draft.phase === 'ready') {
      draft.phase = 'playing';
      draft.bird.vy = FLAP_VELOCITY;
      draft.pipeSpawnTimer = PIPE_SPAWN_INTERVAL * 0.55;
      if (draft.pipes.length === 0) spawnPipe(draft);
      return;
    }
    if (draft.phase === 'playing') {
      draft.bird.vy = FLAP_VELOCITY;
      return;
    }
    if (draft.phase === 'lost') {
      Object.assign(draft, makeInitialState());
    }
  });
}

function phaseHint(phase: GameState['phase']): string {
  if (phase === 'ready') return '点击或按空格开始';
  if (phase === 'lost') return '游戏结束，点击重开';
  return '';
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
      backgroundColor="#70c5ce"
      onKeyDown={(event) => {
        if (event.detail?.code === 'Space' || event.detail?.code === 'ArrowUp') flap();
      }}
    >
      <node x={0} y={PLAY_HEIGHT * 0.55} width={SCENE_WIDTH} height={PLAY_HEIGHT * 0.45} backgroundColor="#ded895" alpha={0.35} />

      {store.pipes.map((pipe) => {
        const gapTop = pipe.gapY - PIPE_GAP / 2;
        const gapBottom = pipe.gapY + PIPE_GAP / 2;
        return (
          <group key={pipe.id}>
            <node
              x={pipe.x}
              y={0}
              width={PIPE_WIDTH}
              height={gapTop}
              shape="roundedRect(4 4 0 0)"
              backgroundColor="#73bf2e"
              borderWidth={3}
              borderColor="#558c22"
            />
            <node
              x={pipe.x - 4}
              y={gapTop - 24}
              width={PIPE_WIDTH + 8}
              height={24}
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
              shape="roundedRect(0 0 4 4)"
              backgroundColor="#73bf2e"
              borderWidth={3}
              borderColor="#558c22"
            />
            <node
              x={pipe.x - 4}
              y={gapBottom}
              width={PIPE_WIDTH + 8}
              height={24}
              shape="roundedRect(4 4 4 4)"
              backgroundColor="#73bf2e"
              borderWidth={3}
              borderColor="#558c22"
            />
          </group>
        );
      })}

      <node x={0} y={PLAY_HEIGHT} width={SCENE_WIDTH} height={GROUND_HEIGHT} backgroundColor="#ded895" />
      <node x={0} y={PLAY_HEIGHT} width={SCENE_WIDTH} height={6} backgroundColor="#c4b56a" />

      <node
        x={BIRD_X}
        y={store.bird.y}
        width={BIRD_SIZE}
        height={BIRD_SIZE}
        shape="circular"
        backgroundColor="#f7d308"
        borderWidth={2}
        borderColor="#e8a800"
        zIndex={10}
      />
      <node
        x={BIRD_X + 18}
        y={store.bird.y + 10}
        width={8}
        height={8}
        shape="circular"
        backgroundColor="#1f2937"
        zIndex={11}
      />
      <node
        x={BIRD_X + 22}
        y={store.bird.y + 14}
        width={10}
        height={6}
        shape="roundedRect(2 2 2 2)"
        backgroundColor="#f97316"
        zIndex={11}
      />

      <text
        x={0}
        y={36}
        width={SCENE_WIDTH}
        height={48}
        text={`${store.score}`}
        textAlign="center"
        textSize="42"
        textColor="#ffffff"
        zIndex={20}
      />

      {store.phase !== 'playing' ? (
        <group zIndex={30}>
          <node x={48} y={220} width={264} height={120} shape="roundedRect(12 12 12 12)" backgroundColor="#0f172a" alpha={0.55} />
          <text
            x={48}
            y={248}
            width={264}
            height={32}
            text={store.phase === 'ready' ? 'Flappy Bird' : '撞车了!'}
            textAlign="center"
            textSize="24"
            textColor="#ffffff"
          />
          <text
            x={48}
            y={286}
            width={264}
            height={28}
            text={phaseHint(store.phase)}
            textAlign="center"
            textSize="16"
            textColor="#e2e8f0"
          />
          {store.phase === 'lost' ? (
            <text
              x={48}
              y={312}
              width={264}
              height={24}
              text={`得分：${store.score}`}
              textAlign="center"
              textSize="18"
              textColor="#facc15"
            />
          ) : null}
        </group>
      ) : null}

      <group x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} clickable onClick={flap} zIndex={40}>
        <node x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} alpha={0} />
      </group>
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
