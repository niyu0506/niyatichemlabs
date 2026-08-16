#!/usr/bin/env python3
"""Vectorise the Niyati Chemlabs logo PNG into SVG.

Run from the repository root:  python3 setup/vectorise-logo.py
Needs `potrace` and Pillow:    apt-get install potrace python3-pil

You should not need this again unless the client supplies new artwork — the
generated static/img/site/logo.svg and logo-light.svg are committed. It is kept
so the result is reproducible rather than a one-off nobody can repeat.

The supplied artwork only exists as a 400x119 PNG (itself an upscale of a
260x80 web asset), so the two brand colours are separated, cleaned, upsampled
and traced. Nothing is redrawn or re-typeset: the geometry is the client's.

Three things matter for fidelity:
  * pixels are assigned to whichever brand colour they are nearest, so JPEG
    chroma noise inside the letters does not leak into the leaf layer;
  * connected components below a few source pixels are dropped, which kills
    the colour fringing along the letter edges without touching the artwork;
  * the threshold is solved per layer so the traced area matches the source's
    antialiased ink mass — thresholding at a flat 50% fattens every stroke.
"""
import re
import subprocess
import tempfile
from collections import deque
from PIL import Image, ImageFilter

SRC = "static/img/site/logo.png"
TMP = tempfile.mkdtemp(prefix="logo-trace-")
UP = 16                 # upsample factor before tracing
# Low-pass in source pixels. The leaf is an organic outline and takes more
# smoothing; the wordmark needs its corners, so it takes less.
BLUR = {"leaf": 0.75, "word": 0.5}
MIN_AREA = 6            # drop connected components smaller than this (source px)

GREEN_REF = (118, 162, 62)
INK_REF = (17, 17, 17)
WHITE = (255, 255, 255)

GREEN = "#76A23E"
INK = "#111111"


def split_layers(path):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    px = im.load()
    layers = {"leaf": Image.new("L", (w, h), 0), "word": Image.new("L", (w, h), 0)}
    lp = {k: v.load() for k, v in layers.items()}
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 10:
                continue
            # Classify by CHROMA, not RGB distance: a mid-grey letter edge is
            # numerically nearer the green than it is to either black or white,
            # which is what painted green slivers down the side of every letter.
            greenness = g - max(r, b)
            if greenness >= 12:
                lp["leaf"][x, y] = a
            elif max(r, g, b) < 210:
                lp["word"][x, y] = a
    # The leaf's fine veins are desaturated enough to read as neutral, so they
    # land in the wordmark layer and trace as black specks floating in the leaf.
    # The wordmark is a dense horizontal band; nothing above its cap line
    # belongs to it, so anything up there is part of the drawing.
    wp = lp["word"]
    rows = [sum(1 for x in range(w) if wp[x, y] > 24) for y in range(h)]
    cap = next((y for y, n in enumerate(rows) if n >= 10), 0)
    moved = 0
    for y in range(cap):
        for x in range(w):
            if wp[x, y]:
                lp["leaf"][x, y] = max(lp["leaf"][x, y], wp[x, y])
                wp[x, y] = 0
                moved += 1
    if moved:
        print(f"  moved {moved} px above the cap line (y<{cap}) into the leaf")
    return layers, w, h


def drop_specks(mask, min_area=MIN_AREA):
    """Remove connected components smaller than min_area px (4-connectivity)."""
    w, h = mask.size
    p = mask.load()
    seen = [[False] * w for _ in range(h)]
    removed = 0
    for y0 in range(h):
        for x0 in range(w):
            if seen[y0][x0] or p[x0, y0] < 24:
                continue
            comp, q = [], deque([(x0, y0)])
            seen[y0][x0] = True
            while q:
                x, y = q.popleft()
                comp.append((x, y))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and p[nx, ny] >= 24:
                        seen[ny][nx] = True
                        q.append((nx, ny))
            if len(comp) < min_area:
                removed += 1
                for x, y in comp:
                    p[x, y] = 0
    return removed


def solve_threshold(big, target_area, up):
    """Pick the binarisation level whose area matches the source's ink mass."""
    lo, hi = 40, 220
    for _ in range(12):
        mid = (lo + hi) / 2
        area = sum(big.point(lambda v, m=mid: 255 if v >= m else 0).histogram()[255:]) / (up * up)
        if area > target_area:
            lo = mid            # too fat -> raise the threshold
        else:
            hi = mid
    return (lo + hi) / 2


def trace(mask, tag, w, h):
    blur = BLUR[tag]
    target = sum(v * n for v, n in enumerate(mask.histogram())) / 255.0
    big = mask.resize((w * UP, h * UP), Image.LANCZOS)
    if blur:
        big = big.filter(ImageFilter.GaussianBlur(blur * UP))
    t = solve_threshold(big, target, UP)
    bw = big.point(lambda v: 0 if v >= t else 255, mode="1")   # potrace traces black
    pbm, svg = f"{TMP}/{tag}.pbm", f"{TMP}/{tag}.svg"
    bw.save(pbm)
    subprocess.run(["potrace", pbm, "-s", "-o", svg, "--flat",
                    "-a", "1.0", "-O", "0.4",
                    "-t", str(UP * UP), "-u", "10"], check=True)
    src = open(svg).read()
    print(f"  {tag}: ink mass {target:7.1f}px  threshold {t:5.1f}")
    return (re.findall(r'<path[^>]*\bd="([^"]+)"', src),
            re.search(r'<g transform="([^"]+)"', src).group(1))


def main():
    layers, w, h = split_layers(SRC)
    for name, m in layers.items():
        n = drop_specks(m)
        if n:
            print(f"  {name}: dropped {n} speck(s)")
    leaf = trace(layers["leaf"], "leaf", w, h)
    word = trace(layers["word"], "word", w, h)
    k = 1.0 / UP

    def layer(spec, colour, label):
        paths, tr = spec
        body = "".join(f'<path d="{d}"/>' for d in paths)
        return (f'<g id="{label}" fill="{colour}">'
                f'<g transform="scale({k:g}) {tr}">{body}</g></g>')

    for out, ink in (("logo", INK), ("logo-light", "#FFFFFF")):
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
               f'width="{w}" height="{h}" role="img" aria-label="Niyati Chemlabs">'
               f'<title>Niyati Chemlabs</title>'
               + layer(leaf, GREEN, "leaf")
               + layer(word, ink, "wordmark")
               + "</svg>\n")
        p = f"static/img/site/{out}.svg"
        open(p, "w").write(svg)
        print(f"wrote {p}  {len(svg)/1024:.1f} KB")


if __name__ == "__main__":
    main()
