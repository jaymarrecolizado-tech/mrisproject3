-- ============================================================
-- DICT MRIS — Unified Project Management & Reporting System
-- MySQL 8.0 Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS dict_mris
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE dict_mris;

-- ============================================================
-- 1. ROLES & PERMISSIONS (RBAC)
-- ============================================================

CREATE TABLE roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE permissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  group_name VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
  role_id INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 2. USERS
-- ============================================================

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  phone VARCHAR(30),
  department VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  last_login_at TIMESTAMP NULL,
  token_version INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
  INDEX idx_email (email),
  INDEX idx_role (role_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- ============================================================
-- 3. PROJECTS (master list)
-- ============================================================

CREATE TABLE projects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  full_name VARCHAR(255),
  color VARCHAR(7) DEFAULT '#3B82F6',
  icon VARCHAR(50),
  description TEXT,
  type ENUM('daily','milestone') NOT NULL DEFAULT 'daily',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_type (type),
  INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- ============================================================
-- 4. PROJECT ACCESS (per-user, per-project)
-- ============================================================

CREATE TABLE user_project_access (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  project_id INT UNSIGNED NOT NULL,
  access_level ENUM('view','edit','admin') DEFAULT 'view',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_project (user_id, project_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 5. GEOGRAPHIC REFERENCE DATA
-- ============================================================

CREATE TABLE provinces (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  island_group ENUM('Luzon','Visayas','Mindanao') NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  UNIQUE KEY uk_name (name)
) ENGINE=InnoDB;

CREATE TABLE municipalities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  province_id INT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  district VARCHAR(50),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE,
  INDEX idx_province (province_id)
) ENGINE=InnoDB;

CREATE TABLE barangays (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  municipality_id INT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  FOREIGN KEY (municipality_id) REFERENCES municipalities(id) ON DELETE CASCADE,
  INDEX idx_municipality (municipality_id)
) ENGINE=InnoDB;

-- ============================================================
-- 6. SITES (physical locations / access points)
-- ============================================================

CREATE TABLE sites (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  nationwide_id VARCHAR(50),
  site_code VARCHAR(50) NOT NULL,
  location_name VARCHAR(200),
  site_name VARCHAR(200),
  barangay VARCHAR(100),
  municipality VARCHAR(100),
  province VARCHAR(100),
  district VARCHAR(50),
  island_group ENUM('Luzon','Visayas','Mindanao'),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  site_type VARCHAR(50),
  isp_provider VARCHAR(100),
  last_mile_tech VARCHAR(100),
  bw_download DECIMAL(10,2),
  status ENUM('UP','DOWN','PARTIAL','PENDING','DECOMMISSIONED') DEFAULT 'PENDING',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project (project_id),
  INDEX idx_status (status),
  INDEX idx_island (island_group),
  INDEX idx_province (province),
  INDEX idx_site_code (site_code)
) ENGINE=InnoDB;

-- ============================================================
-- 7. FREE WIFI DAILY LOGS
-- ============================================================

CREATE TABLE free_wifi_daily_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  site_id INT UNSIGNED NOT NULL,
  log_date DATE NOT NULL,
  status ENUM('UP','DOWN','PARTIAL') NOT NULL,
  bandwidth_utilization DECIMAL(10,2),
  total_unique_users INT UNSIGNED DEFAULT 0,
  remarks TEXT,
  logged_by INT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (logged_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uk_site_date (site_id, log_date),
  INDEX idx_date (log_date),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 8. SITE STATUS EVENTS (audit trail for status changes)
-- ============================================================

CREATE TABLE site_status_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  site_id INT UNSIGNED NOT NULL,
  previous_status VARCHAR(30),
  new_status VARCHAR(30) NOT NULL,
  reason TEXT,
  changed_by INT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_site (site_id),
  INDEX idx_date (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 9. DICT PROJECT ENTRIES (milestone progress)
-- ============================================================

CREATE TABLE dict_project_entries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  site_id INT UNSIGNED,
  entry_date DATE NOT NULL,
  status ENUM('COMPLETED','ONGOING','PLANNED','DELAYED') NOT NULL,
  accomplishment_percent DECIMAL(5,2) DEFAULT 0,
  deliverables TEXT,
  remarks TEXT,
  attachments JSON,
  updated_by INT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_project (project_id),
  INDEX idx_date (entry_date),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 10. MILESTONES
-- ============================================================

CREATE TABLE milestones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  site_id INT UNSIGNED,
  title VARCHAR(200) NOT NULL,
  target_date DATE,
  actual_date DATE,
  status ENUM('PENDING','IN_PROGRESS','COMPLETED','DELAYED') DEFAULT 'PENDING',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
  INDEX idx_project (project_id),
  INDEX idx_status (status),
  INDEX idx_target (target_date)
) ENGINE=InnoDB;

-- ============================================================
-- 11. GENERATED REPORTS (history)
-- ============================================================

CREATE TABLE generated_reports (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  format ENUM('PDF','XLSX','CSV') NOT NULL,
  date_from DATE,
  date_to DATE,
  generated_by INT UNSIGNED,
  file_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_type (report_type),
  INDEX idx_date (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 12. AUDIT LOGS (full system audit trail)
-- ============================================================

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT UNSIGNED,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  hash_chain VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_date (created_at),
  INDEX idx_hash_chain (hash_chain)
) ENGINE=InnoDB;

-- ============================================================
-- 13. VIEWS
-- ============================================================

CREATE OR REPLACE VIEW vw_free_wifi_daily_summary AS
SELECT
  log_date,
  COUNT(*) AS total_sites,
  SUM(CASE WHEN status = 'UP' THEN 1 ELSE 0 END) AS up_count,
  SUM(CASE WHEN status = 'DOWN' THEN 1 ELSE 0 END) AS down_count,
  SUM(CASE WHEN status = 'PARTIAL' THEN 1 ELSE 0 END) AS partial_count,
  COALESCE(SUM(total_unique_users), 0) AS total_users,
  COALESCE(ROUND(AVG(bandwidth_utilization), 2), 0) AS avg_bandwidth
FROM free_wifi_daily_logs
GROUP BY log_date;

CREATE OR REPLACE VIEW vw_project_accomplishment AS
SELECT
  p.id AS project_id,
  p.code AS project_code,
  p.name AS project_name,
  COUNT(DISTINCT s.id) AS total_sites,
  COUNT(DISTINCT CASE WHEN s.status = 'UP' THEN s.id END) AS active_sites,
  COUNT(DISTINCT CASE WHEN s.status = 'DOWN' THEN s.id END) AS down_sites,
  COALESCE(ROUND(AVG(e.accomplishment_percent), 2), 0) AS avg_completion
FROM projects p
LEFT JOIN sites s ON s.project_id = p.id
LEFT JOIN dict_project_entries e ON e.project_id = p.id
WHERE p.type = 'milestone'
GROUP BY p.id, p.code, p.name;

-- ============================================================
-- 14. STORED PROCEDURES
-- ============================================================

DELIMITER //

CREATE PROCEDURE sp_get_dashboard_stats()
BEGIN
  SELECT
    (SELECT COUNT(*) FROM sites WHERE project_id IN (SELECT id FROM projects WHERE type = 'daily')) AS fw_total_sites,
    (SELECT COUNT(*) FROM sites WHERE project_id IN (SELECT id FROM projects WHERE type = 'daily') AND status = 'UP') AS fw_up_sites,
    (SELECT COUNT(*) FROM sites WHERE project_id IN (SELECT id FROM projects WHERE type = 'daily') AND status = 'DOWN') AS fw_down_sites,
    (SELECT COUNT(*) FROM sites WHERE project_id IN (SELECT id FROM projects WHERE type = 'milestone')) AS dict_total_sites,
    (SELECT COUNT(*) FROM projects WHERE is_active = 1) AS active_projects;
END //

CREATE PROCEDURE sp_get_regional_stats(IN p_island_group VARCHAR(20))
BEGIN
  SELECT
    island_group,
    COUNT(*) AS total_sites,
    SUM(CASE WHEN status = 'UP' THEN 1 ELSE 0 END) AS up_sites,
    SUM(CASE WHEN status = 'DOWN' THEN 1 ELSE 0 END) AS down_sites,
    COALESCE(ROUND(AVG(bw_download), 2), 0) AS avg_bandwidth
  FROM sites
  WHERE (p_island_group IS NULL OR island_group = p_island_group)
  GROUP BY island_group;
END //

DELIMITER ;

-- ============================================================
-- 13. NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_read (is_read),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 15. SITE PHOTOS
-- ============================================================

CREATE TABLE site_photos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  site_id INT UNSIGNED NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INT UNSIGNED,
  mime_type VARCHAR(50),
  caption VARCHAR(255),
  uploaded_by INT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_site (site_id)
) ENGINE=InnoDB;

-- ============================================================
-- 16. PASSWORD RESETS
-- ============================================================

CREATE TABLE password_resets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_token (token_hash),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- ============================================================
-- 17. REFRESH TOKENS (for token rotation & revocation)
-- ============================================================

CREATE TABLE refresh_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  jwt_id VARCHAR(64) NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(45),
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_jwt_id (jwt_id),
  INDEX idx_user (user_id),
  INDEX idx_token (token_hash),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- ============================================================
-- 18. PRODUCTION USER SETUP (run once after DB creation)
-- ============================================================
-- Create dedicated application user with minimal privileges
-- Run as MySQL root:
-- CREATE USER 'dict_mris_app'@'%' IDENTIFIED BY 'CHANGE_THIS_TO_STRONG_PASSWORD';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON dict_mris.* TO 'dict_mris_app'@'%';
-- FLUSH PRIVILEGES;
-- Then update api/.env: DB_USER=dict_mris_app, DB_PASS=<that_password>
