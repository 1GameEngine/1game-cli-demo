#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "请设置环境变量 VERCEL_TOKEN（勿写入仓库）" >&2
  exit 1
fi

npm run build:deploy
npx vercel deploy out --prod --yes --scope "${VERCEL_SCOPE:-linfaxins-projects}"
