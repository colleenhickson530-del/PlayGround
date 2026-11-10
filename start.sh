#!/usr/bin/env bash
# Build the static app inside PROJECT_DIR and serve it in the foreground.
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

PORT="${PORT:-3000}"
[[ "$PORT" =~ ^[1-9][0-9]{0,4}$ ]] || { echo "Invalid PORT: $PORT" >&2; exit 1; }
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
mkdir -p "$WEB_DIR"
export PORT

run_timed() {
  local label="$1"
  shift
  local started finished status
  started="$(date +%s%3N)"
  set +e
  "$@"
  status=$?
  set -e
  finished="$(date +%s%3N)"
  echo "[timing] ${label}: $((finished - started)) ms"
  return "$status"
}

dependency_hash() {
  node -e '
    const { readFileSync, existsSync } = require("node:fs");
    const { createHash } = require("node:crypto");
    const hash = createHash("sha256");
    for (const file of ["package.json", "package-lock.json"]) {
      if (existsSync(file)) hash.update(readFileSync(file));
    }
    process.stdout.write(hash.digest("hex"));
  '
}

WANT_HASH="$(dependency_hash)"
HAVE_HASH="$(cat "$WEB_DIR/dependency-hash" 2>/dev/null || true)"

if [[ ! -x node_modules/.bin/vite || ! -f node_modules/vite/package.json || "$WANT_HASH" != "$HAVE_HASH" ]]; then
  if [[ -f package-lock.json ]]; then
    run_timed "install" npm ci --no-audit --no-fund
  else
    run_timed "install" npm install --no-audit --no-fund
  fi
  printf '%s' "$WANT_HASH" > "$WEB_DIR/dependency-hash"
fi

needs_build=false
if [[ ! -f dist/index.html ]]; then
  needs_build=true
elif find index.html package.json package-lock.json vite.config.js src public -type f -newer dist/index.html -print -quit 2>/dev/null | grep -q .; then
  needs_build=true
fi

if [[ "$needs_build" == true ]]; then
  run_timed "build" node node_modules/vite/bin/vite.js build --base ./
fi

[[ -f dist/index.html ]] || { echo "Build did not produce dist/index.html" >&2; exit 1; }

DIST_DIR="$(cd dist && pwd)"
run_timed "deployment metadata" node -e '
  const { writeFileSync } = require("node:fs");
  const [file, project, directory] = process.argv.slice(1);
  writeFileSync(file, JSON.stringify({ project, directory }) + "\n");
' "$WEB_DIR/deployment-output.json" "$PROJECT_ROOT" "$DIST_DIR"

# Vite preview serves the built static output and stays in the foreground.
run_timed "serve" node node_modules/vite/bin/vite.js preview --host 0.0.0.0 --port "$PORT" --strictPort
