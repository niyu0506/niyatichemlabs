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

## 3. Turn the enquiry form on

The **Enquiry** page carries the full enquiry / feedback form, but a static site cannot send
email on its own, so the form is inert (Submit greyed out, with a visible note saying so)
until a delivery service is configured. That is deliberate: a form that looks functional and
silently goes nowhere is worse than no form at all.

To enable it:

1. Go to [web3forms.com](https://web3forms.com) — free, 250 submissions/month, no server
   needed. Enter `niyatichemlabs@gmail.com`; they email an access key back.
   (Formspree's free tier, 50/month, works the same way — just change `formEndpoint` too.)
2. Paste the key into `hugo.toml`:
   ```toml
   formEndpoint  = "https://api.web3forms.com/submit"
   formAccessKey = "paste-the-access-key-here"
   ```
3. Rebuild and publish.

Emptying `formAccessKey` again switches the form back off. On success the visitor is sent to
`/thank-you/`, which is already built. A hidden `botcheck` honeypot field is included; Web3Forms
discards any submission that fills it.

**Send a test submission after enabling it** and confirm it arrives — the whole point of the
switch is that the form is never live unless it actually delivers.
