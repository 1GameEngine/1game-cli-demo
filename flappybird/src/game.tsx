import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type Pipe = {
  id: number;
  x: number;
  gapY: number;
  passed: boolean;
};

type GameState = {
  phase: 'ready' | 'playing' | 'lost';
  score: number;
  bestScore: number;
  readyTimeMs: number;
  bird: {
    x: number;
    y: number;
    vy: number;
  };
  pipes: Pipe[];
  spawnTimerMs: number;
  pipeIdCounter: number;
  rngSeed: number;
};

const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 640;
const GROUND_HEIGHT = 56;
const PLAY_HEIGHT = SCENE_HEIGHT - GROUND_HEIGHT;
const BIRD_X = 90;
const BIRD_SIZE = 32;
const GRAVITY = 760;
const FLAP_VY = -270;
const PIPE_WIDTH = 58;
const PIPE_GAP = 148;
const PIPE_SPEED = 115;
const PIPE_SPAWN_MS = 1750;
const MIN_GAP_Y = 72;
const MAX_GAP_Y = PLAY_HEIGHT - PIPE_GAP - 72;

type Rect = { x: number; y: number; width: number; height: number };

function nextRng(seed: number): [number, number] {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return [next, next / 0x100000000];
}

function createInitialState(): GameState {
  return {
    phase: 'ready',
    score: 0,
    bestScore: 0,
    readyTimeMs: 0,
    bird: { x: BIRD_X, y: PLAY_HEIGHT * 0.42, vy: 0 },
    pipes: [],
    spawnTimerMs: 0,
    pipeIdCounter: 0,
    rngSeed: 42,
  };
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function spawnPipe(draft: GameState): void {
  let rand: number;
  [draft.rngSeed, rand] = nextRng(draft.rngSeed);
  const gapY = MIN_GAP_Y + Math.floor(rand * (MAX_GAP_Y - MIN_GAP_Y));
  draft.pipeIdCounter += 1;
  draft.pipes.push({
    id: draft.pipeIdCounter,
    x: SCENE_WIDTH + 8,
    gapY,
    passed: false,
  });
}

function resetToPlaying(draft: GameState, keepBest: boolean): void {
  const best = keepBest ? draft.bestScore : 0;
  const fresh = createInitialState();
  draft.phase = 'playing';
  draft.score = fresh.score;
  draft.bestScore = best;
  draft.readyTimeMs = fresh.readyTimeMs;
  draft.bird = { ...fresh.bird, vy: FLAP_VY };
  draft.pipes = fresh.pipes;
  draft.spawnTimerMs = fresh.spawnTimerMs;
  draft.pipeIdCounter = fresh.pipeIdCounter;
  draft.rngSeed = fresh.rngSeed;
}

function flap(draft: GameState): void {
  if (draft.phase === 'ready') {
    resetToPlaying(draft, true);
    return;
  }
  if (draft.phase === 'lost') {
    resetToPlaying(draft, true);
    return;
  }
  draft.bird.vy = FLAP_VY;
}

function birdHitbox(birdY: number): Rect {
  const inset = 5;
  return {
    x: BIRD_X - BIRD_SIZE / 2 + inset,
    y: birdY - BIRD_SIZE / 2 + inset,
    width: BIRD_SIZE - inset * 2,
    height: BIRD_SIZE - inset * 2,
  };
}

function checkCollisions(draft: GameState): void {
  const bird = birdHitbox(draft.bird.y);

  if (bird.y < 0 || bird.y + bird.height > PLAY_HEIGHT) {
    draft.phase = 'lost';
    draft.bestScore = Math.max(draft.bestScore, draft.score);
    return;
  }

  for (const pipe of draft.pipes) {
    const topPipe: Rect = { x: pipe.x, y: 0, width: PIPE_WIDTH, height: pipe.gapY };
    const bottomPipe: Rect = {
      x: pipe.x,
      y: pipe.gapY + PIPE_GAP,
      width: PIPE_WIDTH,
      height: PLAY_HEIGHT - (pipe.gapY + PIPE_GAP),
    };
    if (intersects(bird, topPipe) || intersects(bird, bottomPipe)) {
      draft.phase = 'lost';
      draft.bestScore = Math.max(draft.bestScore, draft.score);
      return;
    }
  }
}

function tickGame(draft: GameState, deltaSeconds: number): void {
  if (draft.phase === 'ready') {
    draft.readyTimeMs += deltaSeconds * 1000;
    draft.bird.y = PLAY_HEIGHT * 0.42 + Math.sin(draft.readyTimeMs / 280) * 10;
    return;
  }

  if (draft.phase !== 'playing') return;

  draft.bird.vy += GRAVITY * deltaSeconds;
  draft.bird.y += draft.bird.vy * deltaSeconds;

  draft.spawnTimerMs += deltaSeconds * 1000;
  if (draft.spawnTimerMs >= PIPE_SPAWN_MS) {
    draft.spawnTimerMs -= PIPE_SPAWN_MS;
    spawnPipe(draft);
  }

  for (const pipe of draft.pipes) {
    pipe.x -= PIPE_SPEED * deltaSeconds;
    if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
      pipe.passed = true;
      draft.score += 1;
    }
  }

  draft.pipes = draft.pipes.filter((pipe) => pipe.x + PIPE_WIDTH > -PIPE_WIDTH);
  checkCollisions(draft);
}

const { store, commitChange, storeHistory } = createGameStore(createInitialState(), { enableHistory: true });

function handleFlap(): void {
  commitChange('flap', (draft: GameState) => flap(draft));
}

function handleKeyDown(code: string | undefined): void {
  if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
    handleFlap();
  }
}

function PipeColumn(props: { x: number; gapY: number }): unknown {
  const capHeight = 24;
  const pipeColor = '#73bf2e';
  const capColor = '#5a9a24';

  return (
    <>
      <node x={props.x - 4} y={props.gapY - capHeight} width={PIPE_WIDTH + 8} height={capHeight} shape="rect" backgroundColor={capColor} />
      <node x={props.x} y={0} width={PIPE_WIDTH} height={props.gapY} shape="rect" backgroundColor={pipeColor} borderWidth={2} borderColor="#4a8a1e" />
      <node
        x={props.x - 4}
        y={props.gapY + PIPE_GAP}
        width={PIPE_WIDTH + 8}
        height={capHeight}
        shape="rect"
        backgroundColor={capColor}
      />
      <node
        x={props.x}
        y={props.gapY + PIPE_GAP + capHeight}
        width={PIPE_WIDTH}
        height={PLAY_HEIGHT - (props.gapY + PIPE_GAP + capHeight)}
        shape="rect"
        backgroundColor={pipeColor}
        borderWidth={2}
        borderColor="#4a8a1e"
      />
    </>
  );
}

function Game(): unknown {
  useFrame((frame) => {
    const deltaSeconds = Math.min(frame.deltaSeconds, 0.05);
    commitChange('tick', (draft: GameState) => tickGame(draft, deltaSeconds));
  });

  const overlayText =
    store.phase === 'ready' ? '点击或按空格开始' : store.phase === 'lost' ? '游戏结束 · 再点一次重开' : '';

  return (
    <scene
      name="main"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      backgroundColor="#4ec0ca"
      clickable
      onClick={handleFlap}
      onKeyDown={(event) => handleKeyDown(event.detail?.code)}
    >
      <node x={0} y={0} width={SCENE_WIDTH} height={PLAY_HEIGHT} backgroundColor="#70c5ce" />

      {store.pipes.map((pipe) => (
        <PipeColumn x={pipe.x} gapY={pipe.gapY} />
      ))}

      <node x={0} y={PLAY_HEIGHT} width={SCENE_WIDTH} height={GROUND_HEIGHT} backgroundColor="#ded895" />
      <node x={0} y={PLAY_HEIGHT} width={SCENE_WIDTH} height={8} backgroundColor="#73bf2e" />

      <node
        x={BIRD_X - BIRD_SIZE / 2}
        y={store.bird.y - BIRD_SIZE / 2}
        width={BIRD_SIZE}
        height={BIRD_SIZE}
        shape="circular"
        backgroundColor="#f7d308"
        borderWidth={2}
        borderColor="#e5a800"
        zIndex={10}
      />
      <node
        x={BIRD_X + 6}
        y={store.bird.y - 4}
        width={10}
        height={10}
        shape="circular"
        backgroundColor="#ffffff"
        zIndex={11}
      />
      <node
        x={BIRD_X + 10}
        y={store.bird.y - 2}
        width={4}
        height={4}
        shape="circular"
        backgroundColor="#1f2937"
        zIndex={12}
      />

      <text
        x={0}
        y={48}
        width={SCENE_WIDTH}
        height={56}
        text={String(store.score)}
        textAlign="center"
        textColor="#ffffff"
        textSize="48"
        zIndex={20}
      />

      {store.bestScore > 0 ? (
        <text
          x={SCENE_WIDTH - 88}
          y={12}
          width={72}
          height={20}
          text={`最高 ${store.bestScore}`}
          textAlign="right"
          textColor="#ffffff"
          textSize="14"
          zIndex={20}
        />
      ) : null}

      {overlayText ? (
        <group x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} zIndex={30}>
          <node x={40} y={PLAY_HEIGHT * 0.55} width={280} height={72} shape="roundedRect(12 12 12 12)" backgroundColor="#00000080" />
          <text
            x={40}
            y={PLAY_HEIGHT * 0.55 + 22}
            width={280}
            height={28}
            text={overlayText}
            textAlign="center"
            textColor="#ffffff"
            textSize="18"
          />
        </group>
      ) : null}
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
