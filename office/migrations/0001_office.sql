CREATE TABLE IF NOT EXISTS office_state (
  user_email TEXT NOT NULL,
  section TEXT NOT NULL CHECK (section IN ('workspace', 'operations', 'business')),
  payload TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_email, section)
);

CREATE TABLE IF NOT EXISTS office_photos (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  report_id TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  image_base64 TEXT NOT NULL,
  byte_length INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS office_photos_report_idx
  ON office_photos (user_email, report_id, created_at);

CREATE TABLE IF NOT EXISTS office_reminder_log (
  user_email TEXT NOT NULL,
  reminder_key TEXT NOT NULL,
  channel TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_email, reminder_key, channel)
);

