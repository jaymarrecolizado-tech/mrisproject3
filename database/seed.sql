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
('Admin User', 'admin@dict.gov.ph', '$2y$10$W4jg3bd3VzXaC22IcbGRiOCJRFMgeSDbKg06aLcp/GyU03yUTJ0Ne', 1, 'ICT Infrastructure', 1),
('Maria Santos', 'maria.santos@dict.gov.ph', '$2y$10$W4jg3bd3VzXaC22IcbGRiOCJRFMgeSDbKg06aLcp/GyU03yUTJ0Ne', 2, 'Free WiFi Program', 1),
('Juan Dela Cruz', 'juan.delacruz@dict.gov.ph', '$2y$10$W4jg3bd3VzXaC22IcbGRiOCJRFMgeSDbKg06aLcp/GyU03yUTJ0Ne', 2, 'DICT Projects', 1),
('Ana Reyes', 'ana.reyes@dict.gov.ph', '$2y$10$W4jg3bd3VzXaC22IcbGRiOCJRFMgeSDbKg06aLcp/GyU03yUTJ0Ne', 3, 'Free WiFi Program', 1),
('Pedro Garcia', 'pedro.garcia@dict.gov.ph', '$2y$10$W4jg3bd3VzXaC22IcbGRiOCJRFMgeSDbKg06aLcp/GyU03yUTJ0Ne', 3, 'DICT Projects', 1),
('Luz Villanueva', 'luz.villanueva@dict.gov.ph', '$2y$10$W4jg3bd3VzXaC22IcbGRiOCJRFMgeSDbKg06aLcp/GyU03yUTJ0Ne', 4, 'Management', 1);

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
-- 6. GEOGRAPHIC DATA — Region 2 (Cagayan Valley)
-- ============================================================

INSERT INTO provinces (name, region, island_group, latitude, longitude) VALUES
('Batanes', 'Region II', 'Luzon', 20.4500, 121.9700),
('Cagayan', 'Region II', 'Luzon', 17.8700, 121.7740),
('Isabela', 'Region II', 'Luzon', 16.9750, 121.8000),
('Nueva Vizcaya', 'Region II', 'Luzon', 16.3500, 121.1500),
('Quirino', 'Region II', 'Luzon', 16.2700, 121.5300);

-- ============================================================
-- 7. FREE WIFI SITES — Region 2 (20 sites)
-- ============================================================

INSERT INTO sites (project_id, nationwide_id, site_code, location_name, site_name, barangay, municipality, province, district, island_group, latitude, longitude, site_type, isp_provider, last_mile_tech, bw_download, status) VALUES
-- Batanes (3)
(1, 'FW-R02-BTN-001', 'FW-R02-BTN-001', 'Basco Municipal Hall', 'Basco Free WiFi', 'San Juan', 'Basco', 'Batanes', 'District 1', 'Luzon', 20.4520, 121.9720, 'Government', 'Globe', 'Wireless', 50.00, 'UP'),
(1, 'FW-R02-BTN-002', 'FW-R02-BTN-002', 'Basco Port Area', 'Basco Port WiFi', 'Kaypayan', 'Basco', 'Batanes', 'District 1', 'Luzon', 20.4480, 121.9680, 'Public Area', 'Globe', 'Wireless', 50.00, 'UP'),
(1, 'FW-R02-BTN-003', 'FW-R02-BTN-003', 'Itbayat Municipal Hall', 'Itbayat WiFi', 'Poblacion', 'Itbayat', 'Batanes', 'District 1', 'Luzon', 20.6500, 121.8500, 'Government', 'Globe', 'Satellite', 20.00, 'UP'),
-- Cagayan (5)
(1, 'FW-R02-CAG-001', 'FW-R02-CAG-001', 'Tuguegarao City Hall', 'Tuguegarao WiFi', 'Poblacion', 'Tuguegarao City', 'Cagayan', 'District 1', 'Luzon', 17.6130, 121.7270, 'Government', 'PLDT', 'Fiber', 100.00, 'UP'),
(1, 'FW-R02-CAG-002', 'FW-R02-CAG-002', 'Cagayan Provincial Capitol', 'Capitol WiFi', 'Caritan Centro', 'Tuguegarao City', 'Cagayan', 'District 1', 'Luzon', 17.6200, 121.7300, 'Government', 'Globe', 'Fiber', 100.00, 'UP'),
(1, 'FW-R02-CAG-003', 'FW-R02-CAG-003', 'Aparri Municipal Hall', 'Aparri WiFi', 'Poblacion', 'Aparri', 'Cagayan', 'District 1', 'Luzon', 18.3600, 121.6400, 'Government', 'Globe', 'Fiber', 75.00, 'UP'),
(1, 'FW-R02-CAG-004', 'FW-R02-CAG-004', 'Aparri Port Area', 'Aparri Port WiFi', 'Poblacion', 'Aparri', 'Cagayan', 'District 1', 'Luzon', 18.3650, 121.6350, 'Public Area', 'Globe', 'Fiber', 50.00, 'DOWN'),
(1, 'FW-R02-CAG-005', 'FW-R02-CAG-005', 'Enrile Municipal Hall', 'Enrile WiFi', 'Poblacion', 'Enrile', 'Cagayan', 'District 1', 'Luzon', 17.5500, 121.7000, 'Government', 'PLDT', 'Fiber', 50.00, 'UP'),
-- Isabela (5)
(1, 'FW-R02-ISA-001', 'FW-R02-ISA-001', 'Ilagan City Hall', 'Ilagan WiFi', 'Poblacion', 'Ilagan City', 'Isabela', 'District 1', 'Luzon', 16.9750, 121.8000, 'Government', 'PLDT', 'Fiber', 100.00, 'UP'),
(1, 'FW-R02-ISA-002', 'FW-R02-ISA-002', 'Cauayan City Hall', 'Cauayan WiFi', 'Poblacion', 'Cauayan City', 'Isabela', 'District 1', 'Luzon', 16.7500, 121.7700, 'Government', 'PLDT', 'Fiber', 75.00, 'UP'),
(1, 'FW-R02-ISA-003', 'FW-R02-ISA-003', 'Santiago City Hall', 'Santiago WiFi', 'Poblacion', 'Santiago City', 'Isabela', 'District 2', 'Luzon', 16.6900, 121.5500, 'Government', 'Globe', 'Fiber', 100.00, 'UP'),
(1, 'FW-R02-ISA-004', 'FW-R02-ISA-004', 'Roxas Municipal Hall', 'Roxas WiFi', 'Poblacion', 'Roxas', 'Isabela', 'District 1', 'Luzon', 16.8500, 121.6500, 'Government', 'PLDT', 'Fiber', 50.00, 'DOWN'),
(1, 'FW-R02-ISA-005', 'FW-R02-ISA-005', 'Cabagan Municipal Hall', 'Cabagan WiFi', 'Poblacion', 'Cabagan', 'Isabela', 'District 1', 'Luzon', 17.3500, 121.7800, 'Government', 'Converge', 'Fiber', 50.00, 'UP'),
-- Nueva Vizcaya (4)
(1, 'FW-R02-NVZ-001', 'FW-R02-NVZ-001', 'Bayombong Municipal Hall', 'Bayombong WiFi', 'Poblacion', 'Bayombong', 'Nueva Vizcaya', 'District 1', 'Luzon', 16.4500, 121.1500, 'Government', 'PLDT', 'Fiber', 75.00, 'UP'),
(1, 'FW-R02-NVZ-002', 'FW-R02-NVZ-002', 'Solano Municipal Hall', 'Solano WiFi', 'Poblacion', 'Solano', 'Nueva Vizcaya', 'District 1', 'Luzon', 16.5500, 121.2000, 'Government', 'PLDT', 'Fiber', 50.00, 'UP'),
(1, 'FW-R02-NVZ-003', 'FW-R02-NVZ-003', 'Bambang Municipal Hall', 'Bambang WiFi', 'Poblacion', 'Bambang', 'Nueva Vizcaya', 'District 1', 'Luzon', 16.4000, 121.1000, 'Government', 'Globe', 'Fiber', 50.00, 'DOWN'),
(1, 'FW-R02-NVZ-004', 'FW-R02-NVZ-004', 'Bagabag Municipal Hall', 'Bagabag WiFi', 'Poblacion', 'Bagabag', 'Nueva Vizcaya', 'District 1', 'Luzon', 16.5000, 121.2500, 'Government', 'PLDT', 'Fiber', 50.00, 'UP'),
-- Quirino (3)
(1, 'FW-R02-QRN-001', 'FW-R02-QRN-001', 'Cabarroguis Municipal Hall', 'Cabarroguis WiFi', 'Poblacion', 'Cabarroguis', 'Quirino', 'District 1', 'Luzon', 16.3500, 121.5000, 'Government', 'Globe', 'Fiber', 50.00, 'UP'),
(1, 'FW-R02-QRN-002', 'FW-R02-QRN-002', 'Diffun Municipal Hall', 'Diffun WiFi', 'Poblacion', 'Diffun', 'Quirino', 'District 1', 'Luzon', 16.2500, 121.4500, 'Government', 'Converge', 'Wireless', 30.00, 'UP'),
(1, 'FW-R02-QRN-003', 'FW-R02-QRN-003', 'Maddela Municipal Hall', 'Maddela WiFi', 'Poblacion', 'Maddela', 'Quirino', 'District 1', 'Luzon', 16.3000, 121.6000, 'Government', 'Converge', 'Wireless', 30.00, 'DOWN');

-- ============================================================
-- 8. DICT PROJECT SITES — Region 2 (5 per project = 40 sites)
-- ============================================================

-- PNPKI Region 2
INSERT INTO sites (project_id, site_code, location_name, site_name, municipality, province, island_group, latitude, longitude, site_type, isp_provider, last_mile_tech, bw_download, status) VALUES
(2, 'PNPKI-R02-001', 'DICT Region II Office', 'PNPKI R2 RA Center', 'Tuguegarao City', 'Cagayan', 'Luzon', 17.6130, 121.7270, 'RA Center', 'PLDT', 'Fiber', 100.00, 'UP'),
(2, 'PNPKI-R02-002', 'PSA Isabela', 'PNPKI Isabela RA', 'Ilagan City', 'Isabela', 'Luzon', 16.9750, 121.8000, 'RA Center', 'Globe', 'Fiber', 75.00, 'UP'),
(2, 'PNPKI-R02-003', 'PSA Nueva Vizcaya', 'PNPKI NV RA', 'Bayombong', 'Nueva Vizcaya', 'Luzon', 16.4500, 121.1500, 'RA Center', 'Converge', 'Fiber', 50.00, 'UP'),
(2, 'PNPKI-R02-004', 'PSA Quirino', 'PNPKI Quirino RA', 'Cabarroguis', 'Quirino', 'Luzon', 16.3500, 121.5000, 'RA Center', 'Globe', 'Wireless', 30.00, 'DOWN'),
(2, 'PNPKI-R02-005', 'PSA Batanes', 'PNPKI Batanes RA', 'Basco', 'Batanes', 'Luzon', 20.4520, 121.9720, 'RA Center', 'Globe', 'Satellite', 20.00, 'UP'),

-- ILCDB Region 2
(3, 'ILCDB-R02-001', 'DENR R2 Office', 'ILCDB R2 Server', 'Tuguegarao City', 'Cagayan', 'Luzon', 17.6200, 121.7300, 'Server Room', 'PLDT', 'Fiber', 100.00, 'UP'),
(3, 'ILCDB-R02-002', 'DENR Isabela', 'ILCDB Isabela', 'Ilagan City', 'Isabela', 'Luzon', 16.9800, 121.8050, 'Server Room', 'Globe', 'Fiber', 75.00, 'UP'),
(3, 'ILCDB-R02-003', 'DENR NV', 'ILCDB Nueva Vizcaya', 'Bayombong', 'Nueva Vizcaya', 'Luzon', 16.4550, 121.1550, 'Server Room', 'Converge', 'Fiber', 50.00, 'UP'),
(3, 'ILCDB-R02-004', 'DENR Quirino', 'ILCDB Quirino', 'Cabarroguis', 'Quirino', 'Luzon', 16.3550, 121.5050, 'Server Room', 'Globe', 'Wireless', 30.00, 'DOWN'),
(3, 'ILCDB-R02-005', 'CENRO Aparri', 'ILCDB Aparri', 'Aparri', 'Cagayan', 'Luzon', 18.3600, 121.6400, 'Server Room', 'Globe', 'Fiber', 50.00, 'UP'),

-- IIDB Region 2
(4, 'IIDB-R02-001', 'DTI R2 Office', 'IIDB R2 Server', 'Tuguegarao City', 'Cagayan', 'Luzon', 17.6130, 121.7270, 'Server Room', 'PLDT', 'Fiber', 100.00, 'UP'),
(4, 'IIDB-R02-002', 'DTI Isabela', 'IIDB Isabela', 'Ilagan City', 'Isabela', 'Luzon', 16.9750, 121.8000, 'Server Room', 'Globe', 'Fiber', 75.00, 'UP'),
(4, 'IIDB-R02-003', 'DTI Santiago', 'IIDB Santiago', 'Santiago City', 'Isabela', 'Luzon', 16.6900, 121.5500, 'Server Room', 'Converge', 'Fiber', 75.00, 'UP'),
(4, 'IIDB-R02-004', 'DTI NV', 'IIDB Nueva Vizcaya', 'Solano', 'Nueva Vizcaya', 'Luzon', 16.5500, 121.2000, 'Server Room', 'Globe', 'Fiber', 50.00, 'DOWN'),
(4, 'IIDB-R02-005', 'DTI Quirino', 'IIDB Quirino', 'Cabarroguis', 'Quirino', 'Luzon', 16.3500, 121.5000, 'Server Room', 'Converge', 'Wireless', 30.00, 'UP'),

-- CYBER Region 2
(5, 'CYBER-R02-001', 'DICT R2 SOC', 'Cyber SOC R2', 'Tuguegarao City', 'Cagayan', 'Luzon', 17.6130, 121.7270, 'SOC', 'PLDT', 'Fiber', 200.00, 'UP'),
(5, 'CYBER-R02-002', 'DICT Isabela SOC', 'Cyber SOC Isabela', 'Ilagan City', 'Isabela', 'Luzon', 16.9750, 121.8000, 'SOC', 'Globe', 'Fiber', 150.00, 'UP'),
(5, 'CYBER-R02-003', 'DICT Santiago SOC', 'Cyber SOC Santiago', 'Santiago City', 'Isabela', 'Luzon', 16.6900, 121.5500, 'SOC', 'Converge', 'Fiber', 150.00, 'UP'),
(5, 'CYBER-R02-004', 'DICT NV SOC', 'Cyber SOC NV', 'Bayombong', 'Nueva Vizcaya', 'Luzon', 16.4500, 121.1500, 'SOC', 'Globe', 'Fiber', 100.00, 'DOWN'),
(5, 'CYBER-R02-005', 'DICT Quirino SOC', 'Cyber SOC Quirino', 'Cabarroguis', 'Quirino', 'Luzon', 16.3500, 121.5000, 'SOC', 'Globe', 'Wireless', 75.00, 'UP'),

-- eLGU Region 2
(6, 'ELGU-R02-001', 'DILG R2 Office', 'eLGU R2 Server', 'Tuguegarao City', 'Cagayan', 'Luzon', 17.6130, 121.7270, 'Server Room', 'PLDT', 'Fiber', 100.00, 'UP'),
(6, 'ELGU-R02-002', 'DILG Isabela', 'eLGU Isabela', 'Ilagan City', 'Isabela', 'Luzon', 16.9750, 121.8000, 'Server Room', 'Globe', 'Fiber', 75.00, 'UP'),
(6, 'ELGU-R02-003', 'DILG Santiago', 'eLGU Santiago', 'Santiago City', 'Isabela', 'Luzon', 16.6900, 121.5500, 'Server Room', 'Converge', 'Fiber', 75.00, 'UP'),
(6, 'ELGU-R02-004', 'DILG NV', 'eLGU Nueva Vizcaya', 'Bayombong', 'Nueva Vizcaya', 'Luzon', 16.4500, 121.1500, 'Server Room', 'Globe', 'Fiber', 50.00, 'DOWN'),
(6, 'ELGU-R02-005', 'DILG Quirino', 'eLGU Quirino', 'Cabarroguis', 'Quirino', 'Luzon', 16.3500, 121.5000, 'Server Room', 'Globe', 'Wireless', 30.00, 'UP'),

-- eGov Region 2
(7, 'EGOV-R02-001', 'DICT R2 Hub', 'eGov R2 Hub', 'Tuguegarao City', 'Cagayan', 'Luzon', 17.6130, 121.7270, 'Data Center', 'PLDT', 'Fiber', 200.00, 'UP'),
(7, 'EGOV-R02-002', 'DICT Isabela Hub', 'eGov Isabela', 'Ilagan City', 'Isabela', 'Luzon', 16.9750, 121.8000, 'Data Center', 'Globe', 'Fiber', 150.00, 'UP'),
(7, 'EGOV-R02-003', 'DICT Santiago Hub', 'eGov Santiago', 'Santiago City', 'Isabela', 'Luzon', 16.6900, 121.5500, 'Data Center', 'Converge', 'Fiber', 150.00, 'UP'),
(7, 'EGOV-R02-004', 'DICT NV Hub', 'eGov Nueva Vizcaya', 'Solano', 'Nueva Vizcaya', 'Luzon', 16.5500, 121.2000, 'Data Center', 'Globe', 'Fiber', 100.00, 'DOWN'),
(7, 'EGOV-R02-005', 'DICT Quirino Hub', 'eGov Quirino', 'Cabarroguis', 'Quirino', 'Luzon', 16.3500, 121.5000, 'Data Center', 'Globe', 'Wireless', 75.00, 'UP'),

-- GovNet Region 2
(8, 'GOVNET-R02-001', 'GovNet R2 POP', 'GovNet R2 POP', 'Tuguegarao City', 'Cagayan', 'Luzon', 17.6130, 121.7270, 'POP', 'PLDT', 'Fiber', 500.00, 'UP'),
(8, 'GOVNET-R02-002', 'GovNet Isabela POP', 'GovNet Isabela', 'Ilagan City', 'Isabela', 'Luzon', 16.9750, 121.8000, 'POP', 'Globe', 'Fiber', 300.00, 'UP'),
(8, 'GOVNET-R02-003', 'GovNet Santiago POP', 'GovNet Santiago', 'Santiago City', 'Isabela', 'Luzon', 16.6900, 121.5500, 'POP', 'Converge', 'Fiber', 300.00, 'UP'),
(8, 'GOVNET-R02-004', 'GovNet NV POP', 'GovNet Nueva Vizcaya', 'Bayombong', 'Nueva Vizcaya', 'Luzon', 16.4500, 121.1500, 'POP', 'Globe', 'Fiber', 200.00, 'DOWN'),
(8, 'GOVNET-R02-005', 'GovNet Quirino POP', 'GovNet Quirino', 'Cabarroguis', 'Quirino', 'Luzon', 16.3500, 121.5000, 'POP', 'Globe', 'Wireless', 100.00, 'UP'),

-- GECS Region 2
(9, 'GECS-R02-001', 'PSA R2 Office', 'GECS R2 Server', 'Tuguegarao City', 'Cagayan', 'Luzon', 17.6130, 121.7270, 'Server Room', 'PLDT', 'Fiber', 100.00, 'UP'),
(9, 'GECS-R02-002', 'PSA Isabela', 'GECS Isabela', 'Ilagan City', 'Isabela', 'Luzon', 16.9750, 121.8000, 'Server Room', 'Globe', 'Fiber', 75.00, 'UP'),
(9, 'GECS-R02-003', 'PSA Santiago', 'GECS Santiago', 'Santiago City', 'Isabela', 'Luzon', 16.6900, 121.5500, 'Server Room', 'Converge', 'Fiber', 75.00, 'UP'),
(9, 'GECS-R02-004', 'PSA NV', 'GECS Nueva Vizcaya', 'Bayombong', 'Nueva Vizcaya', 'Luzon', 16.4500, 121.1500, 'Server Room', 'Globe', 'Fiber', 50.00, 'DOWN'),
(9, 'GECS-R02-005', 'PSA Quirino', 'GECS Quirino', 'Cabarroguis', 'Quirino', 'Luzon', 16.3500, 121.5000, 'Server Room', 'Globe', 'Wireless', 30.00, 'UP');

-- ============================================================
-- 9. SAMPLE FREE WIFI DAILY LOGS (Region 2 — last 7 days)
-- ============================================================

-- Tuguegarao City Hall (high traffic, always UP)
INSERT INTO free_wifi_daily_logs (site_id, log_date, status, bandwidth_utilization, total_unique_users, remarks, logged_by) VALUES
-- Site IDs are auto-increment; reference by code via subquery
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-001'), CURDATE() - INTERVAL 6 DAY, 'UP', 85.00, 520, 'High traffic', 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-001'), CURDATE() - INTERVAL 5 DAY, 'UP', 88.50, 580, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-001'), CURDATE() - INTERVAL 4 DAY, 'UP', 82.10, 490, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-001'), CURDATE() - INTERVAL 3 DAY, 'UP', 90.00, 610, 'Peak usage', 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-001'), CURDATE() - INTERVAL 2 DAY, 'UP', 87.50, 560, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-001'), CURDATE() - INTERVAL 1 DAY, 'UP', 84.00, 500, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-001'), CURDATE(), 'UP', 91.00, 630, 'Near capacity', 4);

-- Aparri Port (went DOWN recently)
INSERT INTO free_wifi_daily_logs (site_id, log_date, status, bandwidth_utilization, total_unique_users, remarks, logged_by) VALUES
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-004'), CURDATE() - INTERVAL 6 DAY, 'UP', 45.00, 120, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-004'), CURDATE() - INTERVAL 5 DAY, 'UP', 48.20, 135, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-004'), CURDATE() - INTERVAL 4 DAY, 'UP', 42.00, 110, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-004'), CURDATE() - INTERVAL 3 DAY, 'DOWN', 0.00, 0, 'Equipment failure', 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-004'), CURDATE() - INTERVAL 2 DAY, 'DOWN', 0.00, 0, 'Waiting for replacement', 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-004'), CURDATE() - INTERVAL 1 DAY, 'DOWN', 0.00, 0, 'Still down', 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-004'), CURDATE(), 'DOWN', 0.00, 0, 'Escalated to Globe', 4);

-- Ilagan City Hall (steady traffic)
INSERT INTO free_wifi_daily_logs (site_id, log_date, status, bandwidth_utilization, total_unique_users, remarks, logged_by) VALUES
((SELECT id FROM sites WHERE site_code = 'FW-R02-ISA-001'), CURDATE() - INTERVAL 6 DAY, 'UP', 72.00, 340, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-ISA-001'), CURDATE() - INTERVAL 5 DAY, 'UP', 75.50, 380, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-ISA-001'), CURDATE() - INTERVAL 4 DAY, 'UP', 70.00, 310, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-ISA-001'), CURDATE() - INTERVAL 3 DAY, 'UP', 78.00, 400, 'High traffic', 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-ISA-001'), CURDATE() - INTERVAL 2 DAY, 'UP', 74.50, 360, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-ISA-001'), CURDATE() - INTERVAL 1 DAY, 'UP', 71.00, 330, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-ISA-001'), CURDATE(), 'UP', 76.00, 370, NULL, 4);

-- Bambang NV (went DOWN)
INSERT INTO free_wifi_daily_logs (site_id, log_date, status, bandwidth_utilization, total_unique_users, remarks, logged_by) VALUES
((SELECT id FROM sites WHERE site_code = 'FW-R02-NVZ-003'), CURDATE() - INTERVAL 6 DAY, 'UP', 55.00, 200, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-NVZ-003'), CURDATE() - INTERVAL 5 DAY, 'UP', 58.20, 220, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-NVZ-003'), CURDATE() - INTERVAL 4 DAY, 'UP', 52.00, 190, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-NVZ-003'), CURDATE() - INTERVAL 3 DAY, 'UP', 60.00, 240, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-NVZ-003'), CURDATE() - INTERVAL 2 DAY, 'DOWN', 0.00, 0, 'Power outage', 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-NVZ-003'), CURDATE() - INTERVAL 1 DAY, 'DOWN', 0.00, 0, 'ISP fiber cut', 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-NVZ-003'), CURDATE(), 'DOWN', 0.00, 0, 'Escalated', 4);

-- Cabarroguis Quirino (stable)
INSERT INTO free_wifi_daily_logs (site_id, log_date, status, bandwidth_utilization, total_unique_users, remarks, logged_by) VALUES
((SELECT id FROM sites WHERE site_code = 'FW-R02-QRN-001'), CURDATE() - INTERVAL 6 DAY, 'UP', 40.00, 150, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-QRN-001'), CURDATE() - INTERVAL 5 DAY, 'UP', 42.50, 165, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-QRN-001'), CURDATE() - INTERVAL 4 DAY, 'UP', 38.00, 140, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-QRN-001'), CURDATE() - INTERVAL 3 DAY, 'UP', 45.00, 180, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-QRN-001'), CURDATE() - INTERVAL 2 DAY, 'UP', 43.50, 170, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-QRN-001'), CURDATE() - INTERVAL 1 DAY, 'UP', 41.00, 155, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-QRN-001'), CURDATE(), 'UP', 44.00, 175, NULL, 4);

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
(2, (SELECT id FROM sites WHERE site_code = 'PNPKI-R02-001'), CURDATE() - INTERVAL 85 DAY, 'COMPLETED', 100.00, 'Requirements document signed off', 'All stakeholders approved', 5),
(2, (SELECT id FROM sites WHERE site_code = 'PNPKI-R02-001'), CURDATE() - INTERVAL 55 DAY, 'COMPLETED', 100.00, 'Servers installed and configured', 'All 5 regional sites ready', 5),
(2, (SELECT id FROM sites WHERE site_code = 'PNPKI-R02-001'), CURDATE() - INTERVAL 25 DAY, 'COMPLETED', 100.00, 'CA software deployed', 'Central CA operational', 5),
(2, (SELECT id FROM sites WHERE site_code = 'PNPKI-R02-002'), CURDATE() - INTERVAL 10 DAY, 'ONGOING', 75.00, 'RA software installation in progress', '3 of 5 regional RAs deployed', 5),
(2, (SELECT id FROM sites WHERE site_code = 'PNPKI-R02-003'), CURDATE() - INTERVAL 5 DAY, 'ONGOING', 60.00, 'RA system configuration', 'Pending network setup', 5),
(2, (SELECT id FROM sites WHERE site_code = 'PNPKI-R02-004'), CURDATE(), 'DELAYED', 30.00, 'Initial setup delayed due to power issues', 'Waiting for generator installation', 5);

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
