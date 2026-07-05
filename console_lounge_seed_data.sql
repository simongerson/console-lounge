-- ============================================================
-- CONSOLE LOUNGE MANAGER — SEED DATA
-- Run this in phpMyAdmin → console_lounge → SQL tab
-- This seeds realistic test data for a Kenyan gaming lounge
-- ============================================================

-- Clear existing data first (safe order to avoid FK conflicts)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE debts;
TRUNCATE TABLE cash_outs;
TRUNCATE TABLE expenses;
TRUNCATE TABLE game_sessions;
TRUNCATE TABLE shifts;
TRUNCATE TABLE session_rates;
TRUNCATE TABLE consoles;
TRUNCATE TABLE staff;
TRUNCATE TABLE owners;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. OWNER
-- Login: admin@consolelounge.co.ke / password: admin1234
-- Password hash below = "admin1234"
-- ============================================================

INSERT INTO owners (id, name, email, password) VALUES (
  'owner-001',
  'Brian Kamau',
  'admin@consolelounge.co.ke',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
);

-- ============================================================
-- 2. STAFF
-- All PINs below are plain text for reference.
-- The API hashes PINs on creation, so for seed data we store
-- bcrypt hashes. Use the Reset PIN feature in the app to
-- change any PIN after seeding.
--
-- Staff PINs (use these to test login at /pos):
--   Mercy Wanjiku   → 1234
--   Kevin Odhiambo  → 2345
--   Sharon Akinyi   → 3456
--   Dennis Mutua    → 4567
-- ============================================================

INSERT INTO staff (id, name, pin, role, is_active, pin_attempts) VALUES
  ('staff-001', 'Mercy Wanjiku',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPZsjOViAee', 'manager', 1, 0),
  ('staff-002', 'Kevin Odhiambo', '$2a$10$Nzr5HxPJJKJN2GjOSBmz4O8T5F8g1WtD1D4uNJzKC3JoOWVOfbYDm', 'staff',   1, 0),
  ('staff-003', 'Sharon Akinyi',  '$2a$10$2A8mBo0nBmBm9K8A8mBnxO8D7G9h2XuE2E5vOKzLC4KpPXWPGcZEm', 'staff',   1, 0),
  ('staff-004', 'Dennis Mutua',   '$2a$10$3B9nCp1oCnCn0L9B9nCoyP9E8H0i3YvF3F6wPLaLMD5LqQYQHdAFn', 'staff',   0, 0);

-- ============================================================
-- 3. CONSOLES — 10 BAYS
-- Mix of PS5 and PS4 like a real Kenyan lounge
-- ============================================================

INSERT INTO consoles (id, name, console_type, status, is_active, sort_order) VALUES
  ('con-001', 'Bay 1',  'PS5', 'open', 1, 1),
  ('con-002', 'Bay 2',  'PS5', 'open', 1, 2),
  ('con-003', 'Bay 3',  'PS5', 'open', 1, 3),
  ('con-004', 'Bay 4',  'PS4', 'open', 1, 4),
  ('con-005', 'Bay 5',  'PS4', 'open', 1, 5),
  ('con-006', 'Bay 6',  'PS4', 'open', 1, 6),
  ('con-007', 'Bay 7',  'PS4', 'open', 1, 7),
  ('con-008', 'Bay 8',  'PS4', 'open', 1, 8),
  ('con-009', 'Bay 9',  'PS4', 'open', 1, 9),
  ('con-010', 'Bay 10', 'PS4', 'open', 1, 10);

-- ============================================================
-- 4. SESSION RATES
-- ============================================================

INSERT INTO session_rates (id, name, pricing_type, price, price_per_game, duration_minutes, free_after_games, avg_minutes_per_game, is_active, sort_order) VALUES
  ('rate-001', '30 Minutes',  'time',     50,  0,  30,  0, 0,  1, 1),
  ('rate-002', '1 Hour',      'time',     100, 0,  60,  0, 0,  1, 2),
  ('rate-003', '2 Hours',     'time',     180, 0,  120, 0, 0,  1, 3),
  ('rate-004', 'Full Day',    'time',     500, 0,  480, 0, 0,  1, 4),
  ('rate-005', 'FC 26',       'per_game', 0,   50, NULL,5, 20, 1, 5),
  ('rate-006', 'NBA 2K25',    'per_game', 0,   50, NULL,5, 20, 1, 6),
  ('rate-007', 'Call of Duty','time',     200, 0,  60,  0, 0,  1, 7),
  ('rate-008', 'GTA Online',  'time',     200, 0,  60,  0, 0,  1, 8);

-- ============================================================
-- 5. SHIFTS
-- 3 closed shifts (past days) + 1 open shift (today)
-- ============================================================

-- Shift 1 — Monday, closed, Mercy
INSERT INTO shifts (id, staff_id, float_amount, cash_declared, mpesa_declared, opened_at, closed_at) VALUES
  ('shift-001', 'staff-001', 500, 3200, 1500, '2025-06-23 09:00:00', '2025-06-23 21:00:00');

-- Shift 2 — Tuesday, closed, Kevin
INSERT INTO shifts (id, staff_id, float_amount, cash_declared, mpesa_declared, opened_at, closed_at) VALUES
  ('shift-002', 'staff-002', 500, 2800, 900,  '2025-06-24 09:00:00', '2025-06-24 21:00:00');

-- Shift 3 — Wednesday, closed, Sharon
INSERT INTO shifts (id, staff_id, float_amount, cash_declared, mpesa_declared, opened_at, closed_at) VALUES
  ('shift-003', 'staff-003', 500, 4100, 2200, '2025-06-25 09:00:00', '2025-06-25 21:00:00');

-- Shift 4 — Today, OPEN, Mercy (no closed_at — this is the active shift)
INSERT INTO shifts (id, staff_id, float_amount, opened_at) VALUES
  ('shift-004', 'staff-001', 500, NOW() - INTERVAL 3 HOUR);

-- ============================================================
-- 6. GAME SESSIONS
-- Past sessions on closed shifts + active sessions on today's shift
-- ============================================================

-- ── MONDAY SESSIONS (shift-001) ──────────────────────────

INSERT INTO game_sessions (id, console_id, shift_id, staff_id, rate_id, customer_name, customer_phone, amount, payment_method, status, started_at, ended_at, duration_minutes) VALUES
  ('gs-001', 'con-001', 'shift-001', 'staff-001', 'rate-002', 'James Njoroge',  '0712345678', 100, 'cash',  'completed', '2025-06-23 09:30:00', '2025-06-23 10:30:00', 60),
  ('gs-002', 'con-002', 'shift-001', 'staff-001', 'rate-005', 'Brian Otieno',   '0723456789', 200, 'mpesa', 'completed', '2025-06-23 10:00:00', '2025-06-23 11:30:00', 90),
  ('gs-003', 'con-003', 'shift-001', 'staff-001', 'rate-001', NULL,             NULL,          50,  'cash',  'completed', '2025-06-23 10:15:00', '2025-06-23 10:45:00', 30),
  ('gs-004', 'con-004', 'shift-001', 'staff-001', 'rate-003', 'Peter Kamau',    '0734567890', 180, 'cash',  'completed', '2025-06-23 11:00:00', '2025-06-23 13:00:00', 120),
  ('gs-005', 'con-005', 'shift-001', 'staff-001', 'rate-007', 'Grace Wambui',   '0745678901', 200, 'mpesa', 'completed', '2025-06-23 11:30:00', '2025-06-23 12:30:00', 60),
  ('gs-006', 'con-001', 'shift-001', 'staff-001', 'rate-002', NULL,             NULL,          100, 'cash',  'completed', '2025-06-23 12:00:00', '2025-06-23 13:00:00', 60),
  ('gs-007', 'con-006', 'shift-001', 'staff-001', 'rate-006', 'Samuel Kiprop',  '0756789012', 150, 'cash',  'completed', '2025-06-23 13:30:00', '2025-06-23 14:30:00', 60),
  ('gs-008', 'con-007', 'shift-001', 'staff-001', 'rate-002', 'Faith Achieng',  '0767890123', 100, 'mpesa', 'completed', '2025-06-23 14:00:00', '2025-06-23 15:00:00', 60),
  ('gs-009', 'con-002', 'shift-001', 'staff-001', 'rate-003', NULL,             NULL,          180, 'cash',  'completed', '2025-06-23 15:00:00', '2025-06-23 17:00:00', 120),
  ('gs-010', 'con-008', 'shift-001', 'staff-001', 'rate-008', 'Victor Maina',   '0778901234', 200, 'cash',  'completed', '2025-06-23 16:00:00', '2025-06-23 17:00:00', 60),
  ('gs-011', 'con-003', 'shift-001', 'staff-001', 'rate-001', NULL,             NULL,          50,  'cash',  'completed', '2025-06-23 17:30:00', '2025-06-23 18:00:00', 30),
  ('gs-012', 'con-009', 'shift-001', 'staff-001', 'rate-005', 'John Mwangi',    '0789012345', 250, 'mpesa', 'completed', '2025-06-23 18:00:00', '2025-06-23 19:30:00', 90),
  -- debt session
  ('gs-013', 'con-010', 'shift-001', 'staff-001', 'rate-002', 'Alex Kariuki',   '0790123456', 100, 'debt',  'debt',      '2025-06-23 19:00:00', '2025-06-23 20:00:00', 60);

-- ── TUESDAY SESSIONS (shift-002) ──────────────────────────

INSERT INTO game_sessions (id, console_id, shift_id, staff_id, rate_id, customer_name, customer_phone, amount, payment_method, status, started_at, ended_at, duration_minutes) VALUES
  ('gs-014', 'con-001', 'shift-002', 'staff-002', 'rate-001', NULL,             NULL,          50,  'cash',  'completed', '2025-06-24 09:00:00', '2025-06-24 09:30:00', 30),
  ('gs-015', 'con-002', 'shift-002', 'staff-002', 'rate-007', 'Mike Omondi',    '0701234567', 200, 'mpesa', 'completed', '2025-06-24 09:30:00', '2025-06-24 10:30:00', 60),
  ('gs-016', 'con-003', 'shift-002', 'staff-002', 'rate-002', 'Lucy Wanjiru',   '0712345679', 100, 'cash',  'completed', '2025-06-24 10:00:00', '2025-06-24 11:00:00', 60),
  ('gs-017', 'con-004', 'shift-002', 'staff-002', 'rate-005', 'Tom Kiprotich',  '0723456780', 200, 'cash',  'completed', '2025-06-24 10:30:00', '2025-06-24 12:00:00', 90),
  ('gs-018', 'con-005', 'shift-002', 'staff-002', 'rate-003', NULL,             NULL,          180, 'cash',  'completed', '2025-06-24 11:00:00', '2025-06-24 13:00:00', 120),
  ('gs-019', 'con-006', 'shift-002', 'staff-002', 'rate-002', 'Rose Adhiambo',  '0734567891', 100, 'mpesa', 'completed', '2025-06-24 12:00:00', '2025-06-24 13:00:00', 60),
  ('gs-020', 'con-007', 'shift-002', 'staff-002', 'rate-006', 'Paul Nzioka',    '0745678902', 100, 'cash',  'completed', '2025-06-24 13:00:00', '2025-06-24 14:00:00', 60),
  ('gs-021', 'con-001', 'shift-002', 'staff-002', 'rate-008', NULL,             NULL,          200, 'cash',  'completed', '2025-06-24 14:30:00', '2025-06-24 15:30:00', 60),
  ('gs-022', 'con-008', 'shift-002', 'staff-002', 'rate-002', 'Ann Muthoni',    '0756789013', 100, 'mpesa', 'completed', '2025-06-24 15:00:00', '2025-06-24 16:00:00', 60),
  ('gs-023', 'con-009', 'shift-002', 'staff-002', 'rate-001', NULL,             NULL,          50,  'cash',  'completed', '2025-06-24 16:30:00', '2025-06-24 17:00:00', 30),
  ('gs-024', 'con-010', 'shift-002', 'staff-002', 'rate-003', 'Dan Cheruiyot',  '0767890124', 180, 'cash',  'completed', '2025-06-24 17:00:00', '2025-06-24 19:00:00', 120),
  ('gs-025', 'con-002', 'shift-002', 'staff-002', 'rate-007', 'Mark Rotich',    '0778901235', 200, 'mpesa', 'completed', '2025-06-24 18:00:00', '2025-06-24 19:00:00', 60),
  -- debt
  ('gs-026', 'con-003', 'shift-002', 'staff-002', 'rate-002', 'Steve Kamau',    '0789012346', 100, 'debt',  'debt',      '2025-06-24 19:30:00', '2025-06-24 20:00:00', 30);

-- ── WEDNESDAY SESSIONS (shift-003) ─────────────────────────

INSERT INTO game_sessions (id, console_id, shift_id, staff_id, rate_id, customer_name, customer_phone, amount, payment_method, status, started_at, ended_at, duration_minutes) VALUES
  ('gs-027', 'con-001', 'shift-003', 'staff-003', 'rate-002', 'Chris Mwenda',   '0790123457', 100, 'cash',  'completed', '2025-06-25 09:00:00', '2025-06-25 10:00:00', 60),
  ('gs-028', 'con-002', 'shift-003', 'staff-003', 'rate-005', NULL,             NULL,          200, 'cash',  'completed', '2025-06-25 09:30:00', '2025-06-25 11:00:00', 90),
  ('gs-029', 'con-003', 'shift-003', 'staff-003', 'rate-003', 'Ian Njeru',      '0701234568', 180, 'mpesa', 'completed', '2025-06-25 10:00:00', '2025-06-25 12:00:00', 120),
  ('gs-030', 'con-004', 'shift-003', 'staff-003', 'rate-007', 'Cate Waweru',    '0712345680', 200, 'cash',  'completed', '2025-06-25 10:30:00', '2025-06-25 11:30:00', 60),
  ('gs-031', 'con-005', 'shift-003', 'staff-003', 'rate-002', NULL,             NULL,          100, 'cash',  'completed', '2025-06-25 11:00:00', '2025-06-25 12:00:00', 60),
  ('gs-032', 'con-006', 'shift-003', 'staff-003', 'rate-006', 'Ken Mugo',       '0723456781', 200, 'mpesa', 'completed', '2025-06-25 11:30:00', '2025-06-25 13:00:00', 90),
  ('gs-033', 'con-007', 'shift-003', 'staff-003', 'rate-008', 'Liz Nduta',      '0734567892', 200, 'cash',  'completed', '2025-06-25 12:00:00', '2025-06-25 13:00:00', 60),
  ('gs-034', 'con-008', 'shift-003', 'staff-003', 'rate-001', NULL,             NULL,          50,  'cash',  'completed', '2025-06-25 13:30:00', '2025-06-25 14:00:00', 30),
  ('gs-035', 'con-009', 'shift-003', 'staff-003', 'rate-003', 'Joel Kiptoo',    '0745678903', 180, 'cash',  'completed', '2025-06-25 14:00:00', '2025-06-25 16:00:00', 120),
  ('gs-036', 'con-010', 'shift-003', 'staff-003', 'rate-002', 'Mary Auma',      '0756789014', 100, 'mpesa', 'completed', '2025-06-25 15:00:00', '2025-06-25 16:00:00', 60),
  ('gs-037', 'con-001', 'shift-003', 'staff-003', 'rate-007', 'Nick Kimani',    '0767890125', 200, 'cash',  'completed', '2025-06-25 16:30:00', '2025-06-25 17:30:00', 60),
  ('gs-038', 'con-002', 'shift-003', 'staff-003', 'rate-004', 'Eve Atieno',     '0778901236', 500, 'cash',  'completed', '2025-06-25 09:00:00', '2025-06-25 17:00:00', 480),
  ('gs-039', 'con-003', 'shift-003', 'staff-003', 'rate-005', NULL,             NULL,          150, 'cash',  'completed', '2025-06-25 17:00:00', '2025-06-25 18:30:00', 90),
  ('gs-040', 'con-004', 'shift-003', 'staff-003', 'rate-002', 'Ray Ochieng',    '0789012347', 100, 'mpesa', 'completed', '2025-06-25 18:00:00', '2025-06-25 19:00:00', 60),
  -- debt
  ('gs-041', 'con-005', 'shift-003', 'staff-003', 'rate-003', 'Jay Weru',       '0790123458', 180, 'debt',  'debt',      '2025-06-25 19:00:00', '2025-06-25 21:00:00', 120);

-- ── TODAY'S SESSIONS (shift-004) — mix of active + completed ──

-- Completed sessions earlier today
INSERT INTO game_sessions (id, console_id, shift_id, staff_id, rate_id, customer_name, customer_phone, amount, payment_method, status, started_at, ended_at, duration_minutes) VALUES
  ('gs-042', 'con-001', 'shift-004', 'staff-001', 'rate-002', 'Tony Njoroge',   '0712345688', 100, 'cash',  'completed', NOW() - INTERVAL 3 HOUR, NOW() - INTERVAL 2 HOUR, 60),
  ('gs-043', 'con-004', 'shift-004', 'staff-001', 'rate-001', NULL,             NULL,          50,  'cash',  'completed', NOW() - INTERVAL 3 HOUR, NOW() - INTERVAL 150 MINUTE, 30),
  ('gs-044', 'con-007', 'shift-004', 'staff-001', 'rate-007', 'Flo Wambui',     '0723456791', 200, 'mpesa', 'completed', NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 1 HOUR, 60);

-- Active sessions RIGHT NOW (bays will show green in the sessions grid)
INSERT INTO game_sessions (id, console_id, shift_id, staff_id, rate_id, customer_name, customer_phone, amount, payment_method, status, started_at) VALUES
  ('gs-045', 'con-002', 'shift-004', 'staff-001', 'rate-003', 'Sam Otieno',     '0734567901', 180, 'cash',  'active', NOW() - INTERVAL 45 MINUTE),
  ('gs-046', 'con-003', 'shift-004', 'staff-001', 'rate-005', 'Pam Akinyi',     '0745678911', 200, 'mpesa', 'active', NOW() - INTERVAL 30 MINUTE),
  ('gs-047', 'con-006', 'shift-004', 'staff-001', 'rate-002', NULL,             NULL,          100, 'cash',  'active', NOW() - INTERVAL 20 MINUTE),
  ('gs-048', 'con-008', 'shift-004', 'staff-001', 'rate-008', 'Dave Mwangi',    '0756789021', 200, 'cash',  'active', NOW() - INTERVAL 55 MINUTE),
  ('gs-049', 'con-009', 'shift-004', 'staff-001', 'rate-007', 'Zoe Adhiambo',   '0767890131', 200, 'mpesa', 'active', NOW() - INTERVAL 10 MINUTE);

-- Update console statuses to match active sessions
UPDATE consoles SET status = 'active' WHERE id IN ('con-002','con-003','con-006','con-008','con-009');

-- ============================================================
-- 7. EXPENSES
-- Realistic lounge operational costs
-- ============================================================

INSERT INTO expenses (id, shift_id, staff_id, description, amount, expense_date) VALUES
  ('exp-001', 'shift-001', 'staff-001', 'Electricity token top-up',    500,  '2025-06-23'),
  ('exp-002', 'shift-001', 'staff-001', 'Drinks for staff',            150,  '2025-06-23'),
  ('exp-003', 'shift-002', 'staff-002', 'Internet bill (Safaricom)',   1500, '2025-06-24'),
  ('exp-004', 'shift-002', 'staff-002', 'Printing — session receipts', 80,   '2025-06-24'),
  ('exp-005', 'shift-003', 'staff-003', 'Cleaning supplies',           200,  '2025-06-25'),
  ('exp-006', 'shift-003', 'staff-003', 'HDMI cable replacement',      350,  '2025-06-25'),
  ('exp-007', 'shift-003', 'staff-003', 'Snacks for VIP customer',     120,  '2025-06-25'),
  ('exp-008', 'shift-004', 'staff-001', 'Extension cord purchase',     450,  CURDATE());

-- ============================================================
-- 8. CASH OUTS
-- Mid-shift withdrawals by staff
-- ============================================================

INSERT INTO cash_outs (id, shift_id, staff_id, amount, reason, created_at) VALUES
  ('co-001', 'shift-001', 'staff-001', 200,  'Electricity token',           '2025-06-23 14:00:00'),
  ('co-002', 'shift-002', 'staff-002', 300,  'Mpesa float withdrawal',      '2025-06-24 12:00:00'),
  ('co-003', 'shift-003', 'staff-003', 150,  'Drinks purchase',             '2025-06-25 15:30:00'),
  ('co-004', 'shift-004', 'staff-001', 100,  'Cleaning supplies',           NOW() - INTERVAL 1 HOUR);

-- ============================================================
-- 9. DEBTS
-- Outstanding and settled customer debts
-- ============================================================

INSERT INTO debts (id, game_session_id, customer_name, customer_phone, amount, status, created_at) VALUES
  -- Monday debt — still outstanding
  ('debt-001', 'gs-013', 'Alex Kariuki',  '0790123456', 100, 'outstanding', '2025-06-23 20:00:00'),
  -- Tuesday debt — settled
  ('debt-002', 'gs-026', 'Steve Kamau',   '0789012346', 100, 'settled',     '2025-06-24 20:00:00'),
  -- Wednesday debt — still outstanding
  ('debt-003', 'gs-041', 'Jay Weru',      '0790123458', 180, 'outstanding', '2025-06-25 21:00:00');

-- ============================================================
-- VERIFY — Run these SELECT statements to confirm everything loaded
-- ============================================================

SELECT 'owners'        AS tbl, COUNT(*) AS rows FROM owners
UNION ALL
SELECT 'staff',                COUNT(*)          FROM staff
UNION ALL
SELECT 'consoles',             COUNT(*)          FROM consoles
UNION ALL
SELECT 'session_rates',        COUNT(*)          FROM session_rates
UNION ALL
SELECT 'shifts',               COUNT(*)          FROM shifts
UNION ALL
SELECT 'game_sessions',        COUNT(*)          FROM game_sessions
UNION ALL
SELECT 'expenses',             COUNT(*)          FROM expenses
UNION ALL
SELECT 'cash_outs',            COUNT(*)          FROM cash_outs
UNION ALL
SELECT 'debts',                COUNT(*)          FROM debts;

-- ============================================================
-- QUICK REVENUE SUMMARY CHECK
-- ============================================================

SELECT
  DATE(started_at)                                              AS date,
  COUNT(*)                                                      AS total_sessions,
  SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END)   AS revenue,
  SUM(CASE WHEN payment_method = 'cash'  AND status = 'completed' THEN amount ELSE 0 END) AS cash,
  SUM(CASE WHEN payment_method = 'mpesa' AND status = 'completed' THEN amount ELSE 0 END) AS mpesa,
  SUM(CASE WHEN status = 'active'    THEN 1 ELSE 0 END)        AS active_now
FROM game_sessions
GROUP BY DATE(started_at)
ORDER BY date;
