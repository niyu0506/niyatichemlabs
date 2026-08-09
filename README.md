# Niyati Chem Labs — website

Static website for Niyati Chem Labs, built with [Hugo](https://gohugo.io) and hosted free on
GitHub Pages.

**Live site:** https://keivan.in/niyatichemlabs/

> ⚠️ This is a **mock-up for review**. The product range, photographs and company details are
> placeholders carried over from a sister company's catalogue so that the design can be
> evaluated with realistic content. Phone numbers are fictional. Real products, photos and
> details are to be substituted before this goes live on a real domain.

---

## Editing the site

👉 **[HOW-TO-EDIT.md](HOW-TO-EDIT.md)** — a plain-English guide written for someone who has
never used GitHub. Everything is done in the browser; nothing needs to be installed.

## Layout of the repository

```
hugo.toml                  site settings — phone, email, address, menu, categories
content/
  _index.md                home page metadata
  about.md                 About Us
  certification.md         Certification
  contact.md               Contact
  products/
    _index.md              catalogue intro
    *.md                   one file per product
archetypes/products.md     template to copy when adding a product
layouts/                   HTML templates
assets/css/main.css        the entire design system
assets/js/main.js          menu, scroll animations, product filter
static/img/products/       product photographs
static/img/cert/           certificate scans
docs/                      the built site — this is what GitHub Pages serves
setup/                     one-time setup notes (auto-deploy, custom domain, form)
```

## Working on it locally (optional)

```bash
# install Hugo extended, then:
hugo server -D          # live preview at http://localhost:1313
hugo --gc --minify      # rebuild docs/ for publishing
```

Hugo **extended** v0.148.1 or newer is required.

## How it publishes

The built site is committed to `docs/`, and GitHub Pages serves that folder from the `main`
branch. This means content changes need a rebuild to appear.

`setup/README.md` explains how to switch to a GitHub Actions build, after which every commit
publishes automatically.

## Design notes

- No third-party theme and no npm — the CSS and JS are hand-written and self-contained, so
  there is nothing to keep up to date and nothing that can break on a dependency update.
- Typography: Sora (headings) + Inter (body), loaded from Google Fonts.
- Colour: deep botanical green with a muted brass accent.
- Animations use `IntersectionObserver` and are disabled automatically for visitors who have
  "reduce motion" turned on.
- Fully responsive; the layout is designed mobile-first from 360 px upward.
