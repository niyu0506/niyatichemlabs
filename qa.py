#!/usr/bin/env python3
"""Post-build QA for the generated site in docs/.

Checks that every internal link resolves, every image exists, no sister-company
branding leaked through, and every product page has its expected pieces.
"""
import os, re, sys, glob
from urllib.parse import urlparse, unquote

ROOT = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(ROOT, "docs")
BASE = "/niyatichemlabs"          # GitHub Pages project path

problems = []
def bad(kind, where, detail):
    problems.append((kind, where, detail))

html_files = glob.glob(os.path.join(DOCS, "**", "*.html"), recursive=True)
if not html_files:
    print("FAIL: no HTML in docs/ — run `hugo` first")
    sys.exit(1)


def resolve(url, page):
    """Map an in-page URL to a path on disk, or None if it isn't a local page."""
    u = urlparse(url)
    if u.scheme or u.netloc:
        return None                                  # external
    path = unquote(u.path)
    if not path:
        return None                                  # pure #fragment or ?query
    if path.startswith(BASE + "/"):
        path = path[len(BASE):]
    elif not path.startswith("/"):
        path = os.path.join("/" + os.path.relpath(os.path.dirname(page), DOCS), path)
    cand = os.path.normpath(os.path.join(DOCS, path.lstrip("/")))
    if os.path.isdir(cand):
        cand = os.path.join(cand, "index.html")
    return cand


for f in html_files:
    rel = os.path.relpath(f, DOCS)
    src = open(f, encoding="utf-8", errors="replace").read()

    # 1. brand leakage
    for m in re.finditer(r"(?i)panacea", src):
        seg = src[max(0, m.start() - 60):m.start() + 60].replace("\n", " ")
        bad("BRAND-LEAK", rel, seg)

    # NB: the build is minified, so attributes may be unquoted (src=/a/b.jpg).
    # Matching only quoted values silently misses most of them.
    def attr_values(name):
        pat = r'\b%s=(?:"([^"]*)"|\'([^\']*)\'|([^\s>]+))' % name
        for m in re.finditer(pat, src):
            yield m.group(1) or m.group(2) or m.group(3) or ""

    # 2. links
    for url in attr_values("href"):
        if not url or url.startswith(("mailto:", "tel:", "#", "data:", "javascript:")):
            continue
        p = resolve(url, f)
        if p and not os.path.exists(p):
            bad("DEAD-LINK", rel, url)

    # 3. images / scripts / styles
    for url in attr_values("src"):
        if not url or url.startswith(("data:", "http://", "https://", "//")):
            continue
        p = resolve(url, f)
        if p and not os.path.exists(p):
            bad("MISSING-ASSET", rel, url)

    # 4. obvious template accidents
    if "<no value>" in src or "ZgotmplZ" in src:
        bad("TEMPLATE-ERR", rel, "<no value> or ZgotmplZ in output")

# 5. every product .md produced a page, with the expected furniture
md = sorted(glob.glob(os.path.join(ROOT, "content", "products", "*.md")))
md = [m for m in md if not m.endswith("_index.md")]
for m in md:
    slug = os.path.basename(m)[:-3]
    page = os.path.join(DOCS, "products", slug, "index.html")
    if not os.path.exists(page):
        bad("NO-PAGE", slug, "product markdown did not render")
        continue
    s = open(page, encoding="utf-8", errors="replace").read()
    if "product-hero__media" not in s:
        bad("NO-IMAGE-BLOCK", slug, "product hero media missing")
    if "spec-table" not in s:
        bad("NO-COMPOSITION", slug, "no composition table rendered")
    # NB: the build is minified, so attribute values may be unquoted — match bare.
    if "eyebrow" not in s:
        bad("NO-CATEGORY", slug, "category eyebrow missing — bad category key?")

# 6. required top-level pages
for want in ["index.html", "about/index.html", "certification/index.html",
             "contact/index.html", "products/index.html", "404.html"]:
    if not os.path.exists(os.path.join(DOCS, want)):
        bad("MISSING-PAGE", want, "expected page not built")

# ── report ────────────────────────────────────────────────────────────────
by_kind = {}
for k, w, d in problems:
    by_kind.setdefault(k, []).append((w, d))

print(f"scanned {len(html_files)} pages, {len(md)} products\n")
if not problems:
    print("✅ QA clean — no dead links, missing assets, or brand leakage")
    sys.exit(0)

for k in sorted(by_kind):
    items = by_kind[k]
    print(f"❌ {k} ({len(items)})")
    seen = set()
    for w, d in items:
        key = (w, d)
        if key in seen:
            continue
        seen.add(key)
        print(f"     {w}: {d}")
    print()
sys.exit(1)
