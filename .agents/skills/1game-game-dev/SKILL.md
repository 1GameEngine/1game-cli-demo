---
name: 1game-game-dev
description: Develop, debug, build, and replay 1Game browser games with the public @1game packages. Use when creating a new game project, implementing gameplay with @1game/engine-bundle, using the 1game CLI, or debugging deterministic gameplay with 1gameplay.
license: MIT
compatibility: Node.js 20+, pnpm 9+, browser runtime with Web Worker support.
---

# 1Game Game Development

Use this skill to build a new 1Game browser game from the public packages only:

- `@1game/engine-bundle` for runtime APIs and JSX tags.
- `@1game/cli` for project initialization and browser builds.
- `@1game/cli-1gameplay` for headless gameplay recording, stepping, query, diff, simulation, and replay HTML.
- Optional public add-ons such as `@1game/solid-particles-proton`.

Do not rely on private monorepo packages or repository-only paths. A generated game project should work as an independent npm project after installing public packages.

## Default workflow for agents

1. Clarify the game loop: objective, player actions, win/lose states, scenes, assets, and target aspect ratio.
2. Create or inspect the game project with `1game init <name>`. New projects include `.gitignore` entries for `out/`, `*.1gamerecord`, and common artifacts so builds and gameplay archives are not committed by accident.
3. Implement gameplay in `src/game.tsx` using deterministic store updates.
4. Build frequently with `pnpm build` or `pnpm exec 1game build --singleHtml`.
5. Debug logic with `1gameplay` by creating an archive, stepping frames, injecting events, querying store/render state, and diffing frames.
6. Use browser/manual testing for player feel and visual layout; use `1gameplay` for repeatable agent-friendly checks.

## Start a new game

```bash
pnpm dlx @1game/cli init my-game
cd my-game
pnpm install
pnpm build
```

The generated project contains:

- `src/game.tsx`: worker-side game entry.
- `1game.config.json`: build config with `entry` and `outDir` (default `out/`).
- `.gitignore`: ignores `out/`, `*.1gamerecord`, `dist/`, `node_modules/`, and common junk files.
- `package.json`: scripts and dependencies.

The default `1game init` template sets the game store options to `{ enableHistory: true }`, matching the single-store `1gameplay` examples below. If editing an older project, make sure its store uses the same options before running those examples.

If editing an existing project, make sure it has these dependencies:

```bash
pnpm add @1game/engine-bundle solid-js
pnpm add -D @1game/cli @1game/cli-1gameplay typescript
```

Recommended scripts:

```json
{
  "scripts": {
    "build": "1game build",
    "build:single": "1game build --singleHtml",
    "buildjs": "1game buildjs",
    "gameplay:create": "1gameplay create --entry src/game.tsx --out out/debug.1gamerecord",
    "gameplay:list": "1gameplay frames list out/debug.1gamerecord",
    "gameplay:replay": "1gameplay bundle-player-html out/debug.1gamerecord --out out/replay.html"
  }
}
```

## Runtime entrypoints

Inside `src/game.tsx`, import worker-side APIs from the public runtime:

```tsx
import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';
```

Use only public package imports in generated projects. Do not import private package names or repository-local paths.

Use `@1game/engine-bundle/runtime/main` only when you manually host a worker. Most games should let `1game build` generate the main-thread bootstrap.

## Minimal deterministic game shape

```tsx
import { createGameStore, renderGame, useFrame } from '@1game/engine-bundle/runtime/worker';

type GameState = {
  phase: 'playing' | 'won' | 'lost';
  score: number;
  player: { x: number; y: number; vx: number };
};

const { store, commitChange, storeHistory } = createGameStore(
  {
    phase: 'playing',
    score: 0,
    player: { x: 40, y: 120, vx: 0 },
  } satisfies GameState,
  { enableHistory: true },
);

function Game() {
  useFrame((frame) => {
    const dt = Math.min(frame.deltaSeconds, 0.05);
    commitChange('tick', (draft: GameState) => {
      draft.player.x += draft.player.vx * dt;
      draft.player.x = Math.max(0, Math.min(288, draft.player.x));
    });
  });

  return (
    <scene id="main" width={320} height={180} backgroundColor="#101827">
      <text x={8} y={8} width={160} height={22} text={`Score: ${store.score}`} textColor="#fff" textSize="18" />
      <node x={store.player.x} y={store.player.y} width={24} height={24} shape="roundedRect(6 6 6 6)" backgroundColor="#60a5fa" />
      <group
        x={240}
        y={132}
        width={64}
        height={32}
        clickable
        onClick={() => {
          commitChange('boost', (draft: GameState) => {
            draft.player.vx = 90;
            draft.score += 1;
          });
        }}
      >
        <node x={0} y={0} width={64} height={32} shape="roundedRect(8 8 8 8)" backgroundColor="#2563eb" />
        <text x={0} y={7} width={64} height={18} text="Boost" textAlign="center" textColor="#fff" textSize="16" />
      </group>
    </scene>
  );
}

renderGame(() => <Game />, { bindStore: storeHistory });
```

Key rules:

- Put gameplay state in `createGameStore`, not in local `createSignal`, when the state affects simulation, replay, win/lose logic, or debugging.
- Update state through `commitChange(label, draft => ...)`; labels become useful when inspecting history.
- Enable history for games that will be tested with `1gameplay`.
- Pass `storeHistory` to `renderGame(..., { bindStore: storeHistory })`.

## JSX scene model

Common tags:

- `<scene>`: root scene; give it a stable `id`, `width`, `height`, and optional `backgroundColor`.
- `<group>`: container; supports transforms, nesting, and event handlers.
- `<node>`: basic colored or shaped rectangle/circle/polygon.
- `<text>`: text rendering.
- `<image>`: image resource rendering.
- `<line>`: lines from `from` to `to`.
- `<draw>`: custom draw data or add-on rendering, such as particles.
- `<audio>`: state-driven background or looped audio.

Useful shared attributes:

- Layout: `x`, `y`, `width`, `height`, `zIndex`, `hidden`, `alpha`.
- Appearance: `backgroundColor`, `foregroundColor`, `shape`, `border`, `borderWidth`, `borderColor`.
- Shape strings: `rect`, `circular`, `triangle`, `polygon(x,y ...)`, `roundedRect(tl tr br bl)`.
- Text: `text`, `textSize`, `textColor`, `textAlign`, `textVerticalAlign`, `fontWeight`, `italic`, `autoWrap`.
- Image: `imageId`, `imageFit`, `imageCutArea`, `imageFitAlignX`, `imageFitAlignY`.

## Input handling

Pointer interaction requires either `clickable` or event handlers on the node or its ancestors.

Supported pointer and gesture handlers include:

- `onClick`, `onClickCapture`
- `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerUpOutside`, `onPointerCancel`
- `onPointerEnter`, `onPointerLeave`, `onHover`
- `onDragStart`, `onDrag`, `onDragEnd`

Scene-level keyboard handlers include `onKeyDown`, `onKeyUp`, and capture variants.

Event handlers receive an event with scene coordinates (`x`, `y`), `target`, `currentTarget`, optional `detail`, and propagation methods.

Keep event handlers small. Convert input into state changes with `commitChange`; let render output derive from store state.

## Build and run

`1game build` outputs a browser-ready app into the configured `outDir` (default `out/` after `1game init`):

```bash
pnpm exec 1game build
```

Outputs:

- `out/index.html`
- `out/game.worker.js`
- `out/worker-bootstrap.js`

Use a static server to view it:

```bash
pnpm exec 1game build
python3 -m http.server 4173 -d out
```

For a portable single file:

```bash
pnpm exec 1game build --singleHtml
```

For gameplay tooling, build only the worker bundle:

```bash
pnpm exec 1game buildjs --entry src/game.tsx --outDir out
```

## Debug with 1gameplay

Use `1gameplay` when an agent needs repeatable evidence that gameplay logic works without using a browser.

Create an archive:

```bash
pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord --checkpoint-every 120
```

Step the simulation:

```bash
pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --repeat 60
```

Inject a click or hover event:

```bash
pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --event '{"type":"click","sceneId":"main","data":{"id":1,"x":272,"y":148,"time":1000,"domClientX":272,"domClientY":148}}'
```

Inspect frames:

```bash
pnpm exec 1gameplay frames list out/debug.1gamerecord
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select runtime --select store:state --select render:scene=main --payload summary
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select 'hit:point=100,80:scene=main' --payload full
pnpm exec 1gameplay frame diff out/debug.1gamerecord --from 0 --to last --select store:dump --payload full
```

Scene-space hit test at a point (`hit:point=<x>,<y>:scene=<id>[:mode=clickable|any]`) asks the worker which node would be hit there. Default `mode` is `clickable`; append `:mode=any` for pure geometry. Use this when click events seem to miss targets or hit the wrong layer.

Inspect hit geometry and clickability for a specific node (same replay as `render`; uses worker debug RPC, not the main render protocol):

```bash
# Defaults: shape=polygon (geometry omitted unless include has polygon/aabb), space=scene, include=meta,path
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select 'hit:scene=main:node=<virtualNodeId>'

# Bounding box in scene space; still lightweight if you omit polygon points
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select 'hit:scene=main:node=<virtualNodeId>:shape=aabb:include=meta,path,aabb'

# First non-scene node under the scene when you do not have an id (debug / scripts)
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select 'hit:scene=main:node=*:shape=aabb:include=meta,path,aabb'
```

Notes:

- Node ids are the **VirtualNode** ids (same as in `render:scene=...` dump). Each headless `frame query` run boots a fresh worker, so ids are not stable across separate CLI invocations—either query `render` and `hit` in **one** `frame query` with multiple `--select` flags, or use `node=*` for smoke checks.
- `clickable` / `touchInterceptMode` are **DSL-only**; inferring “can click” from serialized render data alone can be wrong—use `hit:scene=…:node=…` for the effective flags on a known node.

Simulate without writing:

```bash
pnpm exec 1gameplay frame simulate out/debug.1gamerecord --from last --ms 16 --select store:state
```

Export a replay:

```bash
pnpm exec 1gameplay bundle-player-html out/debug.1gamerecord --out out/replay.html
```

Interpret errors:

- Frame commands write JSON envelopes to stdout.
- Non-frame commands default to one `AGENT_ERROR` line on stderr.
- Non-frame commands also support global `--json`; on failure they emit stdout JSON (`schema: 1gameplay.error`) for machine parsing.
- Prefer `--json` in agent scripts that must parse failures reliably.
- Common exit codes: `2` for invalid args or out-of-range frame, `3` for missing object, `4` for archive or bundle compatibility, `5` for runtime error.

Key argument constraints:

- `1gameplay create --checkpoint-every` must be a positive integer (`>= 1`).
- `1gameplay frames list --from/--to` must be non-negative integers and satisfy `from <= to`.

## Agent debugging checklist

When gameplay looks wrong:

1. Reproduce with `1gameplay create` and deterministic `step`.
2. Query `store:state`; confirm the state changed as expected.
3. Query `render:scene=main`; confirm JSX output reflects store state.
   3b. For pointer/hit issues, query `hit:point=<x>,<y>:scene=main` at the scene coordinates you care about; compare `nodeId` and `chain` to the node you expect.
4. Inject the smallest event that should trigger the bug.
5. Use `frame diff` to compare before/after store dumps.
6. If state is correct but visuals are wrong, inspect layout, `zIndex`, `hidden`, `alpha`, dimensions, and shape/image attributes.
7. If visuals are correct in archive but wrong in browser, test generated `out/index.html` with a static server and inspect browser console.

## Design guidance for generated games

- Choose one authoritative store for game logic.
- Keep simulation deterministic: avoid `Math.random()` inside `useFrame` unless it is seeded and stored.
- Clamp large `deltaSeconds` values to avoid physics jumps after tab suspension.
- Use stable `scene` IDs so replay commands remain reliable.
- Avoid mutating external objects from render code; update only the game store in `commitChange`.
- Store durable gameplay facts, not derived text or temporary hover colors unless they affect logic.
- Derive UI from state directly in JSX.
- Prefer small helper functions for collision, spawn, scoring, and AI decisions.
- Use manual browser testing for feel, animation, audio, and final layout.
- Use `1gameplay` for logic assertions, regression checks, and sharing reproducible bug archives.

## Optional add-ons

For particle effects:

```bash
pnpm add @1game/solid-particles-proton proton-engine
```

Use it when visual effects are needed, but keep gameplay-affecting particle state in the main game store if it must be replayed or tested.

## Additional references

Load these files only when needed:

- `references/public-api.md`: public package API and command summary.
- `references/debugging-playbook.md`: repeatable gameplay debugging recipes.
- `references/game-patterns.md`: implementation patterns for movement, collision, state, input, audio, and assets.
- `assets/new-game-template.tsx`: starting template for a small deterministic game.
