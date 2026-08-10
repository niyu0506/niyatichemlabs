# One-time setup notes

## 1. Switch to fully automatic publishing (recommended, ~2 minutes)

Right now the built site is committed into `docs/` and GitHub Pages serves it from there.
That works, but it means the site has to be rebuilt by hand after content changes.

To make every commit rebuild and publish automatically:

1. On github.com, go to the repository home page.
2. Click **Add file** → **Create new file**.
3. In the filename box type exactly:
   ```
   .github/workflows/hugo.yml
   ```
   (Typing the `/` characters creates the folders for you.)
4. Open `setup/github-pages-workflow.yml` in another tab, copy its entire contents, and
   paste them into the new file.
5. Click **Commit changes**.
6. Go to **Settings** → **Pages**, and under *Build and deployment* change
   **Source** from `Deploy from a branch` to **GitHub Actions**.

Done. From then on, editing any `.md` file rebuilds and republishes the site by itself,
usually within about a minute. You can watch it happen under the **Actions** tab.

Once that's working, the `docs/` folder is no longer used and can be deleted.

> Why isn't this already set up? Adding files under `.github/workflows/` requires a
> permission that the account's current API token doesn't carry. Doing it in the browser,
> as above, works fine.

## 2. Point a custom domain at the site

Once the domain (e.g. `niyatichemlabs.in`) is registered:

1. At the DNS provider, create these records:

   | Type  | Name  | Value |
   |-------|-------|-------|
   | A     | `@`   | `185.199.108.153` |
   | A     | `@`   | `185.199.109.153` |
   | A     | `@`   | `185.199.110.153` |
   | A     | `@`   | `185.199.111.153` |
   | CNAME | `www` | `<github-username>.github.io.` |

2. In the repo: **Settings** → **Pages** → **Custom domain**, enter the domain, save.
3. Tick **Enforce HTTPS** once the certificate is issued (can take up to an hour).
4. Edit `hugo.toml` and change the first line to:
   ```toml
   baseURL = "https://niyatichemlabs.in/"
   ```

If the DNS is on Cloudflare, leave the records **DNS only** (grey cloud) until GitHub has
issued the certificate, then proxying can be turned on if desired.

## 3. Turn the contact form on

The Contact page currently shows WhatsApp / email / phone buttons rather than a form. A form
on a static site needs a third-party service behind it to deliver the messages — without one
a form looks functional but silently goes nowhere, which is worse than no form at all.

The form is already built and sitting behind a switch. To enable it:

1. Sign up at [web3forms.com](https://web3forms.com) — free, 250 submissions/month, no
   server needed. It emails each submission straight to an inbox. (Formspree's free tier,
   50/month, works the same way.)
2. Copy the access key they give you.
3. Add these three lines under `[params]` in `hugo.toml`:
   ```toml
   enableContactForm = true
   formEndpoint      = "https://api.web3forms.com/submit"
   formAccessKey     = "paste-the-access-key-here"
   ```
4. Rebuild and publish.

Setting `enableContactForm = false` (or deleting the line) switches back to the buttons.

**Send a test submission after enabling it** and confirm it arrives — the whole point of the
switch is that the form is never live unless it actually delivers.
