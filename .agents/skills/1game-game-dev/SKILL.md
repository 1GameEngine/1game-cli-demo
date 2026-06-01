---
name: 1game-game-dev
description: Develop, debug, build, and replay 1Game browser games with the public @1game packages. Use when creating a new game project, implementing gameplay with @1game/engine-bundle, using the 1game CLI, or debugging deterministic gameplay with 1gameplay.
license: MIT
compatibility: Node.js 20+, pnpm 9+ (recommended), browser runtime with Web Worker support.
---

# 1Game Game Development

Use this skill to build a new 1Game browser game from the public packages.
`SKILL.md` keeps the execution workflow and minimal guardrails. Detailed API/command catalogs live in `references/`.

## Scope and boundaries

Use public npm packages and commands:

- `@1game/engine-bundle` for runtime APIs and JSX tags.
- `@1game/cli` for project initialization and browser builds.
- `@1game/cli-1gameplay` for headless gameplay recording, stepping, query, diff, simulation, and replay HTML.
- Optional public add-ons such as `@1game/solid-particles-proton`.

## Source of truth and conflict handling

- This `SKILL.md` plus files under `references/` are the authoritative workflow for this skill.
- `1game init` generated `AGENTS.md` is a convenience quickstart for new projects.
- If they conflict, follow this skill package first, then update local project notes/scripts to match.
- For path/layout differences across project layouts, follow `references/path-modes.md`.

## Default workflow for agents

1. Clarify the game loop: objective, player actions, win/lose states, scenes, assets, and target aspect ratio.
2. Create or inspect the game project with `1game init <name>`. New projects include `.gitignore` entries for `out/`, `*.1gamerecord`, and common artifacts so builds and gameplay archives are not committed by accident.
3. Implement gameplay in `src/game.tsx` using deterministic store updates.
4. Build frequently with `pnpm build` or `pnpm exec 1game build --singleHtml`.
5. Debug logic with `1gameplay` by creating an archive, stepping frames, injecting events, querying store/render state, and diffing frames.
6. After debugging is complete, export a single-file replay HTML only when you need to show the process to users.
7. Use browser/manual testing for player feel and visual layout; use `1gameplay` for repeatable agent-friendly checks.

## Start a new game

```bash
pnpm dlx @1game/cli init my-game
cd my-game
pnpm install
pnpm exec 1game build
```

The generated project contains:

- `src/game.tsx`: worker-side game entry.
- `1game.config.json`: build config with `entry` and `outDir` (default `out/`).
- `.gitignore`: ignores `out/`, `*.1gamerecord`, `dist/`, `node_modules/`, and common junk files.
- `package.json`: scripts and dependencies.

If editing an existing project, install the public runtime and CLI packages:

```bash
pnpm add @1game/engine-bundle solid-js
pnpm add -D @1game/cli @1game/cli-1gameplay typescript
```

## Minimal must-have contract

For game logic that must be replayable and debuggable:

- Put authoritative gameplay state in `createGameStore`.
- Use `commitChange(label, draft => ...)` for all gameplay state transitions.
- Mutate the `draft` object inside `commitChange`; do not `return` a brand-new state object from mutators.
- Enable history with `{ enableHistory: true }`.
- Bind history in `renderGame(..., { bindStore: storeHistory })`.
- Keep scene ids stable (for example `main`) for reliable headless querying.

Minimal shape:

```tsx
import { createGameStore, renderGame } from '@1game/engine-bundle/runtime/worker';

const { storeHistory } = createGameStore({ phase: 'playing' }, { enableHistory: true });

renderGame(() => <scene id="main" width={320} height={180} />, { bindStore: storeHistory });
```

## Minimal deterministic check commands

Use these to validate the game loop before deeper debugging:

```bash
pnpm exec 1game build
pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --repeat 60
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select store:state --select render:scene=main --payload summary
```

Always set `--ms` explicitly. Recommended defaults:

- Real-time / action loops: start with `--ms 16`.
- Fixed-tick/grid games: set `--ms` close to your gameplay tick (for example `--ms 140` for 140 ms per cell).

When debugging is done and you need to share with users, generate a single-file replay HTML:

```bash
pnpm exec 1gameplay bundle-player-html out/debug.1gamerecord --out out/replay-single.html --single-html
```

## Reference routing (single source of detail)

Load detailed docs only when needed:

- `references/public-api.md`: full public API, CLI command matrix, event payloads, selector semantics, and error contract.
- `references/debugging-playbook.md`: step-by-step debugging recipes and troubleshooting flow.
- `references/game-patterns.md`: practical implementation patterns for state, input, movement, collision, audio, and layout.
- `references/path-modes.md`: one-page path matrix for independent projects (`out/`) vs monorepo demos (`dist/` and package-local archives).
- `assets/new-game-template.tsx`: runnable starter template for a deterministic mini game.
- `assets/keypress-arrow.mjs`: standard helper script that writes a `keypress` macro event file for `1gameplay step --event-file`.

## Definition of done checklist

Before finishing an implementation:

1. `1game build` succeeds and outputs the browser bundle.
2. `1gameplay create` + `step` + `frame query --select store:state` run successfully.
3. If you need to show debugging process to users, `1gameplay bundle-player-html --single-html` runs successfully.
4. Browser/manual test confirms controls, layout, and interaction feel.
