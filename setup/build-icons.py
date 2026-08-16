#!/usr/bin/env python3
"""Render the favicon and Apple touch icon from the vector logo.

Run from the repository root:  python3 setup/build-icons.py
Needs Pillow and chromium:     apt-get install python3-pil chromium

Both icons are the leaf mark from static/img/site/logo.svg, cropped square and
centred, at the same proportions the previous hand-cut PNGs used (the leaf
fills ~76% of the icon width). The favicon keeps its transparent background;
the Apple icon sits on white, because iOS composites transparent touch icons
onto black.
"""
import re
import subprocess
import tempfile
from PIL import Image

LOGO = "static/img/site/logo.svg"
TMP = tempfile.mkdtemp(prefix="icons-")
FILL = 0.76          # share of the icon width the leaf occupies
OUTPUTS = [("static/favicon.png", 192, None),
           ("static/apple-touch-icon.png", 180, "#FFFFFF")]


def leaf_only():
    """The <g id="leaf"> layer of the logo, as a standalone SVG string."""
    src = open(LOGO).read()
    vb = re.search(r'viewBox="([^"]+)"', src).group(1)
    g = re.search(r'(<g id="leaf".*?</g></g>)', src, re.S)
    if not g:
        raise SystemExit("no leaf layer found in " + LOGO)
    return vb, f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{g.group(1)}</svg>'


def render(svg, out, size, background):
    """Rasterise an SVG string to a square PNG with headless chromium."""
    src = f"{TMP}/in.svg"
    open(src, "w").write(svg)
    bg = "FFFFFFFF" if background else "00000000"
    subprocess.run(["chromium", "--headless", "--disable-gpu", "--no-sandbox",
                    "--hide-scrollbars", f"--default-background-color={bg}",
                    "--force-device-scale-factor=1",
                    f"--window-size={size},{size}",
                    "--virtual-time-budget=5000",
                    f"--screenshot={out}", f"file://{src}"],
                   capture_output=True, check=True)


def measure(svg, vb):
    """Bounding box of the artwork, in the SVG's own user units."""
    probe = f"{TMP}/probe.png"
    x0, y0, w, h = (float(v) for v in vb.split())
    scale = 8
    sized = svg.replace("<svg ", f'<svg width="{w*scale}" height="{h*scale}" ', 1)
    open(f"{TMP}/in.svg", "w").write(sized)
    subprocess.run(["chromium", "--headless", "--disable-gpu", "--no-sandbox",
                    "--hide-scrollbars", "--default-background-color=00000000",
                    "--force-device-scale-factor=1",
                    f"--window-size={int(w*scale)},{int(h*scale)}",
                    "--virtual-time-budget=5000",
                    f"--screenshot={probe}", f"file://{TMP}/in.svg"],
                   capture_output=True, check=True)
    bb = Image.open(probe).convert("RGBA").getchannel("A").getbbox()
    return tuple(v / scale for v in bb)      # (x0, y0, x1, y1) in user units


def main():
    vb, svg = leaf_only()
    lx0, ly0, lx1, ly1 = measure(svg, vb)
    lw, lh = lx1 - lx0, ly1 - ly0
    side = lw / FILL                          # square that leaves the right margin
    cx, cy = (lx0 + lx1) / 2, (ly0 + ly1) / 2
    box = f"{cx - side/2:.3f} {cy - side/2:.3f} {side:.3f} {side:.3f}"
    print(f"leaf bbox {lw:.1f}x{lh:.1f} at ({lx0:.1f},{ly0:.1f}) -> icon viewBox {box}")

    icon = svg.replace(f'viewBox="{vb}"', f'viewBox="{box}"', 1)
    for out, size, bg in OUTPUTS:
        square = icon.replace("<svg ", f'<svg width="{size}" height="{size}" ', 1)
        if bg:
            square = square.replace(">", f'><rect x="-9999" y="-9999" width="99999" '
                                         f'height="99999" fill="{bg}"/>', 1)
        render(square, out, size, bg)
        im = Image.open(out)
        ink = im.convert("RGBA").getchannel("A").getbbox() if not bg else None
        print(f"wrote {out}  {im.size[0]}x{im.size[1]}"
              + (f"  ink {ink}" if ink else "  on white"))


if __name__ == "__main__":
    main()
