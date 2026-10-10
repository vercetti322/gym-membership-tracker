export const GET_ALL_MEMBERS = `
  SELECT
    md.member_id                AS id,
    md.name,
    md.phone,
    mpa.plan_duration           AS planMonths,
    mpa.end_date                AS expiry,
    mpa.payment_done            AS paymentDone,
    mpa.paid_at                 AS paymentDate,
    mpa.payment_mode            AS paymentMode,
    CAST(
      julianday(mpa.end_date) -
      julianday(date('now', '+5 hours', '+30 minutes'))
      AS INTEGER
    )                           AS daysLeft
  FROM member_details AS md
  LEFT JOIN member_plan_audit AS mpa
    ON mpa.audit_id = (
      SELECT audit_id
      FROM member_plan_audit
      WHERE member_id = md.member_id
      ORDER BY end_date DESC LIMIT 1
    )
  ORDER BY md.name COLLATE NOCASE
`;

export const PERSIST_SESSION_TOKEN = `
  INSERT INTO sessions (id, expires_at) 
  VALUES (?, ?)
`;

export const DELETE_SESSION_TOKEN = `
  DELETE FROM sessions 
  WHERE id = ?
`;

export const GET_SESSION_TOKEN = `
  SELECT id 
  FROM sessions
  WHERE id = ? AND expires_at > ?
`;
