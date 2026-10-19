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
  (member_id, plan_duration, price, start_date, end_date, payment_mode)
VALUES
  -- Rahul: 4 days left
  (1, 3, 3000,
   date('now','+5 hours','+30 minutes','-86 days'),
   date('now','+5 hours','+30 minutes','+4 days'),
   'UPI'),

  -- Anil: plan ends today, so he is due today
  (2, 1, 1000,
   date('now','+5 hours','+30 minutes','-30 days'),
   date('now','+5 hours','+30 minutes'),
   'Cash'),

  -- Priya: plan ended 5 days ago (5 days late)
  (3, 12, 9000,
   date('now','+5 hours','+30 minutes','-370 days'),
   date('now','+5 hours','+30 minutes','-5 days'),
   'UPI'),

  -- Neha: no plan rows at all (tests the "No plan" badge)

  -- Amit: two plans; the newer one should win (80 days left)
  (5, 1, 1000,
   date('now','+5 hours','+30 minutes','-100 days'),
   date('now','+5 hours','+30 minutes','-70 days'),
   'Cash'),

  (5, 3, 2500,
   date('now','+5 hours','+30 minutes','-10 days'),
   date('now','+5 hours','+30 minutes','+80 days'),
   'Cash'),

  -- Karan: plan ended 2 days ago (2 days late)
  (6, 1, 1000,
   date('now','+5 hours','+30 minutes','-32 days'),
   date('now','+5 hours','+30 minutes','-2 days'),
   'UPI');