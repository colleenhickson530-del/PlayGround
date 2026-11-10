#!/usr/bin/env bash
# Capture the deployed app at CAPTURE_URL into CAPTURE_DIR.
# Exit 75 = temporary browser/navigation failure; exit 1 = script or rendering defect.
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

: "${CAPTURE_URL:?Set CAPTURE_URL to the exact URL to capture.}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to the screenshot output directory.}"

now_ms() {
  date +%s%3N
}

SCRIPT_START="$(now_ms)"
finish() {
  local status=$?
  echo "[timing] capture.sh total: $(( $(now_ms) - SCRIPT_START )) ms"
  exit "$status"
}
trap finish EXIT

run_timed() {
  local label="$1"
  shift
  local started finished status
  started="$(now_ms)"
  set +e
  "$@"
  status=$?
  set -e
  finished="$(now_ms)"
  echo "[timing] ${label}: $((finished - started)) ms"
  return "$status"
}

if [[ ! -f "$PROJECT_ROOT/scripts/capture.mjs" ]]; then
  echo "Missing capture implementation: $PROJECT_ROOT/scripts/capture.mjs" >&2
  exit 1
fi

run_timed "prepare capture directory" mkdir -p "$CAPTURE_DIR"

CAPTURE_DIR_ABS="$(cd "$CAPTURE_DIR" && pwd)"
case "$CAPTURE_DIR_ABS/" in
  "$PROJECT_ROOT"/*)
    echo "Warning: CAPTURE_DIR is inside the project; capture evidence should live outside source." >&2
    ;;
esac

echo "Capturing $CAPTURE_URL into $CAPTURE_DIR_ABS"

status=0
CAPTURE_URL="$CAPTURE_URL" CAPTURE_DIR="$CAPTURE_DIR_ABS" \
  run_timed "browser capture" node "$PROJECT_ROOT/scripts/capture.mjs" || status=$?

if [[ "$status" -eq 0 ]]; then
  for name in final-desktop.png final-mobile.png; do
    [[ -s "$CAPTURE_DIR_ABS/$name" ]] || { echo "Missing screenshot: $name" >&2; exit 1; }
  done
  echo "Captured desktop and mobile screenshots in $CAPTURE_DIR_ABS"
fi

exit "$status"
