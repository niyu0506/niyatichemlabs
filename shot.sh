#!/bin/bash
# Screenshot helper for visual QA. Usage: ./shot.sh <path> <width> <out.png> [height]
# Serves docs/ on :8899 (starting the server if it isn't already up).
set -u
ROOT="$(cd "$(dirname "$0")" && pwd)"
PORT=8899

if ! curl -s -o /dev/null --max-time 2 "http://127.0.0.1:$PORT/niyatichemlabs/"; then
  # Serve so that /niyatichemlabs/<...> resolves, matching the GitHub Pages base path.
  mkdir -p "$ROOT/.serve"
  ln -sfn "$ROOT/docs" "$ROOT/.serve/niyatichemlabs"
  (cd "$ROOT/.serve" && exec python3 -m http.server $PORT --bind 127.0.0.1) >/dev/null 2>&1 &
  for _ in $(seq 1 30); do
    curl -s -o /dev/null --max-time 1 "http://127.0.0.1:$PORT/niyatichemlabs/" && break
    sleep 0.3
  done
fi

# NB: headless chromium here will not lay out below ~500 CSS px. Passing a
# width under that renders a 500px-wide layout and crops the image to <W>,
# which reads as "content is cut off" when it is only cropped. Trust widths
# of 500 and up; below that, check on a real phone.
PATH_="${1:-/}"
W="${2:-1440}"
OUT="${3:-/tmp/shot.png}"
H="${4:-2400}"

chromium --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --force-device-scale-factor=1 \
  --force-prefers-reduced-motion \
  --window-size="$W,$H" \
  --virtual-time-budget=8000 \
  --screenshot="$OUT" \
  "http://127.0.0.1:$PORT/niyatichemlabs$PATH_" >/dev/null 2>&1

ls -la "$OUT"
