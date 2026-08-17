-- Migration 0003: adds tables needed for full admin panel functionality
-- (Newsletter Subscribers, Announcements, Social Media Settings, Two-Factor Auth)
-- Safe/idempotent: uses IF NOT EXISTS everywhere. Run after 0001 and 0002.

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'subscribed',
  source TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  unsubscribed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  is_active INTEGER NOT NULL DEFAULT 1,
  starts_at TEXT,
  ends_at TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);

CREATE TABLE IF NOT EXISTS social_media_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  platform TEXT NOT NULL,
  url TEXT,
  handle TEXT,
  is_visible INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_media_platform ON social_media_settings(platform);

CREATE TABLE IF NOT EXISTS two_factor_auth (
  user_id TEXT PRIMARY KEY,
  secret TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  backup_codes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  verified_at TEXT
);

CREATE TABLE IF NOT EXISTS rate_limit_events (
  id TEXT PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  route TEXT NOT NULL,
  hits INTEGER NOT NULL DEFAULT 1,
  window_start TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_route ON rate_limit_events(ip_hash, route);
