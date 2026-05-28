# Public 1Game API and command reference

This reference is for independent game projects that depend only on public npm packages.

## Packages

### `@1game/engine-bundle`

Use this package for game runtime APIs and public type exports.

Worker-side game code should import from:

```tsx
import { createGameStore, renderGame, useFrame, useAudio } from '@1game/engine-bundle/runtime/worker';
```

Main-thread custom hosts can import from:

```ts
import { createWorkerEngine } from '@1game/engine-bundle/runtime/main';
```

Most projects do not need a custom main-thread host because `1game build` generates it.

### `@1game/cli`

Installs the `1game` command.

Commands:

- `1game init [project-name]`: create a new game project (includes `.gitignore` for `out/`, `*.1gamerecord`, `dist/`, and common artifacts).
- `1game build [--entry path] [--outDir path] [--singleHtml]`: create a browser app.
- `1game buildjs [--entry path] [--outDir path]`: create the worker JS bundle used by gameplay tools.

Default config file:

```json
{
  "entry": "src/game.tsx",
  "outDir": "out"
}
```

Default build output:

- `out/index.html`
- `out/game.worker.js`
- `out/worker-bootstrap.js`

Single HTML output:

- `out/index.html`

### `@1game/cli-1gameplay`

Installs the `1gameplay` command. It is a CLI-only package; do not import it from game code.

Commands:

- `1gameplay create --entry <path> --out <file.1gamerecord> [--checkpoint-every <n>]` (`--checkpoint-every` must be an integer `>= 1`). Prefer paths under `out/` (for example `out/debug.1gamerecord`) so archives stay next to `1game build` output and match the default `.gitignore` from `1game init`.
- `1gameplay step <file.1gamerecord> --ms <n> [--repeat <n>] [--event <json>] [--event-file <path>] [--from-frame <seq>] [--capture-console off|error|warn|info|log|debug|all] [--console-max-per-step <n>] [--console-max-bytes <n>]`
- `1gameplay comments add <file.1gamerecord> --at <seq|last> --body <text> [--author-id <id>] [--anchor-json <json>] [--comment-id <id>]`
- `1gameplay frames list <file.1gamerecord> [--from <n>] [--to <n>]` (`--from`/`--to` must be integers `>= 0` and `from <= to`)
- `1gameplay frame query <file.1gamerecord> --at <seq|last> --select <expr>... [--payload summary|full]`
- `1gameplay frame diff <file.1gamerecord> --from <seq> --to <seq|last> --select <expr>... [--payload summary|full]`
- `1gameplay frame simulate <file.1gamerecord> --from <seq|last> --ms <n> [--event <json> | --event-file <path>]... --select <expr>... [--payload summary|full]`
- `1gameplay frame batch <file.1gamerecord> --plan-file <path> [--payload summary|full]`
- `1gameplay frame screenshot <file.1gamerecord> --at <seq|last> --out <file.png|jpg> [--scene <id>] [--width <n>] [--height <n>] [--dpr <n>] [--format png|jpeg] [--quality <1-100>]`
- `1gameplay bundle-player-html <file.1gamerecord> --out <replay.html> [--title <s>] [--single-html]` (prefer `--out out/replay.html` so outputs are ignored alongside other `out/` artifacts; default exports `replay.html` + `player.bundle.js` + copied `.1gamerecord`; `--single-html` exports only one HTML file with inlined bundle + record base64)
- `1gameplay frames delete <file.1gamerecord> --ranges <spec> [--compact]`

Archives are regular SQLite-backed `.1gamerecord` files, not directories.

Headless event payloads passed through `--event` / `--event-file` follow runtime worker event types:

- `touch` (pointer press/move/release snapshots)
- `hover`
- `keyboard` (snapshot of all currently pressed keys)
- `visibleChange`

CLI also accepts macro events and expands them to runtime worker events:

- `click` → `touch` down + up
- `keypress` → `keyboard` press + release

`keydown` and `keyup` are not direct worker event types in headless mode. For explicit control, use:

- `keyboard` with a non-empty `data` array for keydown snapshots
- `keyboard` with `data: []` for keyup (release all pressed keys)

Useful selectors:

- `runtime`
- `events`
- `logs`
- `logs:level=<error|warn|info|log|debug>`
- `store:dump`
- `store:frame`
- `store:state`
- `render`
- `render:scene=<sceneId>`
- `hit:point=<x>,<y>:scene=<sceneId>[:mode=clickable|any][:pick=top|all]` — scene-space hit test in the Worker (same semantics as DSL `nodeFromPoint` / `nodesFromPoint`: z-order, `hidden`, `overflowVisible`, intercept, clickability). Default `mode` is `clickable` (matches interactive hit targeting); default `pick` is `top` (single deepest hit). Use `mode=any` for geometry-only hit. Use `pick=all` to list **all** hit targets at the point in **priority order** (highest first): `items[0]` is always the same node as `pick=top`; `hidden` nodes are omitted; `mode=clickable` filters to clickable targets; `touchInterceptMode='intercepted'` stops descent on that branch (same as pointer hit). Results are capped at 256 entries. **Top** stdout shape: `{ hit: true, nodeId: "<id>", chain: ["<sceneId>", ...] }` or miss `{ hit: false, nodeId: null, chain: [] }`. **All** stdout shape: `{ hit: boolean, count: number, items: [{ nodeId, chain }, ...] }` with `hit === count > 0`. Unknown `sceneId` fails as NOT_FOUND (exit `3`). Like `render` and live store views, this selector replays the archive to query the worker.
- `hit:scene=<sceneId>:node=<nodeId>[:shape=polygon|aabb][:space=scene|local][:include=meta,path,matrix,polygon,aabb]` — **node hit-region snapshot** (polygon/AABB in scene or local space), derived **clickability** (matches pointer hit-test rules), `touchInterceptMode`, optional `pathNodeIds` / `transformMatrix`. Defaults: `shape=polygon`, `space=scene`, `include=meta,path`. Use `shape=aabb` for a bounding box without full polygon unless `include=polygon`. Use `node=*` for the first non-scene node under the scene. Scene/node missing → `NOT_FOUND` (exit `3`). Distinct from point-based `hit:point=…`: this describes one node’s region by id, not “what is under a coordinate.”

Error-output contract:

- `step`, `frame query|diff|simulate|batch`, and `comments add` output JSON envelopes on success.
- `frame query|diff|simulate|batch` always output JSON envelopes on stdout (`1gameplay.frame` / `1gameplay.error`).
- Non-frame commands fail with one `AGENT_ERROR` line on stderr by default.
- All commands support global `--json`: non-frame command failures switch to stdout JSON with schema `1gameplay.error`, useful for automation.

### `@1game/solid-particles-proton`

Optional particle add-on. Install with:

```bash
pnpm add @1game/solid-particles-proton proton-engine
```

Use `ParticlesEmitter` for visual particle effects mapped to 1Game `<draw>` nodes.

## Runtime APIs

### `createGameStore(initialState, options)`

Creates a reactive game store plus mutation and history helpers.

Common return values:

- `store`: reactive state used in JSX.
- `commitChange(label, mutator)`: mutate state transactionally.
- `storeHistory`: history object used by replay, seek, and `1gameplay`.

Recommended options for agent-debuggable games:

```ts
{
  enableHistory: true;
}
```

### `renderGame(root, options?)`

Starts the worker-side game.

Use:

```tsx
renderGame(() => <Game />, { bindStore: storeHistory });
```

Pass the root `storeHistory` through `bindStore` so `1gameplay` can inspect time-travel state.

### `useFrame(callback)`

Runs once per engine frame inside a component. Use it for simulation ticks.

Best practices:

- Clamp large `deltaSeconds` values when integrating motion.
- `deltaSeconds` is already in seconds for velocity math.
- Keep random seeds in store if randomness affects gameplay.
- Use `commitChange` inside `useFrame` for state updates.

### `useAudio()`

Worker-side audio helper:

- `loadAudio(resourceId)`
- `playOnce(resourceId, { volume, playbackRate })`

For background or looped audio, prefer declarative `<audio>` state driven by the store.

## JSX tags

Tags are lower-case JSX elements:

- `<scene>`: scene root.
- `<group>`: grouping and nesting.
- `<node>`: basic shape node.
- `<text>`: text node.
- `<image>`: image node.
- `<line>`: line node.
- `<draw>`: custom draw data.
- `<audio>`: audio node.

Common attributes:

- Position and size: `x`, `y`, `width`, `height`.
- Visibility: `hidden`, `alpha`, `zIndex`.
- Shapes: `shape="rect"`, `shape="circular"`, `shape="triangle"`, `shape="roundedRect(8 8 8 8)"`, `shape="polygon(50,0 100,100 0,100)"`.
- Colors and borders: `backgroundColor`, `foregroundColor`, `border`, `borderWidth`, `borderColor`.
- Text: `text`, `textSize`, `textColor`, `textAlign`, `textVerticalAlign`, `autoWrap`.
- Images: `imageId`, `imageFit`, `imageCutArea`.

## Events

Pointer and gesture handlers:

- `onClick`
- `onPointerDown`
- `onPointerMove`
- `onPointerUp`
- `onPointerUpOutside`
- `onPointerCancel`
- `onPointerEnter`
- `onPointerLeave`
- `onHover`
- `onDragStart`
- `onDrag`
- `onDragEnd`

Capture variants are supported by appending `Capture`.

Keyboard handlers are scene-level:

- `onKeyDown`
- `onKeyUp`

Keyboard `detail.code` values use standard Web `KeyboardEvent.code` strings (not a 1Game-specific enum).

Common key codes:

- Arrows: `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`
- WASD: `KeyW`, `KeyA`, `KeyS`, `KeyD`
- Common actions: `Space`, `Enter`, `Escape`, `Tab`, `Backspace`
- Modifiers: `ShiftLeft`, `ShiftRight`, `ControlLeft`, `ControlRight`, `AltLeft`, `AltRight`, `MetaLeft`, `MetaRight`
- Number row: `Digit0` to `Digit9`

Standards and references:

- MDN `KeyboardEvent.code` values: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values
- UI Events KeyboardEvent code Values (W3C): https://www.w3.org/TR/uievents-code/

Event object fields include:

- `x`, `y`: scene coordinates.
- `target`, `currentTarget`.
- `pointerId`.
- `detail`.
- `stopPropagation()`.
- `stopImmediatePropagation()`.
