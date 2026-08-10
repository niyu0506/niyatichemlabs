# How to edit this website

You don't need to install anything. Everything here is done in a web browser, on
github.com, by clicking buttons.

The site is built from plain text files. You edit a file, click **Commit changes**, and a
minute or two later the live site updates.

---

## The 30-second version

1. Go to the file you want to change (links below).
2. Click the **pencil icon** (✏️) at the top right of the file.
3. Change the text.
4. Scroll down, click the green **Commit changes...** button, then **Commit changes** again.
5. Wait ~2 minutes, then refresh the website.

That's it. If you make a mistake, nothing is lost — every version is saved and can be
restored.

---

## Where everything lives

| What you want to change | File to edit |
|---|---|
| Phone number, email, address, company name | `hugo.toml` |
| The stats strip (FSSAI, 100%, COA, 1 kg+) | `hugo.toml` |
| Home page headline and section text | `layouts/index.html` |
| "About Us" page | `content/about.md` |
| "Quality" page | `content/certification.md` |
| "Contact" page intro | `content/contact.md` |
| Products intro text | `content/products/_index.md` |
| An individual product | `content/products/<product-name>.md` |
| Product photos | `static/img/products/` |

---

## Changing the phone number or email

Open **`hugo.toml`**. Near the middle you'll see:

```toml
phone       = "+91 70457 17020"
email       = "niyatichemlabs@gmail.com"
whatsapp    = "917045717020"        # digits only, for the wa.me link

fssai       = "11523011000215"      # FSSAI licence number, printed on our packs
```

The registered address sits just below, under `[params.address]`:

```toml
[params.address]
  unit1Label = "Registered Office"
  unit1 = "M/404, Panchsheel Gardens, Mahavir Nagar, Kandivali West, Mumbai — 400067"
  mapQuery = "M/404 Panchsheel Gardens, Mahavir Nagar, Kandivali West, Mumbai 400067"
```

`mapQuery` is what the map on the Contact page searches for, and what the
"Get directions" link opens. Change both `unit1` and `mapQuery` together.

Change what's inside the quotes. Keep the quotes. Commit.

These values are used everywhere on the site at once — the top bar, the footer, the contact
page, the WhatsApp button. You only change them in this one place.

---

## Adding a new product

**Step 1 — upload the photo.**

Go to `static/img/products/` → click **Add file** → **Upload files** → drag your photo in →
**Commit changes**.

Use a photo of the product on a plain white background, roughly 600 × 900 pixels (taller
than it is wide). Name it in lowercase with dashes, e.g. `ashwagandha-tablet.jpg`.

**Step 2 — create the product page.**

Go to `content/products/` → click **Add file** → **Create new file**.

Name it after the product, lowercase with dashes and ending in `.md`, e.g.
`ashwagandha-tablet.md`.

Then open `archetypes/products.md` in another tab, copy the whole thing, paste it into your
new file, and fill it in. Here is what a filled-in one looks like:

```yaml
---
title: "Ashwagandha Tablet"
category: "tablets"
tagline: "Stress & Vitality"
image: "img/products/ashwagandha-tablet.jpg"
weight: 200
featured: false

summary: "A single-herb Ashwagandha tablet standardised on withanolides, traditionally used to support the body's response to stress."

composition_note: "Each tablet contains 500 mg"
composition:
  - name: "Ashwagandha Ext. (Withania somnifera)"
    qty: "500 mg"

benefits:
  - "May help support the body's natural response to stress."
  - "May help support healthy energy levels."

usage: "One tablet twice a day after meals, or as directed by a healthcare practitioner."
caution: "Pregnant or lactating women should use herbal products only under the advice of a healthcare practitioner."
---

## About this formulation

Write your longer description here, in normal sentences.

## Manufacturing and supply

Available for third-party and private-label manufacturing.
```

Click **Commit changes**. The product appears in the catalogue automatically — you do not
need to add it to any list or menu.

### The rules that matter

- Keep the `---` lines at the top and bottom of the settings block.
- Keep every value **inside double quotes**.
- Never use the Tab key for indentation — use spaces. (Two spaces, as shown above.)
- `category:` must be exactly one of:
  `nutraceutical`, `api`, `excipient` (raw materials) or
  `capsules`, `tablets`, `oils`, `other` (finished formulations).
- `weight:` controls the order. Lower numbers come first.
- `featured: true` also shows it on the home page.

---

## Adding a new page to the navigation bar

Go to `content/` → **Add file** → **Create new file** → name it e.g. `export.md`.

Paste this in:

```yaml
---
title: "Export"
heading: "Export & international supply"
intro: "One sentence that appears under the heading."
menus: "main"
weight: 45
---

## Countries we ship to

Write your page content here in normal paragraphs.
```

The line `menus: "main"` is what puts it in the navbar. `weight` decides where — the existing
items are Home 10, About 20, Products 30, Quality 40, Contact 50, so `45` would place it
between Quality and Contact.

---

## Adding a new product category

Open `hugo.toml`, find the `[[params.categories]]` blocks near the bottom, and copy one:

```toml
[[params.categories]]
  key      = "syrups"
  division = "formulations"     # or "raw-materials"
  name     = "Syrups"
  icon     = "leaf"
  blurb    = "Herbal syrups and health juices."
```

Then use `category: "syrups"` in your product files. The filter buttons, the menu dropdown
and the home page cards all pick it up automatically.

---

## Formatting text

Inside the part of the file *below* the second `---`:

| To get | Type |
|---|---|
| A heading | `## My heading` |
| **Bold** | `**bold text**` |
| *Italic* | `*italic text*` |
| A bullet list | `- first item` on its own line |
| A link | `[click here](https://example.com)` |

Leave a blank line between paragraphs, otherwise they run together.

---

## If something breaks

Nothing is ever permanently broken. To undo:

1. Click the **History** button (top right of any file, or on the repo home page).
2. Find the change you want to undo.
3. Click the `...` menu → **Revert**.

If the site stops updating, the most likely cause is a typo in a settings block — usually a
missing quote mark, or a Tab used instead of spaces. Check the most recent file you edited.

---

## Turning the contact form on

The Contact page currently shows WhatsApp / email / phone buttons instead of a form,
because a form needs a service behind it to actually deliver the messages.

Everything is already built — to switch it on, add these three lines under `[params]`
in `hugo.toml` once you have signed up with a form service (see `setup/README.md`):

```toml
enableContactForm = true
formEndpoint      = "https://api.web3forms.com/submit"
formAccessKey     = "your-access-key-here"
```

Set `enableContactForm = false` to go back to the buttons.

---

## A note on how this site publishes

Right now the finished website files are committed into the `docs/` folder, and GitHub Pages
serves the site from there. That means **someone needs to rebuild the site after content
changes** for them to appear live.

There's a ready-made file at `setup/github-pages-workflow.yml` that switches this to fully
automatic — after that, every commit rebuilds and publishes the site on its own, with no
further action. See `setup/README.md` for the one-time, two-minute setup.
