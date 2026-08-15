#!/bin/bash
# Find elements that stick out past the viewport (the cause of horizontal scroll).
# Injects a measuring script into a copy of each built page, renders it headless,
# and dumps the offenders. Temporarily disables body{overflow-x:hidden} so the
# real culprits are visible rather than masked.
#
# Usage: ./overflow-check.sh [width]   (default 390)
set -u
ROOT="$(cd "$(dirname "$0")" && pwd)"
W="${1:-390}"
PORT=8899

PAGES="/ /about/ /products/ /products/raw-materials/ /products/formulations/ /enquiry/ /gallery/ /thank-you/ /certification/ /contact/ /products/soy-protein-isolate-90/ /products/diabopan-tablet/ /404.html"

read -r -d '' SCRIPT <<'EOJS'
<script>
window.addEventListener('load', function () {
  setTimeout(function () {
    var docEl = document.documentElement;
    document.body.style.overflowX = 'visible';
    docEl.style.overflowX = 'visible';
    var vw = docEl.clientWidth;
    var out = [];
    var scrolls = docEl.scrollWidth > vw + 1;
    out.push((scrolls ? 'SCROLLS' : 'OK') + ' viewport=' + vw + ' scrollWidth=' + docEl.scrollWidth +
             (vw > __WANT__ + 1 ? '  ⚠ requested ' + __WANT__ + 'px but chromium laid out at ' + vw + 'px' : ''));
    function clipped(el) {
      for (var n = el.parentElement; n && n !== document.body; n = n.parentElement) {
        var ov = getComputedStyle(n).overflowX;
        if (ov === 'hidden' || ov === 'clip' || ov === 'auto' || ov === 'scroll') return true;
      }
      return false;
    }
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (clipped(el)) continue;
      var overRight = r.right - vw;
      var overLeft = -r.left;
      if (overRight > 1 || overLeft > 1) {
        var sel = el.tagName.toLowerCase();
        if (el.id) sel += '#' + el.id;
        if (el.className && typeof el.className === 'string') {
          sel += '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.');
        }
        out.push('OVER ' + sel +
                 ' left=' + Math.round(r.left) +
                 ' right=' + Math.round(r.right) +
                 ' w=' + Math.round(r.width) +
                 ' overflowRight=' + Math.round(overRight > 0 ? overRight : 0) +
                 ' overflowLeft=' + Math.round(overLeft > 0 ? overLeft : 0));
      }
    }
    var pre = document.createElement('pre');
    pre.id = 'OVERFLOW_DIAG';
    pre.textContent = out.join('\n');
    document.body.appendChild(pre);
  }, 400);
});
</script>
EOJS

if ! curl -s -o /dev/null --max-time 2 "http://127.0.0.1:$PORT/niyatichemlabs/"; then
  mkdir -p "$ROOT/.serve"
  ln -sfn "$ROOT/docs" "$ROOT/.serve/niyatichemlabs"
  (cd "$ROOT/.serve" && exec python3 -m http.server $PORT --bind 127.0.0.1) >/dev/null 2>&1 &
  for _ in $(seq 1 30); do
    curl -s -o /dev/null --max-time 1 "http://127.0.0.1:$PORT/niyatichemlabs/" && break
    sleep 0.3
  done
fi

SCRIPT="${SCRIPT//__WANT__/$W}"

echo "=== overflow audit @ ${W}px requested ==="
for p in $PAGES; do
  src="$ROOT/docs${p}"
  [ "${p: -1}" = "/" ] && src="$ROOT/docs${p}index.html"
  [ -f "$src" ] || { echo "-- $p (missing)"; continue; }

  tmpname="__ovf$(echo "$p" | tr '/.' '__').html"
  python3 - "$src" "$ROOT/docs/$tmpname" "$SCRIPT" <<'PY'
import sys
src, dst, script = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(src, encoding='utf-8', errors='replace').read()
s = s.replace('</body>', script + '</body>') if '</body>' in s else s + script
open(dst, 'w', encoding='utf-8').write(s)
PY

  # NB: headless chromium on this box refuses to lay out below ~500 CSS px,
  # whichever headless mode is used. Asking for 390 silently measures 500, so
  # the audit reports the requested width AND the width actually used — never
  # read a "@390px" heading as proof that 390px is clean.
  dom=$(chromium --headless --disable-gpu --no-sandbox --hide-scrollbars \
        --window-size="$W,900" --virtual-time-budget=8000 --dump-dom \
        "http://127.0.0.1:$PORT/niyatichemlabs/$tmpname" 2>/dev/null)

  echo "-- $p"
  echo "$dom" | python3 -c "
import sys, re, html
d = sys.stdin.read()
m = re.search(r'<pre id=\"OVERFLOW_DIAG\">(.*?)</pre>', d, re.S)
if not m:
    print('   (no diagnostic — page may not have loaded)'); raise SystemExit
lines = html.unescape(m.group(1)).strip().split('\n')
print('   ' + lines[0])
offenders = lines[1:]
if not offenders:
    print('   ✅ nothing overflows')
else:
    seen = set()
    for l in offenders:
        key = l.split(' left=')[0]
        if key in seen: continue
        seen.add(key)
        print('   ' + l)
"
  rm -f "$ROOT/docs/$tmpname"
done
