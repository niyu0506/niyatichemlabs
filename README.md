# Niyati Chemlabs — website

Static website for Niyati Chemlabs — a Mumbai-based supplier of active pharmaceutical
ingredients, nutraceutical raw materials and finished herbal formulations. Built with
[Hugo](https://gohugo.io) and hosted free on GitHub Pages.

## Editing the site

👉 **[HOW-TO-EDIT.md](HOW-TO-EDIT.md)** — a plain-English guide written for someone who has
never used GitHub. Everything is done in the browser; nothing needs to be installed.

## Layout of the repository

```
hugo.toml                  site settings — phone, email, address, menu, categories
content/
  _index.md                home page metadata
  about.md                 About Us
  certification.md         Quality
  raw-materials.md         Products → Raw Material   (URL /products/raw-materials/)
  formulations.md          Products → Finished Dosage Formulation
  enquiry.md               Enquiry — the enquiry / feedback form
  gallery.md               Gallery
  thank-you.md             post-submission page (unlisted)
  contact.md               Contact Us
  products/
    _index.md              catalogue hub — the two branches
    *.md                   one file per finished product
data/
  rawmaterials.yaml        the Raw Material catalogue (Sr No. / Product / Packing / CAS)
  gallery.yaml             the photo gallery
archetypes/products.md     template to copy when adding a product
layouts/                   HTML templates
assets/css/main.css        the entire design system
assets/js/main.js          menu, scroll animations, filters, gallery lightbox
static/img/products/       product photographs
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

Every commit triggers a Github action that publishes the updated website automatically.

## Design notes

- No third-party theme and no npm — the CSS and JS are hand-written and self-contained, so
  there is nothing to keep up to date and nothing that can break on a dependency update.
- Typography: Sora (headings) + Inter (body), loaded from Google Fonts.
- Colour: deep botanical green with a muted brass accent.
- Animations use `IntersectionObserver` and are disabled automatically for visitors who have
  "reduce motion" turned on.
- Fully responsive; the layout is designed mobile-first from 360 px upward.
