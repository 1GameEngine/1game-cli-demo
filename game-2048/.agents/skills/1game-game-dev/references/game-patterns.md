# 1Game game implementation patterns

Use these patterns when generating or editing a public-package 1Game project.

## State shape

Start with explicit phases and small nested objects:

- `phase`: `menu`, `playing`, `paused`, `won`, or `lost`.
- `player`: position, velocity, health, cooldowns.
- `enemies`: array of stable IDs and gameplay data.
- `items` or `projectiles`: arrays with stable IDs.
- `input`: currently held direction or last action.

Avoid storing derived labels such as `scoreText`. Render them from `store.score`.

## Update loop

Use `useFrame` for simulation:

```tsx
useFrame((frame) => {
  const dt = Math.min(frame.deltaSeconds, 0.05);
  commitChange('tick', (draft: GameState) => {
    if (draft.phase !== 'playing') return;
    updatePlayer(draft, dt);
    updateEnemies(draft, dt);
    resolveCollisions(draft);
  });
});
```

Rules:

- Clamp `dt` so tab suspension does not skip through collisions.
- Keep helper functions pure over the draft.
- Prefer simple AABB or circle collision for generated games.
- Record meaningful commit labels such as `tick`, `spawn enemy`, `collect coin`, or `player hit`.

## Restart / reset state

Always reset from inside `commitChange` by mutating draft:

```tsx
function makeInitialState(): GameState {
  return {
    phase: 'ready',
    score: 0,
    player: { x: 120, y: 90, hp: 3 },
  };
}

function restartGame() {
  commitChange('restart', (draft: GameState) => {
    Object.assign(draft, makeInitialState());
  });
}
```

Hard rule:

- ✅ mutate `draft` in-place (`Object.assign`, per-field writes, array replacement on draft fields).
- ❌ do not `return makeInitialState()` from a `commitChange` mutator.

## Input

For virtual buttons:

```tsx
<group
  x={232}
  y={128}
  width={72}
  height={36}
  clickable
  onClick={() => {
    commitChange('jump', (draft: GameState) => {
      if (draft.player.grounded) draft.player.vy = -220;
    });
  }}
>
  <node x={0} y={0} width={72} height={36} shape="roundedRect(8 8 8 8)" backgroundColor="#2563eb" />
  <text x={0} y={8} width={72} height={18} text="Jump" textAlign="center" textColor="#fff" textSize="16" />
</group>
```

For scene keyboard:

```tsx
<scene
  id="main"
  width={320}
  height={180}
  onKeyDown={(e) => {
    commitChange('key down', (draft: GameState) => {
      if (e.detail?.code === 'ArrowLeft') draft.input.left = true;
      if (e.detail?.code === 'ArrowRight') draft.input.right = true;
    });
  }}
  onKeyUp={(e) => {
    commitChange('key up', (draft: GameState) => {
      if (e.detail?.code === 'ArrowLeft') draft.input.left = false;
      if (e.detail?.code === 'ArrowRight') draft.input.right = false;
    });
  }}
>
```

Browser focus note:

- Scene keyboard handlers require canvas/scene focus in browser runtime.
- Recommended UX for keyboard-heavy games: start in `ready` phase and show a visible click/tap-to-start action before expecting key input.

## Collision helpers

Use helper functions outside the component:

```ts
type Rect = { x: number; y: number; width: number; height: number };

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
```

Keep collision results in the store if they affect gameplay.

## Assets and images

Use `<image imageId="..." />` when images are needed. Let the build pipeline bundle imported assets when possible, or keep resource IDs stable and load them through the runtime resource system when manually hosting.

For simple generated games, prefer shapes and text first. They build faster, debug better, and do not require asset loading.

## Audio

For one-shot sound effects:

```tsx
import { onMount } from 'solid-js';
import { useAudio } from '@1game/engine-bundle/runtime/worker';

function Game() {
  const { loadAudio, playOnce } = useAudio();

  onMount(() => {
    void loadAudio('hit.mp3');
  });

  return <node clickable onClick={() => playOnce('hit.mp3', { volume: 0.8 })} x={0} y={0} width={40} height={40} />;
}
```

For state-driven music:

```tsx
<audio src="bgm.mp3" playing={store.phase === 'playing'} loop volume={0.5} />
```

Use browser/manual testing for audio. `1gameplay` is best for deterministic logic and render data, not subjective audio timing.

## Layout and camera

- Pick a fixed logical resolution such as `320x180`, `360x640`, or `640x360`.
- Use `scene` dimensions as the game coordinate system.
- Keep player and enemy positions in world coordinates.
- For camera movement, store `camera.x` and `camera.y`, then offset groups or scene viewport consistently.
- Use `zIndex` deliberately for HUD, projectiles, player, enemies, and background.
- Keep interactive UI inside the scene bounds (`x + width <= scene.width` and `y + height <= scene.height`) so controls do not overlap or fall outside gameplay areas.

## Generated game checklist

- The game can be built by `pnpm exec 1game build`.
- `src/game.tsx` imports from `@1game/engine-bundle/runtime/worker`.
- Store uses `enableHistory: true`.
- `renderGame` receives `{ bindStore: storeHistory }`.
- Gameplay state changes only through `commitChange`.
- `1gameplay create`, `step`, and `frame query --select store:state` work.
- Player actions are testable via injected events or clear browser interactions.
