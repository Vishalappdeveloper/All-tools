# CHANGELOG — Production Auth + SEO Repair

## [Unreleased] — this fix pass

### Fixed
- **Signup D1 error** (`no such table: email_verifications`): added `migrations/0002_email_verifications.sql`, wired into `/auth/register` (aliased `/auth/signup`).
- **Raw DB errors leaking to users**: added `safeError()` wrapper in `functions/api/[[path]].js`; all auth routes now catch DB failures and return generic messages instead of raw D1/SQLITE errors. Actual error is only in server logs.
- **Dashboard always showing logged-out**: `js/afc-auth.js` called `/api/me.php` (does not exist in this codebase) instead of `/api/auth/me`. Fixed endpoint.
- **Session cookie not sent**: `login/index.html` and `signup/index.html` fetch calls lacked `credentials:'same-origin'`, so the `cfc_session` cookie set by the Worker was never stored/sent back. Added.
- **`/auth/login` 404 in Search Console**: confirmed intentional API endpoint (POST-only, JSON), not an HTML page. Added `Disallow: /auth/` to `robots.txt` so Google stops treating it as a crawlable page. This does NOT retroactively clear the already-recorded 404 in GSC — that clears only after Google recrawls (see SEO-AUDIT-REPORT.md).
- **Email validation**: added matching server-side `isValidEmail()` in the Worker so backend cannot reject an email the frontend regex already accepted.
- **Duplicate sitemap URLs**: removed duplicate `<url>` entries across `sitemap-*.xml` (see SITEMAP-AUDIT.md).
- **Homepage malformed H1/canonical/body markup**: corrected in `index.html` (carried over from prior fix pass).

### Added
- `/auth/logout` endpoint (clears `cfc_session` cookie, writes `audit_logs` entry).
- `/auth/verify-email` endpoint (hashed token lookup, expiry check, one-time use, replay protection).
- `/auth/me` alias to existing `/me` (session-authoritative user lookup, no hardcoded emails).
- Helpers in `functions/api/[[path]].js`: `getCookie`, `sessionCookieHeader`, `clearSessionCookieHeader`, `verifyJwt`, `tokenHash`, `safeError`.
- `llms.txt` for AEO/GEO discoverability.

### Verified, not changed (already correct — no fake fix applied)
- `js/firebase.js` / `js/firebase-config.js`: Firebase disabled by default (`FIREBASE_CONFIG=null`), attaches no login/signup override listeners. `CALCVERSE_ADMIN_EMAILS` is read only by the admin panel's client-side "forgot password" convenience link — not the user dashboard identity path. No fix needed.
- `robots.txt`: already disallowed `/admin/`, `/login/`, `/signup/`, `/account/`, `/dashboard/`, `/api/`, etc.
- Sitemaps: contained zero private/auth/admin URLs prior to this pass.
- `migrations/0001_init.sql` `users` table: compatible with new `email_verifications.user_id` foreign key.

### Known limitation of this pass
No live Cloudflare/D1/GSC access exists in this environment. Every fix is verified by static code inspection + `node --check` syntax validation, not a live production request/response cycle. Apply/verify commands are in `DEPLOY.md` and `D1-MIGRATION.md`.
