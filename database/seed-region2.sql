-- ============================================================
-- DICT MRIS — Region 2 (Cagayan Valley) Test Data
-- Covers: Batanes, Cagayan, Isabela, Nueva Vizcaya, Quirino
-- Run AFTER schema.sql and seed.sql
-- ============================================================

USE dict_mris;

-- ============================================================
-- 1. REGION 2 PROVINCES
-- ============================================================

INSERT INTO provinces (name, region, island_group, latitude, longitude) VALUES
('Batanes', 'Region II', 'Luzon', 20.4500, 121.9700),
('Cagayan', 'Region II', 'Luzon', 17.8700, 121.7740),
('Isabela', 'Region II', 'Luzon', 16.9750, 121.8000),
('Nueva Vizcaya', 'Region II', 'Luzon', 16.3500, 121.1500),
('Quirino', 'Region II', 'Luzon', 16.2700, 121.5300);

-- ============================================================
-- 2. FREE WIFI SITES — REGION 2 (50 sites)
-- ============================================================

-- Batanes (8 sites)
INSERT INTO sites (project_id, site_code, location_name, site_name, barangay, municipality, province, district, island_group, latitude, longitude, site_type, isp_provider, last_mile_tech, bw_download, status) VALUES
(1, 'FW-R02-BTN-001', 'Basco Municipal Hall', 'Basco Free WiFi', 'San Juan', 'Basco', 'Batanes', 'District 1', 'Luzon', 20.4520, 121.9720, 'Government', 'Globe', 'Wireless', 50.00, 'UP'),
(1, 'FW-R02-BTN-002', 'Basco Port Area', 'Basco Port WiFi', 'Kaypayan', 'Basco', 'Batanes', 'District 1', 'Luzon', 20.4480, 121.9680, 'Public Area', 'Globe', 'Wireless', 50.00, 'UP'),
(1, 'FW-R02-BTN-003', 'Basco Airport', 'Basco Airport WiFi', 'San Carlos', 'Basco', 'Batanes', 'District 1', 'Luzon', 20.4550, 121.9750, 'Public Area', 'Globe', 'Wireless', 30.00, 'UP'),
(1, 'FW-R02-BTN-004', 'Itbayat Municipal Hall', 'Itbayat WiFi', 'Poblacion', 'Itbayat', 'Batanes', 'District 1', 'Luzon', 20.6500, 121.8500, 'Government', 'Globe', 'Satellite', 20.00, 'UP'),
(1, 'FW-R02-BTN-005', 'Ivana Public Market', 'Ivana WiFi', 'Poblacion', 'Ivana', 'Batanes', 'District 1', 'Luzon', 20.4000, 121.9000, 'Public Market', 'Globe', 'Wireless', 30.00, 'DOWN'),
(1, 'FW-R02-BTN-006', 'Mahatao Church Area', 'Mahatao WiFi', 'Poblacion', 'Mahatao', 'Batanes', 'District 1', 'Luzon', 20.4300, 121.9300, 'Public Area', 'Globe', 'Wireless', 30.00, 'UP'),
(1, 'FW-R02-BTN-007', 'Sabtang Municipal Hall', 'Sabtang WiFi', 'Poblacion', 'Sabtang', 'Batanes', 'District 1', 'Luzon', 20.3800, 121.8800, 'Government', 'Globe', 'Satellite', 15.00, 'UP'),
(1, 'FW-R02-BTN-008', 'Uyugan Municipal Hall', 'Uyugan WiFi', 'Poblacion', 'Uyugan', 'Batanes', 'District 1', 'Luzon', 20.4100, 121.9500, 'Government', 'Globe', 'Wireless', 30.00, 'UP'),

-- Cagayan (15 sites)
(1, 'FW-R02-CAG-001', 'Tuguegarao City Hall', 'Tuguegarao WiFi', 'Poblacion', 'Tuguegarao City', 'Cagayan', 'District 1', 'Luzon', 17.6130, 121.7270, 'Government', 'PLDT', 'Fiber', 100.00, 'UP'),
(1, 'FW-R02-CAG-002', 'Cagayan Provincial Capitol', 'Capitol WiFi', 'Caritan Centro', 'Tuguegarao City', 'Cagayan', 'District 1', 'Luzon', 17.6200, 121.7300, 'Government', 'Globe', 'Fiber', 100.00, 'UP'),
(1, 'FW-R02-CAG-003', 'Cagayan State University', 'CSU WiFi', 'Caritan Sur', 'Tuguegarao City', 'Cagayan', 'District 1', 'Luzon', 17.6180, 121.7350, 'School', 'Converge', 'Fiber', 100.00, 'UP'),
(1, 'FW-R02-CAG-004', 'Tuguegarao Public Market', 'Public Market WiFi', 'Centro 10', 'Tuguegarao City', 'Cagayan', 'District 1', 'Luzon', 17.6150, 121.7280, 'Public Market', 'PLDT', 'Fiber', 75.00, 'UP'),
(1, 'FW-R02-CAG-005', 'Aparri Municipal Hall', 'Aparri WiFi', 'Poblacion', 'Aparri', 'Cagayan', 'District 1', 'Luzon', 18.3600, 121.6400, 'Government', 'Globe', 'Fiber', 75.00, 'UP'),
(1, 'FW-R02-CAG-006', 'Aparri Port Area', 'Aparri Port WiFi', 'Poblacion', 'Aparri', 'Cagayan', 'District 1', 'Luzon', 18.3650, 121.6350, 'Public Area', 'Globe', 'Fiber', 50.00, 'DOWN'),
(1, 'FW-R02-CAG-007', 'Lal-lo Municipal Hall', 'Lal-lo WiFi', 'Poblacion', 'Lal-lo', 'Cagayan', 'District 1', 'Luzon', 17.7500, 121.5500, 'Government', 'Converge', 'Fiber', 50.00, 'UP'),
(1, 'FW-R02-CAG-008', 'Solana Municipal Hall', 'Solana WiFi', 'Poblacion', 'Solana', 'Cagayan', 'District 1', 'Luzon', 17.6500, 121.6500, 'Government', 'PLDT', 'Fiber', 75.00, 'UP'),
(1, 'FW-R02-CAG-009', 'Gonzaga Municipal Hall', 'Gonzaga WiFi', 'Poblacion', 'Gonzaga', 'Cagayan', 'District 1', 'Luzon', 18.2800, 121.8900, 'Government', 'Globe', 'Wireless', 30.00, 'UP'),
(1, 'FW-R02-CAG-010', 'Santa Ana Municipal Hall', 'Santa Ana WiFi', 'Poblacion', 'Santa Ana', 'Cagayan', 'District 1', 'Luzon', 18.4600, 122.1300, 'Government', 'Globe', 'Wireless', 30.00, 'UP'),
(1, 'FW-R02-CAG-011', 'Baggao Municipal Hall', 'Baggao WiFi', 'Poblacion', 'Baggao', 'Cagayan', 'District 1', 'Luzon', 17.8800, 121.8700, 'Government', 'Converge', 'Fiber', 50.00, 'UP'),
(1, 'FW-R02-CAG-012', 'Enrile Municipal Hall', 'Enrile WiFi', 'Poblacion', 'Enrile', 'Cagayan', 'District 1', 'Luzon', 17.5500, 121.7000, 'Government', 'PLDT', 'Fiber', 50.00, 'DOWN'),
(1, 'FW-R02-CAG-013', 'Amulung Municipal Hall', 'Amulung WiFi', 'Poblacion', 'Amulung', 'Cagayan', 'District 1', 'Luzon', 17.5800, 121.6200, 'Government', 'Globe', 'Fiber', 50.00, 'UP'),
(1, 'FW-R02-CAG-014', 'Camalaniugan Municipal Hall', 'Camalaniugan WiFi', 'Poblacion', 'Camalaniugan', 'Cagayan', 'District 1', 'Luzon', 18.1500, 121.5500, 'Government', 'Converge', 'Wireless', 30.00, 'UP'),
(1, 'FW-R02-CAG-015', 'Gattaran Municipal Hall', 'Gattaran WiFi', 'Poblacion', 'Gattaran', 'Cagayan', 'District 1', 'Luzon', 18.0500, 121.6500, 'Government', 'Globe', 'Fiber', 50.00, 'UP'),

-- Isabela (15 sites)
(1, 'FW-R02-ISA-001', 'Ilagan City Hall', 'Ilagan WiFi', 'Poblacion', 'Ilagan City', 'Isabela', 'District 1', 'Luzon', 16.9750, 121.8000, 'Government', 'PLDT', 'Fiber', 100.00, 'UP'),
(1, 'FW-R02-ISA-002', 'Isabela Provincial Capitol', 'Capitol WiFi', 'Centro', 'Ilagan City', 'Isabela', 'District 1', 'Luzon', 16.9800, 121.8050, 'Government', 'Globe', 'Fiber', 100.00, 'UP'),
(1, 'FW-R02-ISA-003', 'Cauayan City Hall', 'Cauayan WiFi', 'Poblacion', 'Cauayan City', 'Isabela', 'District 1', 'Luzon', 16.7500, 121.7700, 'Government', 'PLDT', 'Fiber', 75.00, 'UP'),
(1, 'FW-R02-ISA-004', 'Santiago City Hall', 'Santiago WiFi', 'Poblacion', 'Santiago City', 'Isabela', 'District 2', 'Luzon', 16.6900, 121.5500, 'Government', 'Globe', 'Fiber', 100.00, 'UP'),
(1, 'FW-R02-ISA-005', 'Santiago Public Market', 'Santiago Market WiFi', 'Poblacion', 'Santiago City', 'Isabela', 'District 2', 'Luzon', 16.6950, 121.5550, 'Public Market', 'Converge', 'Fiber', 75.00, 'UP'),
(1, 'FW-R02-ISA-006', 'Echague Municipal Hall', 'Echague WiFi', 'Poblacion', 'Echague', 'Isabela', 'District 2', 'Luzon', 16.5500, 121.6500, 'Government', 'Globe', 'Fiber', 50.00, 'UP'),
(1, 'FW-R02-ISA-007', 'Roxas Municipal Hall', 'Roxas WiFi', 'Poblacion', 'Roxas', 'Isabela', 'District 1', 'Luzon', 16.8500, 121.6500, 'Government', 'PLDT', 'Fiber', 50.00, 'DOWN'),
(1, 'FW-R02-ISA-008', 'Jones Municipal Hall', 'Jones WiFi', 'Poblacion', 'Jones', 'Isabela', 'District 1', 'Luzon', 17.1000, 121.7500, 'Government', 'Globe', 'Wireless', 30.00, 'UP'),
(1, 'FW-R02-ISA-009', 'Cabagan Municipal Hall', 'Cabagan WiFi', 'Poblacion', 'Cabagan', 'Isabela', 'District 1', 'Luzon', 17.3500, 121.7800, 'Government', 'Converge', 'Fiber', 50.00, 'UP'),
(1, 'FW-R02-ISA-010', 'Tumauini Municipal Hall', 'Tumauini WiFi', 'Poblacion', 'Tumauini', 'Isabela', 'District 1', 'Luzon', 17.4500, 121.7500, 'Government', 'PLDT', 'Fiber', 50.00, 'UP'),
(1, 'FW-R02-ISA-011', 'Aurora Municipal Hall', 'Aurora WiFi', 'Poblacion', 'Aurora', 'Isabela', 'District 1', 'Luzon', 17.1500, 121.8500, 'Government', 'Globe', 'Wireless', 30.00, 'UP'),
(1, 'FW-R02-ISA-012', 'San Mateo Municipal Hall', 'San Mateo WiFi', 'Poblacion', 'San Mateo', 'Isabela', 'District 2', 'Luzon', 16.5800, 121.5200, 'Government', 'PLDT', 'Fiber', 50.00, 'UP'),
(1, 'FW-R02-ISA-013', 'Alicia Municipal Hall', 'Alicia WiFi', 'Poblacion', 'Alicia', 'Isabela', 'District 2', 'Luzon', 16.6500, 121.4800, 'Government', 'Globe', 'Fiber', 50.00, 'UP'),
(1, 'FW-R02-ISA-014', 'Gamu Municipal Hall', 'Gamu WiFi', 'Poblacion', 'Gamu', 'Isabela', 'District 1', 'Luzon', 17.2500, 121.8000, 'Government', 'Converge', 'Wireless', 30.00, 'DOWN'),
(1, 'FW-R02-ISA-015', 'Naguilian Municipal Hall', 'Naguilian WiFi', 'Poblacion', 'Naguilian', 'Isabela', 'District 1', 'Luzon', 17.1500, 121.9000, 'Government', 'Globe', 'Wireless', 30.00, 'UP'),

-- Nueva Vizcaya (7 sites)
(1, 'FW-R02-NVZ-001', 'Bayombong Municipal Hall', 'Bayombong WiFi', 'Poblacion', 'Bayombong', 'Nueva Vizcaya', 'District 1', 'Luzon', 16.4500, 121.1500, 'Government', 'PLDT', 'Fiber', 75.00, 'UP'),
(1, 'FW-R02-NVZ-002', 'Nueva Vizcaya Capitol', 'Capitol WiFi', 'Poblacion', 'Bayombong', 'Nueva Vizcaya', 'District 1', 'Luzon', 16.4550, 121.1550, 'Government', 'Globe', 'Fiber', 75.00, 'UP'),
(1, 'FW-R02-NVZ-003', 'Solano Municipal Hall', 'Solano WiFi', 'Poblacion', 'Solano', 'Nueva Vizcaya', 'District 1', 'Luzon', 16.5500, 121.2000, 'Government', 'PLDT', 'Fiber', 50.00, 'UP'),
(1, 'FW-R02-NVZ-004', 'Solano Public Market', 'Solano Market WiFi', 'Poblacion', 'Solano', 'Nueva Vizcaya', 'District 1', 'Luzon', 16.5550, 121.2050, 'Public Market', 'Globe', 'Fiber', 50.00, 'UP'),
(1, 'FW-R02-NVZ-005', 'Aritao Municipal Hall', 'Aritao WiFi', 'Poblacion', 'Aritao', 'Nueva Vizcaya', 'District 1', 'Luzon', 16.3500, 121.0500, 'Government', 'Converge', 'Wireless', 30.00, 'UP'),
(1, 'FW-R02-NVZ-006', 'Bambang Municipal Hall', 'Bambang WiFi', 'Poblacion', 'Bambang', 'Nueva Vizcaya', 'District 1', 'Luzon', 16.4000, 121.1000, 'Government', 'Globe', 'Fiber', 50.00, 'DOWN'),
(1, 'FW-R02-NVZ-007', 'Bagabag Municipal Hall', 'Bagabag WiFi', 'Poblacion', 'Bagabag', 'Nueva Vizcaya', 'District 1', 'Luzon', 16.5000, 121.2500, 'Government', 'PLDT', 'Fiber', 50.00, 'UP'),

-- Quirino (5 sites)
(1, 'FW-R02-QRN-001', 'Cabarroguis Municipal Hall', 'Cabarroguis WiFi', 'Poblacion', 'Cabarroguis', 'Quirino', 'District 1', 'Luzon', 16.3500, 121.5000, 'Government', 'Globe', 'Fiber', 50.00, 'UP'),
(1, 'FW-R02-QRN-002', 'Quirino Provincial Capitol', 'Capitol WiFi', 'Poblacion', 'Cabarroguis', 'Quirino', 'District 1', 'Luzon', 16.3550, 121.5050, 'Government', 'Globe', 'Fiber', 50.00, 'UP'),
(1, 'FW-R02-QRN-003', 'Diffun Municipal Hall', 'Diffun WiFi', 'Poblacion', 'Diffun', 'Quirino', 'District 1', 'Luzon', 16.2500, 121.4500, 'Government', 'Converge', 'Wireless', 30.00, 'UP'),
(1, 'FW-R02-QRN-004', 'Sagudoy Municipal Hall', 'Sagudoy WiFi', 'Poblacion', 'Sagudoy', 'Quirino', 'District 1', 'Luzon', 16.2000, 121.4800, 'Government', 'Globe', 'Wireless', 20.00, 'UP'),
(1, 'FW-R02-QRN-005', 'Maddela Municipal Hall', 'Maddela WiFi', 'Poblacion', 'Maddela', 'Quirino', 'District 1', 'Luzon', 16.3000, 121.6000, 'Government', 'Converge', 'Wireless', 30.00, 'DOWN');

-- ============================================================
-- 3. DICT PROJECT SITES — REGION 2 (45 sites, 5 per project)
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
-- 4. REGION 2 FREE WIFI DAILY LOGS (last 7 days, first 10 FW sites)
-- ============================================================

-- Get site IDs for Region 2 Free WiFi sites (assuming they were just inserted)
-- Site IDs will be auto-incremented. We use subqueries to find them.

INSERT INTO free_wifi_daily_logs (site_id, log_date, status, bandwidth_utilization, total_unique_users, remarks, logged_by) VALUES
((SELECT id FROM sites WHERE site_code = 'FW-R02-BTN-001'), CURDATE() - INTERVAL 6 DAY, 'UP', 65.00, 180, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-BTN-001'), CURDATE() - INTERVAL 5 DAY, 'UP', 70.20, 210, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-BTN-001'), CURDATE() - INTERVAL 4 DAY, 'UP', 68.50, 195, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-BTN-001'), CURDATE() - INTERVAL 3 DAY, 'UP', 72.00, 220, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-BTN-001'), CURDATE() - INTERVAL 2 DAY, 'UP', 74.30, 235, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-BTN-001'), CURDATE() - INTERVAL 1 DAY, 'UP', 69.80, 200, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-BTN-001'), CURDATE(), 'UP', 71.50, 215, NULL, 4);

INSERT INTO free_wifi_daily_logs (site_id, log_date, status, bandwidth_utilization, total_unique_users, remarks, logged_by) VALUES
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-001'), CURDATE() - INTERVAL 6 DAY, 'UP', 85.00, 520, 'High traffic', 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-001'), CURDATE() - INTERVAL 5 DAY, 'UP', 88.50, 580, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-001'), CURDATE() - INTERVAL 4 DAY, 'UP', 82.10, 490, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-001'), CURDATE() - INTERVAL 3 DAY, 'UP', 90.00, 610, 'Peak usage', 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-001'), CURDATE() - INTERVAL 2 DAY, 'UP', 87.50, 560, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-001'), CURDATE() - INTERVAL 1 DAY, 'UP', 84.00, 500, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-001'), CURDATE(), 'UP', 91.00, 630, 'Near capacity', 4);

INSERT INTO free_wifi_daily_logs (site_id, log_date, status, bandwidth_utilization, total_unique_users, remarks, logged_by) VALUES
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-006'), CURDATE() - INTERVAL 6 DAY, 'UP', 45.00, 120, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-006'), CURDATE() - INTERVAL 5 DAY, 'UP', 48.20, 135, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-006'), CURDATE() - INTERVAL 4 DAY, 'UP', 42.00, 110, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-006'), CURDATE() - INTERVAL 3 DAY, 'DOWN', 0.00, 0, 'Equipment failure', 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-006'), CURDATE() - INTERVAL 2 DAY, 'DOWN', 0.00, 0, 'Waiting for replacement', 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-006'), CURDATE() - INTERVAL 1 DAY, 'DOWN', 0.00, 0, 'Still down', 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-CAG-006'), CURDATE(), 'DOWN', 0.00, 0, 'Escalated to Globe', 4);

-- Ilagan City Hall
INSERT INTO free_wifi_daily_logs (site_id, log_date, status, bandwidth_utilization, total_unique_users, remarks, logged_by) VALUES
((SELECT id FROM sites WHERE site_code = 'FW-R02-ISA-001'), CURDATE() - INTERVAL 6 DAY, 'UP', 72.00, 340, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-ISA-001'), CURDATE() - INTERVAL 5 DAY, 'UP', 75.50, 380, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-ISA-001'), CURDATE() - INTERVAL 4 DAY, 'UP', 70.00, 310, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-ISA-001'), CURDATE() - INTERVAL 3 DAY, 'UP', 78.00, 400, 'High traffic', 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-ISA-001'), CURDATE() - INTERVAL 2 DAY, 'UP', 74.50, 360, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-ISA-001'), CURDATE() - INTERVAL 1 DAY, 'UP', 71.00, 330, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-ISA-001'), CURDATE(), 'UP', 76.00, 370, NULL, 4);

-- Bayombong (went down recently)
INSERT INTO free_wifi_daily_logs (site_id, log_date, status, bandwidth_utilization, total_unique_users, remarks, logged_by) VALUES
((SELECT id FROM sites WHERE site_code = 'FW-R02-NVZ-006'), CURDATE() - INTERVAL 6 DAY, 'UP', 55.00, 200, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-NVZ-006'), CURDATE() - INTERVAL 5 DAY, 'UP', 58.20, 220, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-NVZ-006'), CURDATE() - INTERVAL 4 DAY, 'UP', 52.00, 190, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-NVZ-006'), CURDATE() - INTERVAL 3 DAY, 'UP', 60.00, 240, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-NVZ-006'), CURDATE() - INTERVAL 2 DAY, 'DOWN', 0.00, 0, 'Power outage', 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-NVZ-006'), CURDATE() - INTERVAL 1 DAY, 'DOWN', 0.00, 0, 'Generator running, no connectivity', 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-NVZ-006'), CURDATE(), 'DOWN', 0.00, 0, 'ISP fiber cut', 4);

-- Cabarroguis (Quirino)
INSERT INTO free_wifi_daily_logs (site_id, log_date, status, bandwidth_utilization, total_unique_users, remarks, logged_by) VALUES
((SELECT id FROM sites WHERE site_code = 'FW-R02-QRN-001'), CURDATE() - INTERVAL 6 DAY, 'UP', 40.00, 150, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-QRN-001'), CURDATE() - INTERVAL 5 DAY, 'UP', 42.50, 165, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-QRN-001'), CURDATE() - INTERVAL 4 DAY, 'UP', 38.00, 140, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-QRN-001'), CURDATE() - INTERVAL 3 DAY, 'UP', 45.00, 180, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-QRN-001'), CURDATE() - INTERVAL 2 DAY, 'UP', 43.50, 170, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-QRN-001'), CURDATE() - INTERVAL 1 DAY, 'UP', 41.00, 155, NULL, 4),
((SELECT id FROM sites WHERE site_code = 'FW-R02-QRN-001'), CURDATE(), 'UP', 44.00, 175, NULL, 4);

-- ============================================================
-- 5. REGION 2 MILESTONES & ENTRIES (PNPKI R2 focus)
-- ============================================================

INSERT INTO milestones (project_id, site_id, title, target_date, actual_date, status, description)
SELECT 2, s.id, 'PNPKI RA Center Setup — Tuguegarao', CURDATE() - INTERVAL 30 DAY, CURDATE() - INTERVAL 25 DAY, 'COMPLETED', 'Registration Authority center fully operational at DICT R2 office'
FROM sites s WHERE s.site_code = 'PNPKI-R02-001' LIMIT 1;

INSERT INTO milestones (project_id, site_id, title, target_date, actual_date, status, description)
SELECT 2, s.id, 'PNPKI RA Center Setup — Ilagan', CURDATE() - INTERVAL 20 DAY, CURDATE() - INTERVAL 15 DAY, 'COMPLETED', 'RA center deployed at PSA Isabela'
FROM sites s WHERE s.site_code = 'PNPKI-R02-002' LIMIT 1;

INSERT INTO milestones (project_id, site_id, title, target_date, actual_date, status, description)
SELECT 2, s.id, 'PNPKI RA Center Setup — Bayombong', CURDATE() - INTERVAL 10 DAY, NULL, 'IN_PROGRESS', 'Server installation ongoing at PSA Nueva Vizcaya'
FROM sites s WHERE s.site_code = 'PNPKI-R02-003' LIMIT 1;

INSERT INTO milestones (project_id, site_id, title, target_date, actual_date, status, description)
SELECT 2, s.id, 'PNPKI RA Center Setup — Cabarroguis', CURDATE() + INTERVAL 14 DAY, NULL, 'PENDING', 'Pending network connectivity at PSA Quirino'
FROM sites s WHERE s.site_code = 'PNPKI-R02-004' LIMIT 1;

INSERT INTO milestones (project_id, site_id, title, target_date, actual_date, status, description)
SELECT 2, s.id, 'PNPKI RA Center Setup — Basco', CURDATE() + INTERVAL 30 DAY, NULL, 'PENDING', 'Satellite link installation scheduled for Batanes'
FROM sites s WHERE s.site_code = 'PNPKI-R02-005' LIMIT 1;

-- Dict Project Entries for PNPKI R2
INSERT INTO dict_project_entries (project_id, site_id, entry_date, status, accomplishment_percent, deliverables, remarks, updated_by)
SELECT 2, s.id, CURDATE() - INTERVAL 25 DAY, 'COMPLETED', 100.00, 'RA Center operational', 'All equipment installed and tested', 5
FROM sites s WHERE s.site_code = 'PNPKI-R02-001' LIMIT 1;

INSERT INTO dict_project_entries (project_id, site_id, entry_date, status, accomplishment_percent, deliverables, remarks, updated_by)
SELECT 2, s.id, CURDATE() - INTERVAL 15 DAY, 'COMPLETED', 100.00, 'RA Center operational', 'Network and systems verified', 5
FROM sites s WHERE s.site_code = 'PNPKI-R02-002' LIMIT 1;

INSERT INTO dict_project_entries (project_id, site_id, entry_date, status, accomplishment_percent, deliverables, remarks, updated_by)
SELECT 2, s.id, CURDATE() - INTERVAL 5 DAY, 'ONGOING', 65.00, 'Server rack installed', 'Waiting for software installation', 5
FROM sites s WHERE s.site_code = 'PNPKI-R02-003' LIMIT 1;

INSERT INTO dict_project_entries (project_id, site_id, entry_date, status, accomplishment_percent, deliverables, remarks, updated_by)
SELECT 2, s.id, CURDATE(), 'DELAYED', 20.00, 'Initial site survey done', 'Network connectivity issues at Quirino', 5
FROM sites s WHERE s.site_code = 'PNPKI-R02-004' LIMIT 1;

INSERT INTO dict_project_entries (project_id, site_id, entry_date, status, accomplishment_percent, deliverables, remarks, updated_by)
SELECT 2, s.id, CURDATE(), 'PENDING', 0.00, 'Not started', 'Awaiting satellite equipment delivery', 5
FROM sites s WHERE s.site_code = 'PNPKI-R02-005' LIMIT 1;
