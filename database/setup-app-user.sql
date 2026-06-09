-- ============================================================
-- DICT MRIS — Dedicated Application User Setup
-- Run as MySQL root user (e.g., `mysql -u root -p < setup-app-user.sql`)
-- ============================================================

-- Create dedicated application user with strong password
-- CHANGE 'CHANGE_THIS_TO_STRONG_PASSWORD' TO A SECURE RANDOM PASSWORD
-- Generate with: openssl rand -base64 32
CREATE USER IF NOT EXISTS 'dict_mris_app'@'%' IDENTIFIED BY 'CHANGE_THIS_TO_STRONG_PASSWORD';

-- Grant minimal required privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON `dict_mris`.* TO 'dict_mris_app'@'%';

-- Optional: Restrict to specific host for additional security
-- CREATE USER IF NOT EXISTS 'dict_mris_app'@'localhost' IDENTIFIED BY 'CHANGE_THIS_TO_STRONG_PASSWORD';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON `dict_mris`.* TO 'dict_mris_app'@'localhost';
-- CREATE USER IF NOT EXISTS 'dict_mris_app'@'127.0.0.1' IDENTIFIED BY 'CHANGE_THIS_TO_STRONG_PASSWORD';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON `dict_mris`.* TO 'dict_mris_app'@'127.0.0.1';

FLUSH PRIVILEGES;

-- Verify grants
SHOW GRANTS FOR 'dict_mris_app'@'%';

-- ============================================================
-- AFTER RUNNING THIS SCRIPT:
-- 1. Update api/.env:
--    DB_USER=dict_mris_app
--    DB_PASS=CHANGE_THIS_TO_STRONG_PASSWORD
-- 2. Generate strong JWT_SECRET:
--    openssl rand -base64 32
-- 3. Update api/.env with JWT_SECRET
-- ============================================================