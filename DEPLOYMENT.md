# Deployment Guide (this fix pass)

## Pre-flight (do this first)
```bash
wrangler login
wrangler d1 list                      # find your real allfreecalculators-db ID
# put the real database_id into wrangler.toml (currently a placeholder)
```

## 1. Apply the new migration
```bash
wrangler d1 execute allfreecalculators-db --remote --file=migrations/0002_email_verifications.sql
wrangler d1 execute allfreecalculators-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='email_verifications';"
```

## 2. Confirm required secrets are set (see wrangler.toml header comments)
```bash
wrangler pages secret put JWT_SECRET
wrangler pages secret put PASSWORD_PEPPER
# optional, only if used: RESEND_API_KEY, RAZORPAY_KEY_ID/SECRET, STRIPE_SECRET_KEY, etc.
```

## 3. Deploy
```bash
wrangler pages deploy . --project-name=allfreecalculators
```

## 4. Post-deploy smoke tests
```bash
# Signup (expect JSON success, cfc_session cookie set, no D1_ERROR)
curl -i -c cookies.txt -X POST https://allfreecalculators.in/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test.user+qa@gmail.com","password":"TestPass123"}'

# Login
curl -i -c cookies.txt -X POST https://allfreecalculators.in/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test.user+qa@gmail.com","password":"TestPass123"}'

# Session check (should return the same user, not another user's data)
curl -i -b cookies.txt https://allfreecalculators.in/api/auth/me

# Logout
curl -i -b cookies.txt -X POST https://allfreecalculators.in/auth/logout

# Confirm session cleared
curl -i -b cookies.txt https://allfreecalculators.in/api/auth/me   # expect 401

# robots.txt sanity
curl -s https://allfreecalculators.in/robots.txt | grep -i auth
```

## 5. What to check manually in Search Console (cannot be automated from this sandbox)
- Sitemaps report: confirm only the 7 current sitemaps are tracked; remove any stale `sitemap-finance.xml` / `sitemap-health.xml` / `sitemap-currency.xml` entries if still listed there from an old deployment.
- URL Inspection on `/auth/login`: after a few days post-deploy, re-request; it should move from "Not found (404)" toward "Excluded by robots.txt" (expected/intentional, not an error).
- Export the "Alternative page with proper canonical" (505) and "Duplicate, Google chose different canonical" (25) tables to CSV and send them over for per-URL classification per `SEO-AUDIT-REPORT.md`.
