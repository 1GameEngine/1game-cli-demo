# Path modes matrix (`out/` vs `dist/`)

Use this table to avoid path confusion across environments.

| Mode | Typical location | Build output | `.1gamerecord` location | Package style |
|---|---|---|---|---|
| Independent project (`1game init`) | standalone repo/app | `out/` (default `outDir`) | `out/debug.1gamerecord` | published npm versions |
| Monorepo demo/app | `apps/cli-demos/*` (or similar workspace package) | usually `dist/` (depends on local `1game.config.json`) | often package root (for example `debug.1gamerecord`) or `dist/` by team convention | `workspace:*` during local development |

## Mode A: independent project (default skill flow)

```bash
pnpm exec 1game build
pnpm exec 1gameplay create --entry src/game.tsx --out out/debug.1gamerecord
pnpm exec 1gameplay step out/debug.1gamerecord --ms 16 --repeat 60
pnpm exec 1gameplay frame query out/debug.1gamerecord --at last --select store:state --payload summary
```

## Mode B: monorepo package (workspace flow)

```bash
# from repository root
pnpm --filter @scope/your-demo build

# from package directory (example)
pnpm run gameplay:create
pnpm run gameplay:tick
pnpm run gameplay:query-last
```

When not using package scripts, pass paths explicitly (do not assume `out/`):

```bash
pnpm exec 1game build --outDir dist
pnpm exec 1gameplay create --entry src/game.tsx --out debug.1gamerecord
pnpm exec 1gameplay step debug.1gamerecord --ms 16 --repeat 60
```

## Hard rules

- Do not guess output paths; read local `1game.config.json` (`outDir`) and package scripts first.
- Keep all `1gameplay` commands in one mode per task (all `out/...` or all package-local paths).
- In automation prompts, always spell out exact paths used in this run.
