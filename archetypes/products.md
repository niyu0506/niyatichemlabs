---
# ─── Copy this file to add a new product ──────────────────────────────────
# 1. In content/products/, click "Add file" → "Create new file" on GitHub
# 2. Name it something like  my-new-product.md
# 3. Paste this whole block in, then fill it out and delete the lines you
#    don't need. Keep the --- fences at the top and bottom.

title: "New Product Name"          # shown as the page heading
category: "nutraceutical"          # raw materials: nutraceutical | api | excipient
                                   # formulations: capsules | tablets | syrups | oils | other
tagline: "What it supports"        # short line under the title, e.g. "Liver Care"
image: "img/products/my-photo.jpg" # upload the photo to static/img/products/ first
weight: 999                        # lower number = appears earlier in the list
featured: false                    # true = also shown on the home page

summary: "One sentence describing the product. This is the text shown on the product card."

composition_note: "Each tablet contains 500 mg"
composition:
  - name: "Herb Name (Botanical name)"
    qty: "50 mg"
  - name: "Another Herb (Botanical name)"
    qty: "25 mg"

benefits:
  - "May help support ..."
  - "May help support ..."

usage: "One tablet twice a day after meals, or as directed by a healthcare practitioner."
caution: "Pregnant or lactating women should use herbal products only under the advice of a healthcare practitioner."
---

## About this formulation

Write the longer description here. Anything below the closing `---` above is normal text —
just type paragraphs. Leave a blank line between paragraphs.

Use `**bold**` for emphasis and `## ` at the start of a line to make a new heading.

## Sourcing and documentation

Available in sample through to bulk quantities. Specification sheet supplied at quotation,
certificate of analysis with every consignment.
