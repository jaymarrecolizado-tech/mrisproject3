-- ============================================================
-- Seed Data: All Philippine Provinces (17 Regions)
-- Table: provinces (name, region, island_group, latitude, longitude)
-- Coordinates are approximate center points of each province.
-- Run this file to populate the provinces table with all
-- provinces, highly urbanized cities treated as provinces,
-- and independent component cities across the Philippines.
-- ============================================================

-- Make idempotent: clear existing data before inserting
TRUNCATE TABLE provinces;

INSERT INTO provinces (name, region, island_group, latitude, longitude) VALUES
-- ============================================================
-- Region I - Ilocos Region (Luzon)
-- ============================================================
('Ilocos Norte',    'Region I',  'Luzon', 18.1960, 120.5910),
('Ilocos Sur',      'Region I',  'Luzon', 17.2260, 120.4320),
('La Union',        'Region I',  'Luzon', 16.6170, 120.3540),
('Pangasinan',      'Region I',  'Luzon', 15.8940, 120.3730),

-- ============================================================
-- Region II - Cagayan Valley (Luzon)
-- ============================================================
('Batanes',         'Region II', 'Luzon', 20.4480, 121.9710),
('Cagayan',         'Region II', 'Luzon', 18.2380, 121.7910),
('Isabela',         'Region II', 'Luzon', 17.0580, 121.7560),
('Nueva Vizcaya',   'Region II', 'Luzon', 16.3820, 121.1910),
('Quirino',         'Region II', 'Luzon', 16.2640, 121.4960),

-- ============================================================
-- Region III - Central Luzon (Luzon)
-- ============================================================
('Aurora',          'Region III', 'Luzon', 15.7630, 121.6010),
('Bataan',          'Region III', 'Luzon', 14.6530, 120.4890),
('Bulacan',         'Region III', 'Luzon', 14.7940, 121.0180),
('Nueva Ecija',     'Region III', 'Luzon', 15.5910, 120.9590),
('Pampanga',        'Region III', 'Luzon', 15.0580, 120.6500),
('Tarlac',          'Region III', 'Luzon', 15.4770, 120.4570),
('Zambales',        'Region III', 'Luzon', 15.3030, 119.9350),

-- ============================================================
-- Region IV-A - CALABARZON (Luzon)
-- ============================================================
('Batangas',        'Region IV-A', 'Luzon', 13.7570, 121.0590),
('Cavite',          'Region IV-A', 'Luzon', 14.2790, 120.8920),
('Laguna',          'Region IV-A', 'Luzon', 14.2850, 121.3890),
('Quezon',          'Region IV-A', 'Luzon', 14.0010, 121.9590),
('Rizal',           'Region IV-A', 'Luzon', 14.4770, 121.1840),

-- ============================================================
-- Region IV-B - MIMAROPA (Luzon)
-- ============================================================
('Marinduque',             'Region IV-B', 'Luzon', 13.4760, 121.9400),
('Occidental Mindoro',     'Region IV-B', 'Luzon', 12.8300, 120.9360),
('Oriental Mindoro',       'Region IV-B', 'Luzon', 13.0440, 121.1910),
('Palawan',                'Region IV-B', 'Luzon', 9.8340,  118.7380),
('Romblon',                'Region IV-B', 'Luzon', 12.5780, 122.2680),

-- ============================================================
-- Region V - Bicol Region (Luzon)
-- ============================================================
('Albay',              'Region V', 'Luzon', 13.1690, 123.6560),
('Camarines Norte',    'Region V', 'Luzon', 14.1390, 122.7830),
('Camarines Sur',      'Region V', 'Luzon', 13.5710, 123.2830),
('Catanduanes',        'Region V', 'Luzon', 13.5930, 124.1250),
('Masbate',            'Region V', 'Luzon', 12.1940, 123.6310),
('Sorsogon',           'Region V', 'Luzon', 12.9630, 124.0420),

-- ============================================================
-- Region VI - Western Visayas (Visayas)
-- ============================================================
('Aklan',              'Region VI', 'Visayas', 11.7060, 122.1030),
('Antique',            'Region VI', 'Visayas', 11.0420, 121.9390),
('Capiz',              'Region VI', 'Visayas', 11.5450, 122.5560),
('Guimaras',           'Region VI', 'Visayas', 10.5930, 122.6320),
('Iloilo',             'Region VI', 'Visayas', 10.7200, 122.5620),
('Negros Occidental',  'Region VI', 'Visayas', 10.2640, 123.0560),

-- ============================================================
-- Region VII - Central Visayas (Visayas)
-- ============================================================
('Bohol',              'Region VII', 'Visayas', 9.8500,  124.0060),
('Cebu',               'Region VII', 'Visayas', 10.3150, 123.8860),
('Negros Oriental',    'Region VII', 'Visayas', 9.6500,  123.1820),
('Siquijor',           'Region VII', 'Visayas', 9.2000,  123.6000),

-- ============================================================
-- Region VIII - Eastern Visayas (Visayas)
-- ============================================================
('Biliran',            'Region VIII', 'Visayas', 11.6200, 124.4560),
('Eastern Samar',      'Region VIII', 'Visayas', 11.4050, 125.4980),
('Leyte',              'Region VIII', 'Visayas', 10.9560, 124.6110),
('Northern Samar',     'Region VIII', 'Visayas', 12.4190, 124.8300),
('Samar',              'Region VIII', 'Visayas', 11.6200, 125.0670),
('Southern Leyte',     'Region VIII', 'Visayas', 10.3060, 125.0180),

-- ============================================================
-- Region IX - Zamboanga Peninsula (Mindanao)
-- ============================================================
('Zamboanga del Norte',    'Region IX',  'Mindanao', 8.3430,  123.2360),
('Zamboanga del Sur',      'Region IX',  'Mindanao', 7.8350,  123.2580),
('Zamboanga Sibugay',      'Region IX',  'Mindanao', 7.5860,  122.6910),
('Isabela City',           'Region IX',  'Mindanao', 6.7070,  121.9720),

-- ============================================================
-- Region X - Northern Mindanao (Mindanao)
-- ============================================================
('Bukidnon',           'Region X',  'Mindanao', 8.0380,  125.0370),
('Camiguin',           'Region X',  'Mindanao', 9.1710,  124.7270),
('Lanao del Norte',    'Region X',  'Mindanao', 8.0190,  124.1530),
('Misamis Occidental', 'Region X',  'Mindanao', 8.3290,  123.6940),
('Misamis Oriental',   'Region X',  'Mindanao', 8.4540,  124.7580),

-- ============================================================
-- Region XI - Davao Region (Mindanao)
-- ============================================================
('Davao de Oro',       'Region XI', 'Mindanao', 7.4050,  126.0640),
('Davao del Norte',    'Region XI', 'Mindanao', 7.5590,  125.6330),
('Davao del Sur',      'Region XI', 'Mindanao', 6.6760,  125.3540),
('Davao Occidental',   'Region XI', 'Mindanao', 6.2050,  125.3100),
('Davao Oriental',     'Region XI', 'Mindanao', 7.3400,  126.4970),

-- ============================================================
-- Region XII - SOCCSKSARGEN (Mindanao)
-- ============================================================
('Cotabato',           'Region XII', 'Mindanao', 7.2170,  124.7850),
('Sarangani',          'Region XII', 'Mindanao', 5.8250,  125.1050),
('South Cotabato',     'Region XII', 'Mindanao', 6.1620,  125.0570),
('Sultan Kudarat',     'Region XII', 'Mindanao', 6.5590,  124.5030),

-- ============================================================
-- Region XIII - Caraga (Mindanao)
-- ============================================================
('Agusan del Norte',   'Region XIII', 'Mindanao', 9.0980,  125.4620),
('Agusan del Sur',     'Region XIII', 'Mindanao', 8.4360,  125.8290),
('Dinagat Islands',    'Region XIII', 'Mindanao', 10.1270, 125.6150),
('Surigao del Norte',  'Region XIII', 'Mindanao', 9.6530,  125.9070),
('Surigao del Sur',    'Region XIII', 'Mindanao', 8.8200,  126.1230),

-- ============================================================
-- BARMM - Bangsamoro Autonomous Region in Muslim Mindanao
-- ============================================================
('Basilan',            'BARMM', 'Mindanao', 6.5850,  122.0330),
('Lanao del Sur',      'BARMM', 'Mindanao', 7.8250,  124.3860),
('Maguindanao',        'BARMM', 'Mindanao', 7.1460,  124.2880),
('Sulu',               'BARMM', 'Mindanao', 5.9880,  121.1340),
('Tawi-Tawi',          'BARMM', 'Mindanao', 5.1900,  119.9920),

-- ============================================================
-- NCR - National Capital Region (Luzon)
-- ============================================================
('Metro Manila',       'NCR', 'Luzon', 14.5995, 120.9842),

-- ============================================================
-- CAR - Cordillera Administrative Region (Luzon)
-- ============================================================
('Abra',               'CAR', 'Luzon', 17.5960, 120.7720),
('Apayao',             'CAR', 'Luzon', 18.2980, 121.2740),
('Benguet',            'CAR', 'Luzon', 16.5270, 120.6710),
('Ifugao',             'CAR', 'Luzon', 16.8340, 121.1490),
('Kalinga',            'CAR', 'Luzon', 17.5900, 121.3540),
('Mountain Province',  'CAR', 'Luzon', 17.0580, 121.1610);
