# D1 Migration Guide

## Migrations in this project
| File | Purpose | Destructive? |
|---|---|---|
| `migrations/0001_init.sql` | Base schema: users, roles, permissions, otps, api_keys, audit_logs, categories, tags, calculators, calculator_versions, blog_posts, seo_meta, seo_redirects, favorites, calculation_history, saved_results, reviews, comments, support_tickets, notifications, media_assets, plans, subscriptions, invoices, wallet_ledger, payment_events, referrals, webhook_endpoints, page_views, error_events | No (all `CREATE TABLE IF NOT EXISTS`) |
| `migrations/0002_email_verifications.sql` (new, this pass) | Adds `email_verifications` table required by `/auth/register` and `/auth/verify-email` in `functions/api/[[path]].js` | No — additive only, `IF NOT EXISTS`, does not touch `users` or any other existing table/data |

## Why the live error happened
The deployed Worker code (`functions/api/[[path]].js`) queries `email_verifications` in the signup flow, but the remote D1 database this project's `wrangler.toml` points to never had a migration creating that table — hence `D1_ERROR: no such table: email_verifications`.

## Schema added
```sql
CREATE TABLE IF NOT EXISTS email_verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  verified_at TEXT,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token_hash);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
```
- Token is stored **hashed** (`token_hash`, via `tokenHash()` in the Worker — SHA-256), never plaintext.
- `expires_at` is a unix-ms integer checked on every verify attempt; expired tokens are rejected.
- `used_at` prevents token replay (set once verification succeeds; a second attempt with the same token is rejected).
- `user_id` has `ON DELETE CASCADE` so deleting a user cleans up their verification rows automatically — compatible with existing `users` table PK type (`TEXT`).

## LOCAL DATABASE SCHEMA (this ZIP)
`migrations/0001_init.sql` + `migrations/0002_email_verifications.sql` (above). Confirmed present and idempotent in this codebase as of this fix pass.

## REMOTE PRODUCTION DATABASE
**REQUIRES USER INPUT.** This sandbox has no Cloudflare account/API token, so the actual `database_id` and remote schema state cannot be inspected here. `wrangler.toml` in this project currently has:
```
database_name = "allfreecalculators-db"
database_id = "REPLACE_WITH_YOUR_D1_DATABASE_ID"
```
The `REPLACE_WITH_YOUR_D1_DATABASE_ID` placeholder means this repo, as uploaded, was never bound to a real D1 database ID in `wrangler.toml`. Before deploying, you must:
1. Run `wrangler d1 list` to find your real `allfreecalculators-db` database ID (or `wrangler d1 create allfreecalculators-db` if it does not exist yet).
2. Put that ID into `wrangler.toml` under `database_id`.
3. Only then run the migration commands below against the correct database.

## Commands to apply and verify
```bash
# 1) Confirm which DB you are targeting
wrangler d1 list

# 2) Apply the new migration (safe, additive)
wrangler d1 execute allfreecalculators-db --remote --file=migrations/0002_email_verifications.sql

# 3) Verify the table now exists
wrangler d1 execute allfreecalculators-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='email_verifications';"

# 4) Verify indexes
wrangler d1 execute allfreecalculators-db --remote --command "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='email_verifications';"

# 5) Verify existing users are untouched
wrangler d1 execute allfreecalculators-db --remote --command "SELECT COUNT(*) FROM users;"
```
If step 1 shows a **different** existing production database than `allfreecalculators-db` (e.g. it was renamed, or `wrangler.toml` was edited after initial setup), substitute the real name/ID everywhere above — do not run this against a fresh/empty database or you will not fix the live error.

## Migration 0003: admin extras (newsletter, announcements, social, 2FA, rate limiting)

`migrations/0003_admin_extras.sql` adds five new, additive, idempotent (`IF NOT EXISTS`) tables used by the newer admin panel pages and public API routes:

| Table | Used by |
|---|---|
| `newsletter_subscribers` | `/admin/newsletter/`, `POST /api/newsletter/subscribe`, `POST /api/newsletter/unsubscribe` |
| `announcements` | `/admin/announcements/`, `GET /api/announcements/active`, sitewide banner in `js/afc-enhancements.js` |
| `social_media_settings` | `/admin/settings/social/` |
| `two_factor_auth` | `/admin/security/` 2FA enforcement toggle |
| `rate_limit_events` | reserved for future login/OTP abuse tracking |

Apply it the same way as migration 0002:
```bash
wrangler d1 execute allfreecalculators-db --remote --file=migrations/0003_admin_extras.sql

# Verify all five tables now exist
wrangler d1 execute allfreecalculators-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('newsletter_subscribers','announcements','social_media_settings','two_factor_auth','rate_limit_events');"
```
This migration is purely additive — it does not alter or drop any existing table, so it is safe to run on the live database at any time.
