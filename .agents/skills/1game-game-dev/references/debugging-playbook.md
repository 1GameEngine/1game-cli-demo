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
pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord --checkpoint-every 120
```

Only delete an archive when you intentionally want a clean run. Keep useful bug archives for review.

## Logic does not change

Run:

```bash
pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --repeat 10
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload full
```

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

- `<nodeId>` is the node’s id as in `render:scene=main` (same as VirtualNode id).
- If you only need a quick check without copying an id from a previous command, use `node=*` (first non-`scene` node under that scene).
- Add `include=polygon` (and optionally `include=matrix`) when you need vertices or the world `transformMatrix`.
- `include` defaults to `meta,path`; `shape` defaults to `polygon` but polygon points are omitted unless you include `polygon` or `aabb` in `include`, or use `shape=aabb` (always computes an axis-aligned box from the shape polygon).
- This path does **not** subtract occluded screen pixels; it reports the shape polygon / AABB after the same transforms as hit-testing.

## Input does not trigger

Inject a click:

```bash
pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --event '{"type":"click","sceneId":"main","data":{"id":1,"x":100,"y":100,"time":1000,"domClientX":100,"domClientY":100}}'
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
- Importing a private package path.
- Using DOM APIs inside the worker entry.
- Depending on browser-only globals that are unavailable in headless replay.

For automation-friendly failure parsing, add `--json` to non-frame commands (for example `1gameplay --json create ...` or `1gameplay create ... --json`). In this mode, failures are written to stdout as JSON (`schema: 1gameplay.error`) instead of `AGENT_ERROR` on stderr.

## Regression recipe

For a fixed bug, keep a short command sequence in the PR or issue:

```bash
pnpm build
rm -f out/debug.1gamerecord
pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --repeat 60
pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --event '{"type":"click","sceneId":"main","data":{"id":1,"x":100,"y":100,"time":1000,"domClientX":100,"domClientY":100}}'
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload full
```
