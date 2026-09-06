# Hariom Construction — Website

Plain HTML/CSS/JS site. No build step, no dependencies.

## Files

| File | Purpose |
|---|---|
| `index.html`, `about.html`, `services.html`, `projects.html`, `contact.html` | Site pages |
| `styles.css`, `main.js` | Shared styling and behaviour |
| `404.html` | Shown for any missing page |
| `_headers` | Cloudflare Pages security + caching headers |
| `_redirects` | Cloudflare Pages redirect rules (empty for now) |
| `robots.txt`, `sitemap.xml` | Search engine crawling |
| `wrangler.toml` | Config for CLI deploys with Wrangler |

## Deploy to Cloudflare Pages

**Option A — Dashboard, no CLI (fastest for a one-off deploy):**
1. Go to the Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Name the project (e.g. `hariom-construction`) and drag this whole folder into the upload area.
3. Deploy. You'll get a live URL at `<project-name>.pages.dev`.

**Option B — Git integration (recommended if you'll keep editing):**
1. Push this folder to a GitHub repository.
2. In the Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**, pick the repo.
3. Build settings: **Framework preset: None**, **Build command: (leave empty)**, **Build output directory: `/`**.
4. Deploy. Every future push to the connected branch redeploys automatically.

**Option C — CLI (Wrangler), for repeat deploys from your machine:**
```
npx wrangler pages deploy .
```
Run this from inside the project folder. First run will prompt you to log in and to confirm the project name.

## Custom domain (hariomconstruction.in)

1. Add `hariomconstruction.in` as a site in your Cloudflare account (Account Home → Add a domain) and update your domain's nameservers at your registrar to the two Cloudflare nameservers it gives you. This is required for an apex domain like `hariomconstruction.in` (not just a subdomain).
2. Once the zone is active, open your Pages project → **Custom domains** → **Set up a custom domain** → enter `hariomconstruction.in` → Activate.
3. Repeat for `www.hariomconstruction.in` if you want both to resolve.
4. Pick one as canonical (apex is simplest here, matching what's in `sitemap.xml` and `robots.txt`) and add a **Redirect Rule** (Cloudflare dashboard → your domain → **Rules → Redirect Rules**) sending the other to it with a 301, so you don't split traffic across two hostnames.
5. SSL/TLS mode: set to **Full** or **Full (strict)** under **SSL/TLS → Overview**.

DNS propagation can take a few minutes up to ~48 hours after the nameserver change.
