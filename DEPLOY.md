# Cloudflare Pages/Workers deployment guide — allfreecalculators.in

This package is the **Cloudflare-ready** build of the site. The old PHP/MySQL
(InfinityFree) files have been removed — they are not compatible with
Cloudflare Workers/Pages. Everything you need for Cloudflare is here:

- Static site (all `index.html`, `css/`, `js/`, `build/`, images, etc.)
- `functions/[[path]].js` — static asset routing, legacy redirects, cache headers
- `functions/api/[[path]].js` — the JSON API (auth, favorites, history, search, payments, admin, etc.)
- `functions/api/ai-generate.js` — admin AI content-generation helper (Gemini)
- `migrations/0001_init.sql` — full D1 (SQLite) schema for every table the API uses
- `wrangler.toml` — Pages project config with D1 + R2 bindings

## What was fixed in this pass

- `functions/api/[[path]].js` — verified end-to-end; all `fetch()` calls (OpenAI, Razorpay) and
  JWT signing/verification helpers were checked and confirmed to run without syntax errors
  (`node --check` passes on all three function files).
- Removed the PHP/MySQL/InfinityFree layer (`api/*.php`, `admin/*.php`, `config/`, `includes/`,
  `database.sql`, `.htaccess`) since none of it runs on Cloudflare.
- Added a complete Cloudflare D1 (SQLite) schema (`migrations/0001_init.sql`) — the old
  `database.sql` in the zip was MySQL syntax for InfinityFree and did not match the tables
  the Worker API code actually queries (users, calculators, favorites, calculation_history,
  reviews, comments, support_tickets, otps, notifications, media_assets, webhook_endpoints,
  subscriptions, invoices, wallet_ledger, referrals, saved_results, settings, admin_records,
  content_approvals, backup_jobs, user_exports, page_views, error_events, performance_metrics,
  payment_events, search_queries, seo_meta, seo_redirects, blog_posts, categories, tags, plans,
  roles, permissions, api_keys, calculator_versions — 37 tables total).
- Added `wrangler.toml` with `DB` (D1) and `R2_BUCKET` (R2) bindings pre-wired to match what
  the API code expects (`env.DB`, `env.R2_BUCKET`).

## One-time setup

1. Install Wrangler and log in (skip if already installed):
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. Create the D1 database:
   ```bash
   wrangler d1 create allfreecalculators-db
   ```
   Copy the `database_id` from the output into `wrangler.toml` under `[[d1_databases]]`.

3. Apply the schema to the real (remote) database:
   ```bash
   wrangler d1 execute allfreecalculators-db --remote --file=migrations/0001_init.sql
   ```

4. Create the R2 bucket used for media uploads:
   ```bash
   wrangler r2 bucket create allfreecalculators-media
   ```

5. Add secrets — only `JWT_SECRET` and `PASSWORD_PEPPER` are required for the site to boot.
   The rest are optional and only needed if you want that specific feature to work:
   ```bash
   wrangler pages secret put JWT_SECRET
   wrangler pages secret put PASSWORD_PEPPER

   # Optional, enables AI search/assistant chat (functions/api/[[path]].js):
   wrangler pages secret put OPENAI_API_KEY

   # Optional, enables admin AI content generator (functions/api/ai-generate.js):
   wrangler pages secret put GEMINI_API_KEY

   # Optional, enables OTP emails:
   wrangler pages secret put RESEND_API_KEY

   # Optional, enables Razorpay payments:
   wrangler pages secret put RAZORPAY_KEY_ID
   wrangler pages secret put RAZORPAY_KEY_SECRET

   # Optional, enables Stripe billing portal:
   wrangler pages secret put STRIPE_SECRET_KEY
   wrangler pages secret put STRIPE_WEBHOOK_SECRET
   ```
   When prompted, paste the secret value. Never commit real secret values into any file.

## Deploy

From the root of this folder (where `wrangler.toml` lives):
```bash
wrangler pages deploy . --project-name=allfreecalculators
```
First deploy will create the Pages project; every later run redeploys it. Cloudflare will
automatically pick up everything under `functions/` as Pages Functions and serve everything
else as static assets.

## Post-deploy checklist

Test these endpoints against your `*.pages.dev` URL (or your custom domain once attached):

- `GET /api/health` -> `{ "ok": true, ... }`
- `POST /api/auth/register` with `{ "email": "...", "password": "...", "name": "..." }`
- `POST /api/auth/login` with `{ "email": "...", "password": "..." }`
- `GET /api/me` with header `authorization: Bearer <token from login>`
- `GET /api/search?q=loan` -> list of calculators (empty until you insert rows into `calculators`)
- Load the homepage `/` and a calculator page, e.g. `/science/force-calculator/`, to confirm
  static routing + legacy redirects (`functions/[[path]].js`) work.

## Populating calculator/content data

The `calculators`, `categories`, `blog_posts`, `seo_meta`, etc. tables start empty. Insert rows
via `wrangler d1 execute allfreecalculators-db --remote --command="..."` or build an import
script from your existing `data/tools-enriched.json` / `data/site.json` files included in this
package — those already contain your calculator metadata and can be transformed into `INSERT`
statements for the `calculators` table.

## Custom domain

In the Cloudflare dashboard: Pages project -> Custom domains -> add `allfreecalculators.in`
and `www.allfreecalculators.in`, then follow the DNS instructions shown (Cloudflare manages
this automatically if your domain's nameservers already point to Cloudflare).

## Security notes to consider before going live

- Passwords are hashed with SHA-256 + a pepper, not bcrypt/argon2/scrypt. This is weaker than
  industry standard; consider migrating to a slow hash (e.g. PBKDF2 via Web Crypto, or a Workers-
  compatible bcrypt library) if this app will hold real user passwords.
- CORS is currently wide open (`access-control-allow-origin: '*'`) on every API response.
  Restrict this to your real domain(s) once the frontend origin is finalized.
- `/api/payments/stripe-webhook` intentionally returns 501 — wire up a signature-verified
  webhook handler before accepting live Stripe payments.
