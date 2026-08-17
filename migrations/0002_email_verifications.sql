-- ============================================================
-- allfreecalculators.in - Cloudflare D1 migration 0002
-- Adds email_verifications table required by /auth/register (/auth/signup)
-- and /auth/verify-email in functions/api/[[path]].js.
-- Safe to run multiple times (IF NOT EXISTS). Does NOT touch existing
-- users, favorites, history, or any other production data.
-- Apply with:
--   wrangler d1 execute <DB_NAME> --remote --file=migrations/0002_email_verifications.sql
-- ============================================================

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
