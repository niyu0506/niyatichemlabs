#!/bin/bash
# Capture a full-resolution slice of a page starting at a given Y offset.
# chromium --screenshot always renders from the top of the document, so we shift
# the content up with injected CSS instead of trying to scroll.
#
# Usage: ./region-shot.sh <path> <width> <offsetY> <sliceHeight> <out.png>
set -u
ROOT="$(cd "$(dirname "$0")" && pwd)"
PORT=8899
P="${1:-/}"; W="${2:-1440}"; Y="${3:-0}"; H="${4:-900}"; OUT="${5:-/tmp/region.png}"

if ! curl -s -o /dev/null --max-time 2 "http://127.0.0.1:$PORT/niyatichemlabs/"; then
  mkdir -p "$ROOT/.serve"; ln -sfn "$ROOT/docs" "$ROOT/.serve/niyatichemlabs"
  (cd "$ROOT/.serve" && exec python3 -m http.server $PORT --bind 127.0.0.1) >/dev/null 2>&1 &
  for _ in $(seq 1 30); do curl -s -o /dev/null --max-time 1 "http://127.0.0.1:$PORT/niyatichemlabs/" && break; sleep 0.3; done
fi

src="$ROOT/docs${P}"; [ "${P: -1}" = "/" ] && src="$ROOT/docs${P}index.html"
tmp="__region.html"
python3 - "$src" "$ROOT/docs/$tmp" "$Y" <<'PY'
import sys
src, dst, y = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(src, encoding='utf-8', errors='replace').read()
css = ("<style>body{position:relative;top:-%spx}"
       ".site-header,.topbar,.fab-stack{display:none!important}</style>" % y)
s = s.replace('</head>', css + '</head>') if '</head>' in s else css + s
open(dst, 'w', encoding='utf-8').write(s)
PY

chromium --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --force-device-scale-factor=1 --force-prefers-reduced-motion \
  --window-size="$W,$H" --virtual-time-budget=8000 \
  --screenshot="$OUT" "http://127.0.0.1:$PORT/niyatichemlabs/$tmp" >/dev/null 2>&1

rm -f "$ROOT/docs/$tmp"
ls -la "$OUT"
