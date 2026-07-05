-- ================================================================
-- Console Lounge Manager — MySQL Database
-- Run in phpMyAdmin → console_lounge → SQL tab
-- ================================================================

USE console_lounge;

-- ── 1. STAFF ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id           CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name         VARCHAR(100) NOT NULL,
  pin          VARCHAR(255) NOT NULL,
  role         VARCHAR(20) NOT NULL DEFAULT 'staff',
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  pin_attempts INT NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 2. SHIFTS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shifts (
  id             CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  staff_id       CHAR(36) NOT NULL,
  opened_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at      DATETIME NULL,
  float_amount   DECIMAL(10,2) NOT NULL DEFAULT 0,
  cash_declared  DECIMAL(10,2) NULL,
  mpesa_declared DECIMAL(10,2) NULL,
  cash_expected  DECIMAL(10,2) NULL,
  mpesa_expected DECIMAL(10,2) NULL,
  variance       DECIMAL(10,2) NULL,
  notes          TEXT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id)
);

-- ── 3. CONSOLES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consoles (
  id           CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name         VARCHAR(50) NOT NULL,
  console_type VARCHAR(20) NOT NULL DEFAULT 'PS5',
  status       VARCHAR(20) NOT NULL DEFAULT 'open',
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 4. SESSION RATES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_rates (
  id               CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name             VARCHAR(100) NOT NULL,
  duration_minutes INT NULL,
  price            DECIMAL(10,2) NOT NULL,
  is_active        TINYINT(1) NOT NULL DEFAULT 1,
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 5. GAME SESSIONS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_sessions (
  id               CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  console_id       CHAR(36) NOT NULL,
  shift_id         CHAR(36) NULL,
  staff_id         CHAR(36) NULL,
  rate_id          CHAR(36) NULL,
  customer_name    VARCHAR(100) NULL,
  customer_phone   VARCHAR(20) NULL,
  started_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at         DATETIME NULL,
  duration_minutes INT NULL,
  amount           DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method   VARCHAR(20) NOT NULL DEFAULT 'cash',
  mpesa_ref        VARCHAR(20) NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'active',
  notes            TEXT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (console_id) REFERENCES consoles(id),
  FOREIGN KEY (shift_id)   REFERENCES shifts(id),
  FOREIGN KEY (staff_id)   REFERENCES staff(id),
  FOREIGN KEY (rate_id)    REFERENCES session_rates(id)
);

-- ── 6. EXPENSES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id           CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  shift_id     CHAR(36) NULL,
  category     VARCHAR(100) NOT NULL,
  description  TEXT NULL,
  amount       DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shift_id) REFERENCES shifts(id)
);

-- ── 7. CASH OUTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cash_outs (
  id         CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  shift_id   CHAR(36) NULL,
  staff_id   CHAR(36) NULL,
  amount     DECIMAL(10,2) NOT NULL,
  reason     TEXT NULL,
  status     VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shift_id)  REFERENCES shifts(id),
  FOREIGN KEY (staff_id)  REFERENCES staff(id)
);

-- ── 8. DEBTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS debts (
  id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  game_session_id CHAR(36) NULL,
  customer_name   VARCHAR(100) NOT NULL,
  customer_phone  VARCHAR(20) NULL,
  amount          DECIMAL(10,2) NOT NULL,
  amount_paid     DECIMAL(10,2) NOT NULL DEFAULT 0,
  balance         DECIMAL(10,2) GENERATED ALWAYS AS (amount - amount_paid) STORED,
  status          VARCHAR(20) NOT NULL DEFAULT 'outstanding',
  due_date        DATE NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_session_id) REFERENCES game_sessions(id)
);

-- ── 9. OWNER ACCOUNTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS owners (
  id         CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ================================================================
-- SEED DATA
-- ================================================================

-- 10 Bays
INSERT INTO consoles (id, name, console_type, sort_order) VALUES
  (UUID(), 'Bay 1',  'PS5', 1),
  (UUID(), 'Bay 2',  'PS5', 2),
  (UUID(), 'Bay 3',  'PS5', 3),
  (UUID(), 'Bay 4',  'PS5', 4),
  (UUID(), 'Bay 5',  'PS5', 5),
  (UUID(), 'Bay 6',  'PS4', 6),
  (UUID(), 'Bay 7',  'PS4', 7),
  (UUID(), 'Bay 8',  'PS4', 8),
  (UUID(), 'Bay 9',  'PS4', 9),
  (UUID(), 'Bay 10', 'PS4', 10);

-- Default rate cards
INSERT INTO session_rates (id, name, duration_minutes, price, sort_order) VALUES
  (UUID(), '30 Minutes',    30,   50,  1),
  (UUID(), '1 Hour',        60,   100, 2),
  (UUID(), '2 Hours',       120,  180, 3),
  (UUID(), '3 Hours',       180,  250, 4),
  (UUID(), 'Full Day',      480,  500, 5),
  (UUID(), 'Open (Manual)', NULL, 0,   6);


-- ================================================================
-- VERIFY — should show all 9 tables
-- ================================================================
SHOW TABLES;
