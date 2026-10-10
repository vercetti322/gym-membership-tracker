-- Migration number: 0001 	 2026-10-09T06:26:32.711Z
CREATE TABLE member_details (
  member_id  INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE member_plan_audit (
  audit_id        INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id       INTEGER NOT NULL REFERENCES member_details(member_id),

  -- plan snapshot: old rows keep what the member actually took
  plan_duration   INTEGER NOT NULL CHECK (plan_duration > 0),
  price           INTEGER NOT NULL CHECK (price > 0),

  -- 'YYYY-MM-DD' text, set by the app in IST
  start_date      TEXT NOT NULL,
  end_date        TEXT NOT NULL,

  -- payment
  payment_done    INTEGER NOT NULL DEFAULT 0 CHECK (payment_done IN (0, 1)),
  payment_mode    TEXT CHECK (payment_mode IN ('UPI', 'Cash', 'Other')),
  paid_at         TEXT,

  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (end_date >= start_date),
  
  CHECK (
    (payment_done = 0 AND payment_mode IS NULL AND paid_at IS NULL) OR
    (payment_done = 1 AND payment_mode IS NOT NULL AND paid_at IS NOT NULL)
  )
);

CREATE INDEX idx_audit_member_end ON member_plan_audit (member_id, end_date);