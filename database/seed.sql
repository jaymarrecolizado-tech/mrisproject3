-- ============================================================
-- DICT MRIS — Seed Data
-- Run AFTER schema.sql
-- ============================================================

USE dict_mris;

-- ============================================================
-- 1. ROLES
-- ============================================================

INSERT INTO roles (name, slug, description) VALUES
('Super Admin', 'super_admin', 'Full system access, can manage users and roles'),
('Project Manager', 'project_manager', 'Can view and edit assigned projects, generate reports'),
('Data Encoder', 'data_encoder', 'Can enter daily logs and accomplishment entries for assigned projects'),
('Viewer', 'viewer', 'Read-only access to assigned projects and reports');

-- ============================================================
-- 2. PERMISSIONS
-- ============================================================

INSERT INTO permissions (name, slug, group_name) VALUES
-- User management
('Manage Users', 'users.manage', 'users'),
('View Users', 'users.view', 'users'),
-- Project management
('Manage Projects', 'projects.manage', 'projects'),
('View Projects', 'projects.view', 'projects'),
('Edit Projects', 'projects.edit', 'projects'),
-- Site management
('Manage Sites', 'sites.manage', 'sites'),
('View Sites', 'sites.view', 'sites'),
('Edit Sites', 'sites.edit', 'sites'),
('Import Sites', 'sites.import', 'sites'),
('Export Sites', 'sites.export', 'sites'),
-- Daily logs
('Create Daily Logs', 'logs.create', 'logs'),
('View Daily Logs', 'logs.view', 'logs'),
('Edit Daily Logs', 'logs.edit', 'logs'),
('Bulk Import Logs', 'logs.bulk_import', 'logs'),
-- Project entries
('Create Project Entries', 'entries.create', 'entries'),
('View Project Entries', 'entries.view', 'entries'),
('Edit Project Entries', 'entries.edit', 'entries'),
-- Milestones
('Manage Milestones', 'milestones.manage', 'milestones'),
('View Milestones', 'milestones.view', 'milestones'),
-- Reports
('Generate Reports', 'reports.generate', 'reports'),
('View Reports', 'reports.view', 'reports'),
('Export Reports', 'reports.export', 'reports'),
-- Map
('View Map', 'map.view', 'map'),
-- Dashboard
('View Dashboard', 'dashboard.view', 'dashboard'),
-- Audit
('View Audit Logs', 'audit.view', 'audit');

-- ============================================================
-- 3. ROLE-PERMISSION ASSIGNMENTS
-- ============================================================

-- Super Admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Project Manager: view + edit projects, sites, logs, entries, milestones, reports, map, dashboard
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE slug IN (
  'users.view', 'projects.view', 'projects.edit', 'sites.view', 'sites.edit',
  'sites.export', 'logs.view', 'logs.create', 'logs.edit', 'logs.bulk_import',
  'entries.view', 'entries.create', 'entries.edit', 'milestones.view', 'milestones.manage',
  'reports.view', 'reports.generate', 'reports.export', 'map.view', 'dashboard.view'
);

-- Data Encoder: create/edit logs and entries for assigned projects
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE slug IN (
  'projects.view', 'sites.view', 'logs.view', 'logs.create', 'logs.edit',
  'entries.view', 'entries.create', 'entries.edit', 'milestones.view',
  'reports.view', 'map.view', 'dashboard.view'
);

-- Viewer: read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE slug IN (
  'projects.view', 'sites.view', 'logs.view', 'entries.view',
  'milestones.view', 'reports.view', 'map.view', 'dashboard.view'
);

-- ============================================================
-- 4. USERS (password for all: "admin123" — change after first login)
-- ============================================================

INSERT INTO users (name, email, password_hash, role_id, department, is_active) VALUES
('Admin User', 'admin@dict.gov.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 'ICT Infrastructure', 1),
('Maria Santos', 'maria.santos@dict.gov.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2, 'Free WiFi Program', 1),
('Juan Dela Cruz', 'juan.delacruz@dict.gov.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2, 'DICT Projects', 1),
('Ana Reyes', 'ana.reyes@dict.gov.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3, 'Free WiFi Program', 1),
('Pedro Garcia', 'pedro.garcia@dict.gov.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3, 'DICT Projects', 1),
('Luz Villanueva', 'luz.villanueva@dict.gov.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 4, 'Management', 1);

-- ============================================================
-- 5. PROJECTS
-- ============================================================

INSERT INTO projects (code, name, full_name, color, icon, description, type, is_active) VALUES
('FREEWIFI', 'Free WiFi', 'Free WiFi Program for All', '#10B981', 'wifi', 'Free WiFi access points across the Philippines', 'daily', 1),
('PNPKI', 'PNPKI', 'Philippine National Public Key Infrastructure', '#3B82F6', 'shield', 'Digital certificate infrastructure', 'milestone', 1),
('ILCDB', 'ILCDB', 'Integrated Land Classification Database', '#F59E0B', 'map', 'Land classification and mapping system', 'milestone', 1),
('IIDB', 'IIDB', 'Integrated Industry Database', '#8B5CF6', 'database', 'Industry and business registry database', 'milestone', 1),
('CYBER', 'CYBER', 'Cybersecurity Infrastructure', '#EF4444', 'lock', 'National cybersecurity monitoring and response', 'milestone', 1),
('ELGU', 'eLGU', 'Electronic Local Government Unit System', '#06B6D4', 'building', 'Digital LGU services and records', 'milestone', 1),
('EGOV', 'eGov', 'eGovernment Systems Integration', '#EC4899', 'globe', 'Integrated government service delivery', 'milestone', 1),
('GOVNET', 'GovNet', 'Government Network Infrastructure', '#6366F1', 'network', 'Inter-agency network connectivity', 'milestone', 1),
('GECS', 'GECS', 'Government Electronic Commerce System', '#14B8A6', 'shopping-cart', 'Online government procurement and commerce', 'milestone', 1);

-- ============================================================
-- 6. GEOGRAPHIC DATA (sample provinces)
-- ============================================================

INSERT INTO provinces (name, region, island_group, latitude, longitude) VALUES
('Metro Manila', 'NCR', 'Luzon', 14.5995, 120.9842),
('Cebu', 'Region VII', 'Visayas', 10.3157, 123.8854),
('Davao del Sur', 'Region XI', 'Mindanao', 7.1231, 125.4714),
('Pampanga', 'Region III', 'Luzon', 15.0794, 120.6200),
('Iloilo', 'Region VI', 'Visayas', 10.7202, 122.5621),
('Zamboanga del Sur', 'Region IX', 'Mindanao', 7.8420, 123.2930),
('Cagayan', 'Region II', 'Luzon', 17.8700, 121.7740),
('Palawan', 'MIMAROPA', 'Luzon', 9.8343, 118.7384),
('Bohol', 'Region VII', 'Visayas', 9.8500, 124.1430),
('Bukidnon', 'Region X', 'Mindanao', 8.0500, 124.9000),
('Batangas', 'Region IV-A', 'Luzon', 13.7565, 121.0583),
('Leyte', 'Region VIII', 'Visayas', 11.2500, 125.0000),
('Lanao del Sur', 'BARMM', 'Mindanao', 7.7500, 124.4167),
('Isabela', 'Region II', 'Luzon', 16.9750, 121.8000),
('Negros Occidental', 'Region VI', 'Visayas', 10.0000, 122.8333);

-- ============================================================
-- 7. SAMPLE SITES (Free WiFi — 30 sites across provinces)
-- ============================================================

INSERT INTO sites (project_id, nationwide_id, site_code, location_name, site_name, barangay, municipality, province, district, island_group, latitude, longitude, site_type, isp_provider, last_mile_tech, bw_download, status) VALUES
-- Metro Manila (5)
(1, 'FW-NCR-001', 'FW-NCR-001', 'Rizal Park', 'Rizal Park Free WiFi', 'Ermita', 'Manila', 'Metro Manila', 'District 1', 'Luzon', 14.5823, 120.9810, 'Public Area', 'PLDT', 'Fiber', 100.00, 'UP'),
(1, 'FW-NCR-002', 'FW-NCR-002', 'Quezon City Hall', 'QC Hall Free WiFi', 'Diliman', 'Quezon City', 'Metro Manila', 'District 2', 'Luzon', 14.6760, 121.0437, 'Government', 'Globe', 'Fiber', 100.00, 'UP'),
(1, 'FW-NCR-003', 'FW-NCR-003', 'Makati Ayala', 'Ayala Triangle WiFi', 'San Lorenzo', 'Makati', 'Metro Manila', 'District 1', 'Luzon', 14.5547, 121.0244, 'Public Area', 'Converge', 'Fiber', 150.00, 'UP'),
(1, 'FW-NCR-004', 'FW-NCR-004', 'Pasig City Hall', 'Pasig Hall WiFi', 'Kapitolyo', 'Pasig', 'Metro Manila', 'District 1', 'Luzon', 14.5764, 121.0851, 'Government', 'PLDT', 'Fiber', 100.00, 'DOWN'),
(1, 'FW-NCR-005', 'FW-NCR-005', 'Taguig BGC', 'BGC Central WiFi', 'Bonifacio Global City', 'Taguig', 'Metro Manila', 'District 1', 'Luzon', 14.5503, 121.0483, 'Public Area', 'Globe', 'Fiber', 200.00, 'UP'),
-- Cebu (5)
(1, 'FW-CEB-001', 'FW-CEB-001', 'SM City Cebu', 'SM Cebu WiFi', 'Cebu Business Park', 'Cebu City', 'Cebu', 'District 1', 'Visayas', 10.3120, 123.8970, 'Mall', 'PLDT', 'Fiber', 100.00, 'UP'),
(1, 'FW-CEB-002', 'FW-CEB-002', 'Cebu Provincial Capitol', 'Capitol WiFi', 'Luz', 'Cebu City', 'Cebu', 'District 1', 'Visayas', 10.3100, 123.8950, 'Government', 'Globe', 'Fiber', 100.00, 'UP'),
(1, 'FW-CEB-003', 'FW-CEB-003', 'Mandaue City Hall', 'Mandaue WiFi', 'Centro', 'Mandaue City', 'Cebu', 'District 1', 'Visayas', 10.3237, 123.9227, 'Government', 'Converge', 'Fiber', 75.00, 'UP'),
(1, 'FW-CEB-004', 'FW-CEB-004', 'Lapu-Lapu Public Market', 'Lapu-Lapu WiFi', 'Poblacion', 'Lapu-Lapu City', 'Cebu', 'District 2', 'Visayas', 10.3103, 123.9494, 'Public Market', 'PLDT', 'Wireless', 50.00, 'DOWN'),
(1, 'FW-CEB-005', 'FW-CEB-005', 'Talisay City Plaza', 'Talisay WiFi', 'Poblacion', 'Talisay City', 'Cebu', 'District 1', 'Visayas', 10.2449, 123.8495, 'Public Area', 'Globe', 'Fiber', 75.00, 'UP'),
-- Davao (5)
(1, 'FW-DVO-001', 'FW-DVO-001', 'Davao City Hall', 'Davao Hall WiFi', 'Poblacion', 'Davao City', 'Davao del Sur', 'District 1', 'Mindanao', 7.0707, 125.6087, 'Government', 'PLDT', 'Fiber', 100.00, 'UP'),
(1, 'FW-DVO-002', 'FW-DVO-002', 'SM Ecoland', 'SM Ecoland WiFi', 'San Isidro', 'Davao City', 'Davao del Sur', 'District 1', 'Mindanao', 7.0850, 125.6150, 'Mall', 'Globe', 'Fiber', 100.00, 'UP'),
(1, 'FW-DVO-003', 'FW-DVO-003', 'Panabo City Hall', 'Panabo WiFi', 'Poblacion', 'Panabo City', 'Davao del Sur', 'District 2', 'Mindanao', 7.3300, 125.6400, 'Government', 'Converge', 'Fiber', 50.00, 'DOWN'),
(1, 'FW-DVO-004', 'FW-DVO-004', 'Digos City Plaza', 'Digos WiFi', 'Poblacion', 'Digos City', 'Davao del Sur', 'District 1', 'Mindanao', 6.7500, 125.3500, 'Public Area', 'PLDT', 'Wireless', 50.00, 'UP'),
(1, 'FW-DVO-005', 'FW-DVO-005', 'Tagum City Hall', 'Tagum WiFi', 'Magugpo', 'Tagum City', 'Davao del Sur', 'District 2', 'Mindanao', 7.4500, 125.8000, 'Government', 'Globe', 'Fiber', 75.00, 'UP'),
-- Pampanga (3)
(1, 'FW-PAM-001', 'FW-PAM-001', 'San Fernando City Hall', 'SF Pampanga WiFi', 'Poblacion', 'San Fernando', 'Pampanga', 'District 1', 'Luzon', 15.0359, 120.6890, 'Government', 'PLDT', 'Fiber', 100.00, 'UP'),
(1, 'FW-PAM-002', 'FW-PAM-002', 'Angeles City Hall', 'Angeles WiFi', 'Balibago', 'Angeles City', 'Pampanga', 'District 2', 'Luzon', 15.1680, 120.5870, 'Government', 'Globe', 'Fiber', 100.00, 'UP'),
(1, 'FW-PAM-003', 'FW-PAM-003', 'Clark Freeport', 'Clark WiFi', 'Clark', 'Angeles City', 'Pampanga', 'District 1', 'Luzon', 15.1800, 120.5600, 'Public Area', 'Converge', 'Fiber', 150.00, 'UP'),
-- Iloilo (3)
(1, 'FW-ILO-001', 'FW-ILO-001', 'Iloilo City Hall', 'Iloilo Hall WiFi', 'Poblacion', 'Iloilo City', 'Iloilo', 'District 1', 'Visayas', 10.6969, 122.5644, 'Government', 'PLDT', 'Fiber', 100.00, 'UP'),
(1, 'FW-ILO-002', 'FW-ILO-002', 'SM City Iloilo', 'SM Iloilo WiFi', 'Mandurriao', 'Iloilo City', 'Iloilo', 'District 1', 'Visayas', 10.7200, 122.5500, 'Mall', 'Globe', 'Fiber', 100.00, 'UP'),
(1, 'FW-ILO-003', 'FW-ILO-003', 'Jaro Plaza', 'Jaro WiFi', 'Jaro', 'Iloilo City', 'Iloilo', 'District 2', 'Visayas', 10.7250, 122.5750, 'Public Area', 'Converge', 'Wireless', 50.00, 'DOWN'),
-- Other provinces (9)
(1, 'FW-ZAS-001', 'FW-ZAS-001', 'Pagadian City Hall', 'Pagadian WiFi', 'Poblacion', 'Pagadian City', 'Zamboanga del Sur', 'District 1', 'Mindanao', 7.8330, 123.4330, 'Government', 'PLDT', 'Fiber', 75.00, 'UP'),
(1, 'FW-CAG-001', 'FW-CAG-001', 'Tuguegarao City Hall', 'Tuguegarao WiFi', 'Poblacion', 'Tuguegarao City', 'Cagayan', 'District 1', 'Luzon', 17.6130, 121.7270, 'Government', 'Globe', 'Fiber', 75.00, 'UP'),
(1, 'FW-PLW-001', 'FW-PLW-001', 'Puerto Princesa Hall', 'PP WiFi', 'Poblacion', 'Puerto Princesa', 'Palawan', 'District 1', 'Luzon', 9.7390, 118.7350, 'Government', 'PLDT', 'Fiber', 50.00, 'UP'),
(1, 'FW-BOH-001', 'FW-BOH-001', 'Tagbilaran City Hall', 'Tagbilaran WiFi', 'Poblacion', 'Tagbilaran City', 'Bohol', 'District 1', 'Visayas', 9.6470, 123.8530, 'Government', 'Globe', 'Fiber', 75.00, 'DOWN'),
(1, 'FW-BUK-001', 'FW-BUK-001', 'Malaybalay City Hall', 'Malaybalay WiFi', 'Poblacion', 'Malaybalay City', 'Bukidnon', 'District 1', 'Mindanao', 8.1500, 125.1300, 'Government', 'Converge', 'Wireless', 50.00, 'UP'),
(1, 'FW-BAT-001', 'FW-BAT-001', 'Batangas City Hall', 'Batangas WiFi', 'Poblacion', 'Batangas City', 'Batangas', 'District 1', 'Luzon', 13.7565, 121.0583, 'Government', 'PLDT', 'Fiber', 100.00, 'UP'),
(1, 'FW-LEY-001', 'FW-LEY-001', 'Tacloban City Hall', 'Tacloban WiFi', 'Poblacion', 'Tacloban City', 'Leyte', 'District 1', 'Visayas', 11.2440, 125.0040, 'Government', 'Globe', 'Fiber', 75.00, 'UP'),
(1, 'FW-LDS-001', 'FW-LDS-001', 'Marawi City Hall', 'Marawi WiFi', 'Poblacion', 'Marawi City', 'Lanao del Sur', 'District 1', 'Mindanao', 8.0000, 124.3000, 'Government', 'PLDT', 'Wireless', 50.00, 'DOWN'),
(1, 'FW-ISA-001', 'FW-ISA-001', 'Ilagan City Hall', 'Ilagan WiFi', 'Poblacion', 'Ilagan City', 'Isabela', 'District 1', 'Luzon', 16.9750, 121.8000, 'Government', 'Globe', 'Fiber', 75.00, 'UP');

-- ============================================================
-- 8. SAMPLE SITES (DICT Projects — 5 per project)
-- ============================================================

-- PNPKI sites
INSERT INTO sites (project_id, site_code, location_name, site_name, municipality, province, island_group, latitude, longitude, site_type, isp_provider, last_mile_tech, bw_download, status) VALUES
(2, 'PNPKI-001', 'DICT Central Office', 'PNPKI Main CA', 'Manila', 'Metro Manila', 'Luzon', 14.5995, 120.9842, 'RA Center', 'PLDT', 'Fiber', 100.00, 'UP'),
(2, 'PNPKI-002', 'DICT Region III', 'PNPKI R3 CA', 'San Fernando', 'Pampanga', 'Luzon', 15.0359, 120.6890, 'RA Center', 'Globe', 'Fiber', 75.00, 'UP'),
(2, 'PNPKI-003', 'DICT Region VII', 'PNPKI R7 CA', 'Cebu City', 'Cebu', 'Visayas', 10.3157, 123.8854, 'RA Center', 'PLDT', 'Fiber', 75.00, 'UP'),
(2, 'PNPKI-004', 'DICT Region XI', 'PNPKI R11 CA', 'Davao City', 'Davao del Sur', 'Mindanao', 7.0707, 125.6087, 'RA Center', 'Globe', 'Fiber', 75.00, 'DOWN'),
(2, 'PNPKI-005', 'DICT Region X', 'PNPKI R10 CA', 'Cagayan de Oro', 'Bukidnon', 'Mindanao', 8.4540, 124.6310, 'RA Center', 'PLDT', 'Fiber', 50.00, 'UP');

-- ILCDB sites
INSERT INTO sites (project_id, site_code, location_name, site_name, municipality, province, island_group, latitude, longitude, site_type, isp_provider, last_mile_tech, bw_download, status) VALUES
(3, 'ILCDB-001', 'NAMRIA Main', 'ILCDB Central', 'Manila', 'Metro Manila', 'Luzon', 14.5995, 120.9842, 'Server Room', 'PLDT', 'Fiber', 200.00, 'UP'),
(3, 'ILCDB-002', 'DENR Region IV-A', 'ILCDB R4A', 'Batangas City', 'Batangas', 'Luzon', 13.7565, 121.0583, 'Server Room', 'Globe', 'Fiber', 100.00, 'UP'),
(3, 'ILCDB-003', 'DENR Region VI', 'ILCDB R6', 'Iloilo City', 'Iloilo', 'Visayas', 10.6969, 122.5644, 'Server Room', 'PLDT', 'Fiber', 100.00, 'UP'),
(3, 'ILCDB-004', 'DENR Region IX', 'ILCDB R9', 'Pagadian City', 'Zamboanga del Sur', 'Mindanao', 7.8330, 123.4330, 'Server Room', 'Converge', 'Wireless', 50.00, 'DOWN'),
(3, 'ILCDB-005', 'DENR Region II', 'ILCDB R2', 'Tuguegarao City', 'Cagayan', 'Luzon', 17.6130, 121.7270, 'Server Room', 'Globe', 'Fiber', 75.00, 'UP');

-- IIDB sites
INSERT INTO sites (project_id, site_code, location_name, site_name, municipality, province, island_group, latitude, longitude, site_type, isp_provider, last_mile_tech, bw_download, status) VALUES
(4, 'IIDB-001', 'DTI Central', 'IIDB Main', 'Manila', 'Metro Manila', 'Luzon', 14.5995, 120.9842, 'Server Room', 'PLDT', 'Fiber', 200.00, 'UP'),
(4, 'IIDB-002', 'DTI Region III', 'IIDB R3', 'San Fernando', 'Pampanga', 'Luzon', 15.0359, 120.6890, 'Server Room', 'Globe', 'Fiber', 100.00, 'UP'),
(4, 'IIDB-003', 'DTI Region VII', 'IIDB R7', 'Cebu City', 'Cebu', 'Visayas', 10.3157, 123.8854, 'Server Room', 'PLDT', 'Fiber', 100.00, 'UP'),
(4, 'IIDB-004', 'DTI Region XI', 'IIDB R11', 'Davao City', 'Davao del Sur', 'Mindanao', 7.0707, 125.6087, 'Server Room', 'Globe', 'Fiber', 75.00, 'UP'),
(4, 'IIDB-005', 'DTI Region VIII', 'IIDB R8', 'Tacloban City', 'Leyte', 'Visayas', 11.2440, 125.0040, 'Server Room', 'Converge', 'Wireless', 50.00, 'DOWN');

-- CYBER sites
INSERT INTO sites (project_id, site_code, location_name, site_name, municipality, province, island_group, latitude, longitude, site_type, isp_provider, last_mile_tech, bw_download, status) VALUES
(5, 'CYBER-001', 'DICT NOC', 'Cyber NOC Main', 'Manila', 'Metro Manila', 'Luzon', 14.5995, 120.9842, 'NOC', 'PLDT', 'Fiber', 500.00, 'UP'),
(5, 'CYBER-002', 'DICT SOC R3', 'Cyber SOC R3', 'San Fernando', 'Pampanga', 'Luzon', 15.0359, 120.6890, 'SOC', 'Globe', 'Fiber', 200.00, 'UP'),
(5, 'CYBER-003', 'DICT SOC R7', 'Cyber SOC R7', 'Cebu City', 'Cebu', 'Visayas', 10.3157, 123.8854, 'SOC', 'PLDT', 'Fiber', 200.00, 'UP'),
(5, 'CYBER-004', 'DICT SOC R11', 'Cyber SOC R11', 'Davao City', 'Davao del Sur', 'Mindanao', 7.0707, 125.6087, 'SOC', 'Globe', 'Fiber', 200.00, 'UP'),
(5, 'CYBER-005', 'DICT SOC R10', 'Cyber SOC R10', 'Cagayan de Oro', 'Bukidnon', 'Mindanao', 8.4540, 124.6310, 'SOC', 'Converge', 'Fiber', 150.00, 'DOWN');

-- eLGU sites
INSERT INTO sites (project_id, site_code, location_name, site_name, municipality, province, island_group, latitude, longitude, site_type, isp_provider, last_mile_tech, bw_download, status) VALUES
(6, 'ELGU-001', 'DILG Central', 'eLGU Main', 'Manila', 'Metro Manila', 'Luzon', 14.5995, 120.9842, 'Server Room', 'PLDT', 'Fiber', 200.00, 'UP'),
(6, 'ELGU-002', 'DILG Region IV-A', 'eLGU R4A', 'Batangas City', 'Batangas', 'Luzon', 13.7565, 121.0583, 'Server Room', 'Globe', 'Fiber', 100.00, 'UP'),
(6, 'ELGU-003', 'DILG Region VI', 'eLGU R6', 'Iloilo City', 'Iloilo', 'Visayas', 10.6969, 122.5644, 'Server Room', 'PLDT', 'Fiber', 100.00, 'UP'),
(6, 'ELGU-004', 'DILG Region IX', 'eLGU R9', 'Pagadian City', 'Zamboanga del Sur', 'Mindanao', 7.8330, 123.4330, 'Server Room', 'Globe', 'Wireless', 50.00, 'DOWN'),
(6, 'ELGU-005', 'DILG Region II', 'eLGU R2', 'Tuguegarao City', 'Cagayan', 'Luzon', 17.6130, 121.7270, 'Server Room', 'Converge', 'Fiber', 75.00, 'UP');

-- eGov sites
INSERT INTO sites (project_id, site_code, location_name, site_name, municipality, province, island_group, latitude, longitude, site_type, isp_provider, last_mile_tech, bw_download, status) VALUES
(7, 'EGOV-001', 'DICT eGov Hub', 'eGov Central', 'Manila', 'Metro Manila', 'Luzon', 14.5995, 120.9842, 'Data Center', 'PLDT', 'Fiber', 500.00, 'UP'),
(7, 'EGOV-002', 'DICT eGov R3', 'eGov R3 Hub', 'San Fernando', 'Pampanga', 'Luzon', 15.0359, 120.6890, 'Data Center', 'Globe', 'Fiber', 200.00, 'UP'),
(7, 'EGOV-003', 'DICT eGov R7', 'eGov R7 Hub', 'Cebu City', 'Cebu', 'Visayas', 10.3157, 123.8854, 'Data Center', 'PLDT', 'Fiber', 200.00, 'UP'),
(7, 'EGOV-004', 'DICT eGov R11', 'eGov R11 Hub', 'Davao City', 'Davao del Sur', 'Mindanao', 7.0707, 125.6087, 'Data Center', 'Globe', 'Fiber', 200.00, 'UP'),
(7, 'EGOV-005', 'DICT eGov R8', 'eGov R8 Hub', 'Tacloban City', 'Leyte', 'Visayas', 11.2440, 125.0040, 'Data Center', 'Converge', 'Fiber', 100.00, 'DOWN');

-- GovNet sites
INSERT INTO sites (project_id, site_code, location_name, site_name, municipality, province, island_group, latitude, longitude, site_type, isp_provider, last_mile_tech, bw_download, status) VALUES
(8, 'GOVNET-001', 'GovNet NOC', 'GovNet Central', 'Manila', 'Metro Manila', 'Luzon', 14.5995, 120.9842, 'NOC', 'PLDT', 'Fiber', 1000.00, 'UP'),
(8, 'GOVNET-002', 'GovNet POP R3', 'GovNet R3', 'San Fernando', 'Pampanga', 'Luzon', 15.0359, 120.6890, 'POP', 'Globe', 'Fiber', 500.00, 'UP'),
(8, 'GOVNET-003', 'GovNet POP R7', 'GovNet R7', 'Cebu City', 'Cebu', 'Visayas', 10.3157, 123.8854, 'POP', 'PLDT', 'Fiber', 500.00, 'UP'),
(8, 'GOVNET-004', 'GovNet POP R11', 'GovNet R11', 'Davao City', 'Davao del Sur', 'Mindanao', 7.0707, 125.6087, 'POP', 'Globe', 'Fiber', 500.00, 'UP'),
(8, 'GOVNET-005', 'GovNet POP R10', 'GovNet R10', 'Cagayan de Oro', 'Bukidnon', 'Mindanao', 8.4540, 124.6310, 'POP', 'Converge', 'Fiber', 300.00, 'DOWN');

-- GECS sites
INSERT INTO sites (project_id, site_code, location_name, site_name, municipality, province, island_group, latitude, longitude, site_type, isp_provider, last_mile_tech, bw_download, status) VALUES
(9, 'GECS-001', 'PSA Central', 'GECS Main', 'Manila', 'Metro Manila', 'Luzon', 14.5995, 120.9842, 'Server Room', 'PLDT', 'Fiber', 200.00, 'UP'),
(9, 'GECS-002', 'PSA Region III', 'GECS R3', 'San Fernando', 'Pampanga', 'Luzon', 15.0359, 120.6890, 'Server Room', 'Globe', 'Fiber', 100.00, 'UP'),
(9, 'GECS-003', 'PSA Region VII', 'GECS R7', 'Cebu City', 'Cebu', 'Visayas', 10.3157, 123.8854, 'Server Room', 'PLDT', 'Fiber', 100.00, 'UP'),
(9, 'GECS-004', 'PSA Region XI', 'GECS R11', 'Davao City', 'Davao del Sur', 'Mindanao', 7.0707, 125.6087, 'Server Room', 'Globe', 'Fiber', 75.00, 'DOWN'),
(9, 'GECS-005', 'PSA Region VIII', 'GECS R8', 'Tacloban City', 'Leyte', 'Visayas', 11.2440, 125.0040, 'Server Room', 'Converge', 'Wireless', 50.00, 'UP');

-- ============================================================
-- 9. SAMPLE FREE WIFI DAILY LOGS (last 7 days for first 5 sites)
-- ============================================================

INSERT INTO free_wifi_daily_logs (site_id, log_date, status, bandwidth_utilization, total_unique_users, remarks, logged_by) VALUES
-- Site 1 (FW-NCR-001) — always UP
(1, CURDATE() - INTERVAL 6 DAY, 'UP', 78.50, 245, 'Normal operations', 4),
(1, CURDATE() - INTERVAL 5 DAY, 'UP', 82.30, 312, 'High traffic', 4),
(1, CURDATE() - INTERVAL 4 DAY, 'UP', 75.10, 289, NULL, 4),
(1, CURDATE() - INTERVAL 3 DAY, 'UP', 80.00, 301, NULL, 4),
(1, CURDATE() - INTERVAL 2 DAY, 'UP', 85.20, 356, 'Peak usage', 4),
(1, CURDATE() - INTERVAL 1 DAY, 'UP', 79.40, 278, NULL, 4),
(1, CURDATE(), 'UP', 81.00, 290, NULL, 4),
-- Site 2 (FW-NCR-002) — always UP
(2, CURDATE() - INTERVAL 6 DAY, 'UP', 65.00, 189, NULL, 4),
(2, CURDATE() - INTERVAL 5 DAY, 'UP', 70.20, 210, NULL, 4),
(2, CURDATE() - INTERVAL 4 DAY, 'UP', 68.50, 195, NULL, 4),
(2, CURDATE() - INTERVAL 3 DAY, 'UP', 72.00, 220, NULL, 4),
(2, CURDATE() - INTERVAL 2 DAY, 'UP', 74.30, 235, NULL, 4),
(2, CURDATE() - INTERVAL 1 DAY, 'UP', 69.80, 200, NULL, 4),
(2, CURDATE(), 'UP', 71.50, 215, NULL, 4),
-- Site 3 (FW-NCR-003) — always UP
(3, CURDATE() - INTERVAL 6 DAY, 'UP', 90.00, 450, 'Very high traffic', 4),
(3, CURDATE() - INTERVAL 5 DAY, 'UP', 88.50, 420, NULL, 4),
(3, CURDATE() - INTERVAL 4 DAY, 'UP', 92.10, 480, 'Congestion observed', 4),
(3, CURDATE() - INTERVAL 3 DAY, 'UP', 87.00, 410, NULL, 4),
(3, CURDATE() - INTERVAL 2 DAY, 'UP', 91.50, 465, NULL, 4),
(3, CURDATE() - INTERVAL 1 DAY, 'UP', 89.00, 430, NULL, 4),
(3, CURDATE(), 'UP', 93.00, 490, 'Near capacity', 4),
-- Site 4 (FW-NCR-004) — DOWN for last 2 days
(4, CURDATE() - INTERVAL 6 DAY, 'UP', 55.00, 120, NULL, 4),
(4, CURDATE() - INTERVAL 5 DAY, 'UP', 58.20, 135, NULL, 4),
(4, CURDATE() - INTERVAL 4 DAY, 'UP', 52.00, 110, NULL, 4),
(4, CURDATE() - INTERVAL 3 DAY, 'DOWN', 0.00, 0, 'Fiber cut reported', 4),
(4, CURDATE() - INTERVAL 1 DAY, 'DOWN', 0.00, 0, 'Still down, waiting for ISP', 4),
(4, CURDATE(), 'DOWN', 0.00, 0, 'Escalated to PLDT', 4),
-- Site 5 (FW-NCR-005) — always UP
(5, CURDATE() - INTERVAL 6 DAY, 'UP', 45.00, 520, NULL, 4),
(5, CURDATE() - INTERVAL 5 DAY, 'UP', 48.30, 580, NULL, 4),
(5, CURDATE() - INTERVAL 4 DAY, 'UP', 42.00, 490, NULL, 4),
(5, CURDATE() - INTERVAL 3 DAY, 'UP', 50.00, 610, NULL, 4),
(5, CURDATE() - INTERVAL 2 DAY, 'UP', 47.50, 560, NULL, 4),
(5, CURDATE() - INTERVAL 1 DAY, 'UP', 44.00, 500, NULL, 4),
(5, CURDATE(), 'UP', 49.00, 590, NULL, 4);

-- ============================================================
-- 10. SAMPLE MILESTONES (PNPKI project)
-- ============================================================

INSERT INTO milestones (project_id, site_id, title, target_date, actual_date, status, description) VALUES
(2, NULL, 'Requirements Gathering', CURDATE() - INTERVAL 90 DAY, CURDATE() - INTERVAL 85 DAY, 'COMPLETED', 'Gathered all CA/RA requirements from stakeholders'),
(2, NULL, 'Infrastructure Setup', CURDATE() - INTERVAL 60 DAY, CURDATE() - INTERVAL 55 DAY, 'COMPLETED', 'Deployed server infrastructure at all regional offices'),
(2, NULL, 'CA System Installation', CURDATE() - INTERVAL 30 DAY, CURDATE() - INTERVAL 25 DAY, 'COMPLETED', 'Installed Certificate Authority systems'),
(2, NULL, 'RA System Deployment', CURDATE() - INTERVAL 14 DAY, NULL, 'IN_PROGRESS', 'Deploying Registration Authority systems at regional offices'),
(2, NULL, 'Integration Testing', CURDATE() + INTERVAL 7 DAY, NULL, 'PENDING', 'End-to-end integration testing of CA/RA systems'),
(2, NULL, 'Go-Live', CURDATE() + INTERVAL 30 DAY, NULL, 'PENDING', 'Full production launch of PNPKI system');

-- ============================================================
-- 11. SAMPLE DICT PROJECT ENTRIES (PNPKI)
-- ============================================================

INSERT INTO dict_project_entries (project_id, site_id, entry_date, status, accomplishment_percent, deliverables, remarks, updated_by) VALUES
(2, 31, CURDATE() - INTERVAL 85 DAY, 'COMPLETED', 100.00, 'Requirements document signed off', 'All stakeholders approved', 5),
(2, 31, CURDATE() - INTERVAL 55 DAY, 'COMPLETED', 100.00, 'Servers installed and configured', 'All 5 regional sites ready', 5),
(2, 31, CURDATE() - INTERVAL 25 DAY, 'COMPLETED', 100.00, 'CA software deployed', 'Central CA operational', 5),
(2, 32, CURDATE() - INTERVAL 10 DAY, 'ONGOING', 75.00, 'RA software installation in progress', '3 of 5 regional RAs deployed', 5),
(2, 33, CURDATE() - INTERVAL 5 DAY, 'ONGOING', 60.00, 'RA system configuration', 'Pending network setup', 5),
(2, 34, CURDATE(), 'DELAYED', 30.00, 'Initial setup delayed due to power issues', 'Waiting for generator installation', 5);

-- ============================================================
-- 12. USER PROJECT ACCESS
-- ============================================================

-- Admin: all projects
INSERT INTO user_project_access (user_id, project_id, access_level)
SELECT 1, id, 'admin' FROM projects;

-- Maria Santos (PM): Free WiFi + PNPKI
INSERT INTO user_project_access (user_id, project_id, access_level) VALUES
(2, 1, 'admin'), (2, 2, 'edit');

-- Juan Dela Cruz (PM): DICT Projects
INSERT INTO user_project_access (user_id, project_id, access_level)
SELECT 3, id, 'edit' FROM projects WHERE type = 'milestone';

-- Ana Reyes (Encoder): Free WiFi only
INSERT INTO user_project_access (user_id, project_id, access_level) VALUES
(4, 1, 'edit');

-- Pedro Garcia (Encoder): DICT Projects
INSERT INTO user_project_access (user_id, project_id, access_level)
SELECT 5, id, 'edit' FROM projects WHERE type = 'milestone';

-- Luz Villanueva (Viewer): all projects read-only
INSERT INTO user_project_access (user_id, project_id, access_level)
SELECT 6, id, 'view' FROM projects;

-- ============================================================
-- 13. SAMPLE AUDIT LOGS
-- ============================================================

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent) VALUES
(1, 'user.login', 'user', 1, '127.0.0.1', 'Mozilla/5.0'),
(1, 'project.create', 'project', 1, '127.0.0.1', 'Mozilla/5.0'),
(4, 'log.create', 'free_wifi_daily_log', 1, '127.0.0.1', 'Mozilla/5.0'),
(5, 'entry.create', 'dict_project_entry', 1, '127.0.0.1', 'Mozilla/5.0'),
(2, 'site.update', 'site', 4, '127.0.0.1', 'Mozilla/5.0');
