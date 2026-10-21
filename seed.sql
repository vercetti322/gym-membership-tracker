-- Reset the seed data. Existing member IDs will be recreated from 1.
DELETE FROM member_plan_audit;
DELETE FROM member_details;
DELETE FROM sqlite_sequence WHERE name IN ('member_details', 'member_plan_audit');

-- Seed 12 members. IDs correspond to insertion order (1 through 12).
INSERT INTO member_details (name, phone) VALUES
  ('Rahul Sharma',   '9876543210'), -- id 1
  ('Anil Kumar',     '9812345678'), -- id 2
  ('Priya Singh',    '9988776655'), -- id 3
  ('Neha Verma',     '9871122334'), -- id 4
  ('Amit Patel',     '9900112233'), -- id 5
  ('Karan Malhotra', '9811100022'), -- id 6
  ('Simran Kaur',    '9876501234'), -- id 7
  ('Manpreet Gill',  '9812304567'), -- id 8
  ('Harpreet Singh', '9988701234'), -- id 9
  ('Jaspreet Kaur',  '9871204567'), -- id 10
  ('Gurpreet Singh', '9900102345'), -- id 11
  ('Rohan Mehta',    '9811102345'); -- id 12

INSERT INTO member_plan_audit
  (member_id, plan_duration, price, start_date, end_date, payment_mode)
VALUES
  -- Rahul (id 1): 4 days left
  (1, 3, 3000,
   date('now', '+5 hours', '+30 minutes', '-86 days'),
   date('now', '+5 hours', '+30 minutes', '+4 days'),
   'UPI'),

  -- Anil (id 2): plan ends today
  (2, 1, 1000,
   date('now', '+5 hours', '+30 minutes', '-30 days'),
   date('now', '+5 hours', '+30 minutes'),
   'Cash'),

  -- Priya (id 3): plan ended 5 days ago
  (3, 12, 9000,
   date('now', '+5 hours', '+30 minutes', '-370 days'),
   date('now', '+5 hours', '+30 minutes', '-5 days'),
   'UPI'),

  -- Neha (id 4): deliberately has no plan rows

  -- Amit (id 5): older plan; should not be selected as the latest plan
  (5, 1, 1000,
   date('now', '+5 hours', '+30 minutes', '-100 days'),
   date('now', '+5 hours', '+30 minutes', '-70 days'),
   'Cash'),

  -- Amit (id 5): latest plan, 80 days left
  (5, 3, 2500,
   date('now', '+5 hours', '+30 minutes', '-10 days'),
   date('now', '+5 hours', '+30 minutes', '+80 days'),
   'Cash'),

  -- Karan (id 6): plan ended 2 days ago
  (6, 1, 1000,
   date('now', '+5 hours', '+30 minutes', '-32 days'),
   date('now', '+5 hours', '+30 minutes', '-2 days'),
   'UPI'),

  -- Simran (id 7): 14 days left
  (7, 3, 3000,
   date('now', '+5 hours', '+30 minutes', '-76 days'),
   date('now', '+5 hours', '+30 minutes', '+14 days'),
   'UPI'),

  -- Manpreet (id 8): 30 days left
  (8, 2, 2000,
   date('now', '+5 hours', '+30 minutes', '-30 days'),
   date('now', '+5 hours', '+30 minutes', '+30 days'),
   'Cash'),

  -- Harpreet (id 9): plan ended 15 days ago
  (9, 6, 6000,
   date('now', '+5 hours', '+30 minutes', '-195 days'),
   date('now', '+5 hours', '+30 minutes', '-15 days'),
   'UPI'),

  -- Jaspreet (id 10): 1 day left
  (10, 1, 1000,
   date('now', '+5 hours', '+30 minutes', '-29 days'),
   date('now', '+5 hours', '+30 minutes', '+1 day'),
   'Cash'),

  -- Gurpreet (id 11): 30 days left; paid using Other
  (11, 3, 2800,
   date('now', '+5 hours', '+30 minutes', '-60 days'),
   date('now', '+5 hours', '+30 minutes', '+30 days'),
   'Other'),

  -- Rohan (id 12): 45 days left
  (12, 6, 6000,
   date('now', '+5 hours', '+30 minutes', '-135 days'),
   date('now', '+5 hours', '+30 minutes', '+45 days'),
   'UPI');
