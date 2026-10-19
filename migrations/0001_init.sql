-- Migration number: 0001 	 2026-10-09T06:26:32.711Z
CREATE TABLE member_details (
  member_id  INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL UNIQUE,
  is_active  INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE member_plan_audit (
  audit_id        INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id       INTEGER NOT NULL REFERENCES member_details(member_id),

  -- plan snapshot: old rows keep what the member actually took
  plan_duration   INTEGER NOT NULL CHECK (plan_duration > 0),  -- months
  price           INTEGER NOT NULL CHECK (price > 0),

  -- 'YYYY-MM-DD' text, set by the app in IST
  -- start_date is also the payment date: the plan is paid when it starts
  start_date      TEXT NOT NULL,
  end_date        TEXT NOT NULL,

  payment_mode    TEXT NOT NULL CHECK (payment_mode IN ('UPI', 'Cash', 'Other')),

  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (end_date >= start_date)
);

CREATE INDEX idx_audit_member_end ON member_plan_audit (member_id, end_date);