# 1Game Debugging Playbook

This playbook is for AI agents debugging a public-package 1Game project.

## Core loop

1. Build the project to catch syntax and bundling errors.
2. Create a fresh gameplay archive.
3. Step a known number of frames.
4. Query state and render summaries.
5. Inject one event at a time.
6. Diff frames before and after the event.
7. Fix the smallest cause, then recreate the archive and retest.

## Fresh archive

```bash
rm -f out/debug.1gamerecord
pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
```

Only delete an archive when you intentionally want a clean run. Keep useful bug archives for review.

## Logic does not change

Run:

```bash
pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --repeat 10
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload full
```

`1gameplay step` can omit `--ms`, but do not rely on the default `100` ms when debugging gameplay timing. Always pass explicit `--ms`.

Check:

- `createGameStore(..., { enableHistory: true })` is used.
- `renderGame` receives `{ bindStore: storeHistory }`.
- `useFrame` or event handlers call `commitChange`.
- `commitChange` mutates the draft object, not the readonly store.
- Phase guards do not block updates unexpectedly.

## Hit region and clickability (frame `hit:`)

Use when you need **where** a node is clickable in scene space or whether it behaves as clickable under DSL rules, without guessing from render JSON alone.

```bash
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last \
  --select 'hit:scene=main:node=<nodeId>:shape=aabb:include=meta,path,aabb'
```

- `<nodeId>` is the runtime node id returned by `render:scene=main` in the same replay session.
- If you only need a quick check without copying an id from a previous command, use `node=*` (first non-`scene` node under that scene).
- Add `include=polygon` (and optionally `include=matrix`) when you need vertices or the world `transformMatrix`.
- `include` defaults to `meta,path`; `shape` defaults to `polygon` but polygon points are omitted unless you include `polygon` or `aabb` in `include`, or use `shape=aabb` (always computes an axis-aligned box from the shape polygon).
- This path does **not** subtract occluded screen pixels; it reports the shape polygon / AABB after the same transforms as hit-testing.

## Input does not trigger

Inject events using runtime worker events (`touch` / `hover` / `keyboard` / `visibleChange`) or CLI macro events (`click` / `keypress` / `keydown` / `keyup`).

`keydown` / `keyup` and `pointer.down` / `pointer.move` / `pointer.up` require schema v6 `.1gamerecord` with per-frame unified `frame_input_snapshots` (`{ keyboard, touch }`); use separate `step` commands (or `--from-frame`) for cross-command hold/move/release.

```bash
# Macro click / keypress
pnpm exec 1gameplay step out/debug.1gamerecord --event '{"type":"click","sceneId":"main","data":{"x":100,"y":100}}'
pnpm exec 1gameplay step out/debug.1gamerecord --event '{"type":"keypress","sceneId":"main","data":{"code":"ArrowLeft"}}'

# Raw keyboard snapshots (advanced)
pnpm exec 1gameplay step out/debug.1gamerecord --event '{"type":"keyboard","sceneId":"main","data":[{"code":"ArrowLeft","key":"ArrowLeft","time":1000,"shift":false,"meta":false,"alt":false,"ctrl":false}]}'
pnpm exec 1gameplay step out/debug.1gamerecord --event '{"type":"keyboard","sceneId":"main","data":[]}'

# Standard event-file flow (recommended)
mkdir -p scripts
cp node_modules/@1game/skill/skills/1game-game-dev/assets/keypress-arrow.mjs scripts/keypress-arrow.mjs
node scripts/keypress-arrow.mjs ArrowLeft out/keypress-left.events.json
pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --event-file out/keypress-left.events.json

pnpm exec 1gameplay frame diff out/debug.1gamerecord --from 0 --to last --select store:dump --payload full
```

Confirm which node the engine considers hit at the same scene coordinates (default: interactive / clickable rules):

```bash
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select 'hit:point=100,100:scene=main' --payload full
```

Use `hit:point=<x>,<y>:scene=<id>:mode=any` only when you need geometry without clickability filtering.

Check:

- The target node has `clickable` or an event handler.
- Coordinates are inside the node bounds in scene coordinates.
- Parent groups do not move the node away from the injected point.
- `hidden`, `alpha`, `zIndex`, and overlapping clickable nodes do not intercept the event.
- The `sceneId` in the event matches the `<scene id="...">`.

## Visual output does not match state

Run:

```bash
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select store:state --select render:scene=main --payload full
```

If the store is correct but render is wrong:

- Confirm JSX reads from `store`, not stale local variables.
- Confirm numeric dimensions are valid and non-negative.
- Confirm scene width/height match the intended coordinate system.
- Confirm `zIndex` order and `hidden` flags.
- Confirm text has enough `width`, `height`, and `textSize`.
- Confirm image IDs match loaded resources.

## Browser differs from 1gameplay

Run a static server:

```bash
pnpm exec 1game build
python3 -m http.server 4173 -d out
```

Then inspect:

- Browser console errors.
- Worker loading errors caused by opening `out/index.html` directly from `file://`.
- Asset URLs and CORS behavior.
- Audio restrictions that require a user gesture.
- Viewport scaling and pointer coordinate differences on mobile.

## Runtime errors

If `1gameplay` exits with code `5`, query nearby frames and inspect stderr/stdout. Common causes:

- Throwing inside `useFrame` or event handlers.
- Importing a non-installed or invalid package path.
- Using DOM APIs inside the worker entry.
- Depending on browser-only globals that are unavailable in headless replay.

For automation-friendly failure parsing, non-frame commands fail on stdout as JSON by default (`schema: 1gameplay.error`).

## Regression recipe

For a fixed bug, keep a short command sequence in the PR or issue:

```bash
pnpm build
rm -f out/debug.1gamerecord
pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --repeat 60
pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --event '{"type":"click","sceneId":"main","data":{"x":100,"y":100}}'
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload full
```

Note: for `click` macro events, `x` and `y` are the required minimum fields; `id`, `time`, `durationMs`, `domClientX`, and `domClientY` are optional advanced parameters.
