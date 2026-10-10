DELETE FROM member_plan_audit;
DELETE FROM member_details;
DELETE FROM sqlite_sequence WHERE name IN ('member_details', 'member_plan_audit');

INSERT INTO member_details (name, phone) VALUES
  ('Rahul Sharma',   '9876543210'),  -- id 1
  ('Anil Kumar',     '9812345678'),  -- id 2
  ('Priya Singh',    '9988776655'),  -- id 3
  ('Neha Verma',     '9871122334'),  -- id 4
  ('Amit Patel',     '9900112233'),  -- id 5
  ('Karan Malhotra', '9811100022');  -- id 6

INSERT INTO member_plan_audit
  (member_id, plan_duration, price, start_date, end_date, payment_done, payment_mode, paid_at)
VALUES
  -- Rahul: paid, 4 days left
  (1, 3, 3000,
   date('now','+5 hours','+30 minutes','-86 days'),
   date('now','+5 hours','+30 minutes','+4 days'),
   1, 'UPI', date('now','+5 hours','+30 minutes')),

  -- Anil: due today, unpaid
  (2, 1, 1000,
   date('now','+5 hours','+30 minutes','-30 days'),
   date('now','+5 hours','+30 minutes'),
   0, NULL, NULL),

  -- Priya: 5 days late, unpaid
  (3, 12, 9000,
   date('now','+5 hours','+30 minutes','-370 days'),
   date('now','+5 hours','+30 minutes','-5 days'),
   0, NULL, NULL),

  -- Neha: no plan rows at all

  -- Amit: two plans; the newer one should win (80 days left, not 70 days late)
  (5, 1, 1000,
   date('now','+5 hours','+30 minutes','-100 days'),
   date('now','+5 hours','+30 minutes','-70 days'),
   1, 'Cash', date('now','+5 hours','+30 minutes')),

  (5, 3, 2500,
   date('now','+5 hours','+30 minutes','-10 days'),
   date('now','+5 hours','+30 minutes','+80 days'),
   1, 'Cash', date('now','+5 hours','+30 minutes')),

  -- Karan: paid, ended 2 days ago, so Renew should be enabled
  (6, 1, 1000,
   date('now','+5 hours','+30 minutes','-32 days'),
   date('now','+5 hours','+30 minutes','-2 days'),
   1, 'UPI', date('now','+5 hours','+30 minutes'));