import type { Project, Site, FreeWifiDailyLog, DictProjectEntry, Milestone, DailySummary, RegionStats } from '../types';

export const projects: Project[] = [
  { id: 'fw', code: 'FW', name: 'Free WiFi', fullName: 'Free WiFi for All', color: '#0ea5e9', icon: 'Wifi', description: 'Free public WiFi access points across Region 2', type: 'daily', totalSites: 50, activeSites: 42, downSites: 8, completionRate: 84.0 },
  { id: 'pnpki', code: 'PNPKI', name: 'PNPKI', fullName: 'Philippine National Public Key Infrastructure', color: '#8b5cf6', icon: 'ShieldCheck', description: 'Digital certificate infrastructure for government', type: 'milestone', totalSites: 5, activeSites: 4, downSites: 0, completionRate: 80.0 },
  { id: 'ilcdb', code: 'ILCDB', name: 'ILCDB', fullName: 'Integrated Local Government Database', color: '#f97316', icon: 'Database', description: 'Centralized local government unit database', type: 'milestone', totalSites: 5, activeSites: 4, downSites: 0, completionRate: 80.0 },
  { id: 'iidb', code: 'IIDB', name: 'IIDB', fullName: 'Inter-Agency Information Database', color: '#10b981', icon: 'Building2', description: 'Inter-agency data sharing platform', type: 'milestone', totalSites: 5, activeSites: 4, downSites: 0, completionRate: 80.0 },
  { id: 'cyber', code: 'CYBER', name: 'Cybersecurity', fullName: 'Cybersecurity Bureau Operations', color: '#ef4444', icon: 'ShieldAlert', description: 'National cybersecurity monitoring and response', type: 'milestone', totalSites: 5, activeSites: 4, downSites: 0, completionRate: 80.0 },
  { id: 'elgu', code: 'eLGU', name: 'eLGU', fullName: 'Electronic Local Government Unit', color: '#d97706', icon: 'Landmark', description: 'Digital LGU service delivery platform', type: 'milestone', totalSites: 5, activeSites: 4, downSites: 0, completionRate: 80.0 },
  { id: 'egov', code: 'eGov', name: 'eGov', fullName: 'e-Government Philippines', color: '#06b6d4', icon: 'IdCard', description: 'Integrated e-government services portal', type: 'milestone', totalSites: 5, activeSites: 4, downSites: 0, completionRate: 80.0 },
  { id: 'govnet', code: 'GovNet', name: 'GovNet', fullName: 'Government Network', color: '#6366f1', icon: 'Network', description: 'Government fiber backbone network', type: 'milestone', totalSites: 5, activeSites: 4, downSites: 0, completionRate: 80.0 },
  { id: 'gecs', code: 'GECS', name: 'GECS', fullName: 'Government Emergency Communications System', color: '#ec4899', icon: 'Radio', description: 'Emergency communications for disaster response', type: 'milestone', totalSites: 5, activeSites: 4, downSites: 0, completionRate: 80.0 },
];

const provinces = [
  { name: 'Batanes', island: 'Luzon' as const, lat: 20.4500, lng: 121.9700 },
  { name: 'Cagayan', island: 'Luzon' as const, lat: 17.8700, lng: 121.7740 },
  { name: 'Isabela', island: 'Luzon' as const, lat: 16.9750, lng: 121.8000 },
  { name: 'Nueva Vizcaya', island: 'Luzon' as const, lat: 16.3500, lng: 121.1500 },
  { name: 'Quirino', island: 'Luzon' as const, lat: 16.2700, lng: 121.5300 },
];

const municipalities = ['Tuguegarao City', 'Ilagan City', 'Cauayan City', 'Santiago City', 'Bayombong', 'Solano', 'Cabarroguis', 'Diffun', 'Basco', 'Aparri', 'Echague', 'Roxas'];
const barangays = ['Poblacion', 'San Antonio', 'San Jose', 'Santa Maria', 'San Pedro', 'San Roque', 'Bagumbayan', 'Maharlika', 'Bayanihan'];
const isps = ['PLDT', 'Globe', 'Converge', 'DITO', 'SkyCable', 'Royal Cable'];
const techs = ['Fiber', 'Wireless', 'DSL', 'LTE', 'Satellite'];

function generateSites(): Site[] {
  const sites: Site[] = [];
  let idCounter = 1;

  projects.forEach((project) => {
    const siteCount = project.totalSites;
    for (let i = 0; i < Math.min(siteCount, 300); i++) {
      const prov = provinces[Math.floor(Math.random() * provinces.length)];
      const latOffset = (Math.random() - 0.5) * 2;
      const lngOffset = (Math.random() - 0.5) * 2;
      const isUp = Math.random() > 0.12;
      
      sites.push({
        id: `${project.code}-SITE-${String(idCounter).padStart(5, '0')}`,
        projectId: project.id,
        nationwideId: `NID-${project.code}-${String(idCounter).padStart(6, '0')}`,
        siteCode: `${project.code}-${String(Math.floor(Math.random() * 900) + 100)}`,
        locationName: `${barangays[Math.floor(Math.random() * barangays.length)]}, ${municipalities[Math.floor(Math.random() * municipalities.length)]}`,
        siteName: `${project.name} AP Site ${String(i + 1).padStart(3, '0')}`,
        barangay: barangays[Math.floor(Math.random() * barangays.length)],
        municipality: municipalities[Math.floor(Math.random() * municipalities.length)],
        province: prov.name,
        district: `District ${Math.floor(Math.random() * 6) + 1}`,
        islandGroup: prov.island,
        latitude: prov.lat + latOffset,
        longitude: prov.lng + lngOffset,
        siteType: project.id === 'fw' ? (Math.random() > 0.5 ? 'Outdoor' : 'Indoor') : 'Office',
        ispProvider: isps[Math.floor(Math.random() * isps.length)],
        lastMileTech: techs[Math.floor(Math.random() * techs.length)],
        bwDownload: project.id === 'fw' ? [10, 20, 50, 100][Math.floor(Math.random() * 4)] : 0,
        status: project.id === 'fw' 
          ? (isUp ? 'UP' : 'DOWN')
          : (['COMPLETED', 'ONGOING', 'PLANNED', 'PENDING'] as const)[Math.floor(Math.random() * 4)],
        lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000)).toISOString().split('T')[0],
      });
      idCounter++;
    }
  });

  return sites;
}

export const sites = generateSites();

export function getSitesByProject(projectId: string): Site[] {
  return sites.filter(s => s.projectId === projectId);
}

export function generateDailyLogs(siteId: string, days: number = 30): FreeWifiDailyLog[] {
  const logs: FreeWifiDailyLog[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const isUp = Math.random() > 0.15;
    logs.push({
      id: `LOG-${siteId}-${i}`,
      siteId,
      date: date.toISOString().split('T')[0],
      status: isUp ? 'UP' : 'DOWN',
      bandwidthUtilization: isUp ? Math.floor(Math.random() * 80) + 5 : 0,
      totalUniqueUsers: isUp ? Math.floor(Math.random() * 500) + 20 : 0,
      remarks: isUp ? 'Normal operations' : 'ISP maintenance / Power outage',
      loggedBy: 'encoder@dict.gov.ph',
    });
  }
  return logs;
}

export function generateProjectEntries(projectId: string): DictProjectEntry[] {
  const entries: DictProjectEntry[] = [];
  const projectSites = getSitesByProject(projectId);
  const today = new Date();
  
  projectSites.slice(0, 50).forEach((site, idx) => {
    const date = new Date(today);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    const status = (['COMPLETED', 'ONGOING', 'PLANNED', 'DELAYED'] as const)[Math.floor(Math.random() * 4)];
    entries.push({
      id: `ENT-${projectId}-${idx}`,
      projectId,
      siteId: site.id,
      date: date.toISOString().split('T')[0],
      status,
      accomplishmentPercent: status === 'COMPLETED' ? 100 : status === 'ONGOING' ? Math.floor(Math.random() * 60) + 30 : status === 'DELAYED' ? Math.floor(Math.random() * 40) : 0,
      deliverables: `Phase ${Math.floor(Math.random() * 3) + 1} deployment`,
      remarks: 'On track per project timeline',
      attachments: [],
      updatedBy: 'pm@dict.gov.ph',
    });
  });
  return entries;
}

export function generateMilestones(projectId: string): Milestone[] {
  const milestones: Milestone[] = [];
  const titles = ['Site Assessment', 'Equipment Procurement', 'Installation', 'Testing & Commissioning', 'Turnover', 'Training'];
  const today = new Date();
  
  titles.forEach((title, idx) => {
    const target = new Date(today);
    target.setMonth(target.getMonth() + idx);
    const completed = Math.random() > 0.5;
    milestones.push({
      id: `MS-${projectId}-${idx}`,
      projectId,
      siteId: '',
      title,
      targetDate: target.toISOString().split('T')[0],
      actualDate: completed ? new Date(target.getTime() - 86400000 * Math.floor(Math.random() * 10)).toISOString().split('T')[0] : undefined,
      status: completed ? 'COMPLETED' : idx === titles.length - 1 ? 'PENDING' : 'IN_PROGRESS',
      description: `${title} for ${projects.find(p => p.id === projectId)?.name}`,
    });
  });
  return milestones;
}

export const dailySummaries: DailySummary[] = (() => {
  const summaries: DailySummary[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const total = 1586;
    const up = Math.floor(total * (0.85 + Math.random() * 0.1));
    const down = total - up;
    summaries.push({
      date: date.toISOString().split('T')[0],
      totalSites: total,
      upCount: up,
      downCount: down,
      partialCount: 0,
      totalUsers: Math.floor(up * (Math.random() * 200 + 50)),
      avgBandwidth: Math.floor(Math.random() * 40 + 20),
    });
  }
  return summaries;
})();

export const regionStats: RegionStats[] = [
  { islandGroup: 'Luzon', totalSites: 720, upSites: 650, downSites: 70, avgUsers: 12500 },
  { islandGroup: 'Visayas', totalSites: 480, upSites: 420, downSites: 60, avgUsers: 8900 },
  { islandGroup: 'Mindanao', totalSites: 386, upSites: 350, downSites: 36, avgUsers: 7200 },
];

export const mysqlSchema = `
-- ============================================================
-- DICT MRIS — MySQL Database Schema v1.0
-- Backend: PHP 8.x + MySQL 8.0
-- ============================================================

CREATE DATABASE IF NOT EXISTS dict_mris 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE dict_mris;

-- ============================================================
-- 1. CORE TABLES
-- ============================================================

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('admin','project_manager','encoder','viewer') DEFAULT 'viewer',
  department VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB;

CREATE TABLE user_project_access (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  project_id VARCHAR(20) NOT NULL,
  can_view TINYINT(1) DEFAULT 1,
  can_edit TINYINT(1) DEFAULT 0,
  can_delete TINYINT(1) DEFAULT 0,
  can_export TINYINT(1) DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_project (user_id, project_id)
) ENGINE=InnoDB;

CREATE TABLE projects (
  id VARCHAR(20) PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  full_name VARCHAR(255),
  description TEXT,
  project_type ENUM('daily','milestone') NOT NULL,
  color VARCHAR(7) DEFAULT '#3b82f6',
  icon VARCHAR(50),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE provinces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  psa_code VARCHAR(10) UNIQUE,
  name VARCHAR(100) NOT NULL,
  island_group ENUM('Luzon','Visayas','Mindanao') NOT NULL,
  region_code VARCHAR(10),
  region_name VARCHAR(100),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  INDEX idx_island (island_group),
  INDEX idx_region (region_code)
) ENGINE=InnoDB;

CREATE TABLE municipalities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  province_id INT NOT NULL,
  psa_code VARCHAR(10) UNIQUE,
  name VARCHAR(100) NOT NULL,
  district VARCHAR(50),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  FOREIGN KEY (province_id) REFERENCES provinces(id),
  INDEX idx_province (province_id)
) ENGINE=InnoDB;

CREATE TABLE barangays (
  id INT AUTO_INCREMENT PRIMARY KEY,
  municipality_id INT NOT NULL,
  psa_code VARCHAR(10) UNIQUE,
  name VARCHAR(100) NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  FOREIGN KEY (municipality_id) REFERENCES municipalities(id),
  INDEX idx_municipality (municipality_id)
) ENGINE=InnoDB;

-- ============================================================
-- 2. SITE MANAGEMENT
-- ============================================================

CREATE TABLE sites (
  id VARCHAR(50) PRIMARY KEY,
  project_id VARCHAR(20) NOT NULL,
  nationwide_id VARCHAR(50) UNIQUE,
  site_code VARCHAR(50) NOT NULL,
  location_name VARCHAR(255),
  site_name VARCHAR(255) NOT NULL,
  barangay_id INT,
  municipality_id INT,
  province_id INT,
  district VARCHAR(50),
  island_group ENUM('Luzon','Visayas','Mindanao'),
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  site_type VARCHAR(50),
  isp_provider VARCHAR(100),
  last_mile_technology VARCHAR(50),
  bw_download_cir DECIMAL(10,2),
  current_status ENUM('UP','DOWN','PARTIAL','PENDING','COMPLETED','ONGOING','PLANNED') DEFAULT 'PENDING',
  last_updated DATE,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (barangay_id) REFERENCES barangays(id),
  FOREIGN KEY (municipality_id) REFERENCES municipalities(id),
  FOREIGN KEY (province_id) REFERENCES provinces(id),
  INDEX idx_project (project_id),
  INDEX idx_status (current_status),
  INDEX idx_province (province_id),
  INDEX idx_island (island_group),
  INDEX idx_coords (latitude, longitude),
  INDEX idx_site_code (site_code),
  INDEX idx_nationwide (nationwide_id)
) ENGINE=InnoDB;

-- ============================================================
-- 3. FREE WIFI DAILY LOGS (Track A)
-- ============================================================

CREATE TABLE free_wifi_daily_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_id VARCHAR(50) NOT NULL,
  log_date DATE NOT NULL,
  status ENUM('UP','DOWN') NOT NULL,
  bandwidth_utilization_mbps DECIMAL(10,2),
  total_unique_users INT DEFAULT 0,
  remarks TEXT,
  logged_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (logged_by) REFERENCES users(id),
  UNIQUE KEY uk_site_date (site_id, log_date),
  INDEX idx_log_date (log_date),
  INDEX idx_status (status)
) ENGINE=InnoDB;

CREATE TABLE site_status_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_id VARCHAR(50) NOT NULL,
  event_date DATETIME NOT NULL,
  old_status ENUM('UP','DOWN','PARTIAL','PENDING'),
  new_status ENUM('UP','DOWN','PARTIAL','PENDING') NOT NULL,
  reason TEXT,
  changed_by INT,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id),
  INDEX idx_site_date (site_id, event_date)
) ENGINE=InnoDB;

-- ============================================================
-- 4. DICT PROJECT ENTRIES (Track B)
-- ============================================================

CREATE TABLE dict_project_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(20) NOT NULL,
  site_id VARCHAR(50) NOT NULL,
  entry_date DATE NOT NULL,
  status ENUM('COMPLETED','ONGOING','PLANNED','DELAYED') NOT NULL,
  accomplishment_percent DECIMAL(5,2) DEFAULT 0,
  deliverables TEXT,
  remarks TEXT,
  attachments JSON,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id),
  INDEX idx_project (project_id),
  INDEX idx_site (site_id),
  INDEX idx_entry_date (entry_date),
  INDEX idx_status (status)
) ENGINE=InnoDB;

CREATE TABLE milestones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(20) NOT NULL,
  site_id VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  target_date DATE NOT NULL,
  actual_date DATE,
  status ENUM('PENDING','IN_PROGRESS','COMPLETED','DELAYED') DEFAULT 'PENDING',
  description TEXT,
  sequence_order INT DEFAULT 0,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_project (project_id),
  INDEX idx_site (site_id),
  INDEX idx_target_date (target_date)
) ENGINE=InnoDB;

-- ============================================================
-- 5. REPORTS & AUDIT
-- ============================================================

CREATE TABLE generated_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_type VARCHAR(50) NOT NULL,
  project_id VARCHAR(20),
  report_period_start DATE,
  report_period_end DATE,
  filters JSON,
  file_path VARCHAR(500),
  file_format ENUM('PDF','XLSX','CSV') DEFAULT 'PDF',
  generated_by INT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (generated_by) REFERENCES users(id),
  INDEX idx_type (report_type),
  INDEX idx_generated (generated_at)
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50),
  record_id VARCHAR(50),
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 6. VIEWS FOR REPORTING
-- ============================================================

CREATE VIEW vw_free_wifi_daily_summary AS
SELECT 
  log_date,
  COUNT(*) AS total_sites_logged,
  SUM(CASE WHEN status = 'UP' THEN 1 ELSE 0 END) AS up_count,
  SUM(CASE WHEN status = 'DOWN' THEN 1 ELSE 0 END) AS down_count,
  AVG(bandwidth_utilization_mbps) AS avg_bandwidth,
  SUM(total_unique_users) AS total_users
FROM free_wifi_daily_logs
GROUP BY log_date;

CREATE VIEW vw_project_accomplishment AS
SELECT 
  p.id AS project_id,
  p.name AS project_name,
  COUNT(DISTINCT s.id) AS total_sites,
  COUNT(DISTINCT CASE WHEN s.current_status = 'COMPLETED' THEN s.id END) AS completed_sites,
  COUNT(DISTINCT CASE WHEN s.current_status = 'ONGOING' THEN s.id END) AS ongoing_sites,
  COUNT(DISTINCT CASE WHEN s.current_status = 'PLANNED' THEN s.id END) AS planned_sites,
  COUNT(DISTINCT CASE WHEN s.current_status = 'DELAYED' THEN s.id END) AS delayed_sites,
  ROUND(
    COUNT(DISTINCT CASE WHEN s.current_status = 'COMPLETED' THEN s.id END) * 100.0 / COUNT(DISTINCT s.id),
    2
  ) AS completion_rate
FROM projects p
LEFT JOIN sites s ON p.id = s.project_id
WHERE p.project_type = 'milestone'
GROUP BY p.id, p.name;

-- ============================================================
-- 7. SEED DATA
-- ============================================================

INSERT INTO projects (id, code, name, full_name, description, project_type, color, icon) VALUES
('fw', 'FW', 'Free WiFi', 'Free WiFi for All', 'Nationwide free public WiFi access points', 'daily', '#0ea5e9', 'wifi'),
('pnpki', 'PNPKI', 'PNPKI', 'Philippine National Public Key Infrastructure', 'Digital certificate infrastructure', 'milestone', '#8b5cf6', 'certificate'),
('ilcdb', 'ILCDB', 'ILCDB', 'Integrated Local Government Database', 'Centralized LGU database', 'milestone', '#f97316', 'database'),
('iidb', 'IIDB', 'IIDB', 'Inter-Agency Information Database', 'Inter-agency data sharing', 'milestone', '#10b981', 'building'),
('cyber', 'CYBER', 'Cybersecurity', 'Cybersecurity Bureau Operations', 'National cybersecurity monitoring', 'milestone', '#ef4444', 'shield'),
('elgu', 'eLGU', 'eLGU', 'Electronic Local Government Unit', 'Digital LGU services', 'milestone', '#d97706', 'landmark'),
('egov', 'eGov', 'eGov', 'e-Government Philippines', 'Integrated e-gov portal', 'milestone', '#06b6d4', 'id-card'),
('govnet', 'GovNet', 'GovNet', 'Government Network', 'Gov fiber backbone', 'milestone', '#6366f1', 'network'),
('gecs', 'GECS', 'GECS', 'Government Emergency Communications', 'Emergency comms system', 'milestone', '#ec4899', 'radio');
`;

export const phpApiSpec = `
// ============================================================
// DICT MRIS — PHP API Specification (RESTful Endpoints)
// ============================================================

// config/Database.php
class Database {
  private $host = "localhost";
  private $db_name = "dict_mris";
  private $username = "root";      // Change for production
  private $password = "";          // Change for production
  private $conn;
  
  public function connect() {
    $this->conn = null;
    try {
      $this->conn = new PDO(
        "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
        $this->username,
        $this->password
      );
      $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    } catch(PDOException $e) {
      echo "Connection Error: " . $e->getMessage();
    }
    return $this->conn;
  }
}

// ============================================================
// API ENDPOINTS
// ============================================================

// 1. AUTHENTICATION
POST /api/auth/login          { email, password } → { token, user }
POST /api/auth/logout         { } → { success }
POST /api/auth/refresh        { } → { token }
GET  /api/auth/me             → { user }

// 2. DASHBOARD
GET /api/dashboard/stats      → { totalProjects, totalSites, activeSites, downSites, completionRate }
GET /api/dashboard/region     → [ { islandGroup, totalSites, upSites, downSites } ]
GET /api/dashboard/trend      ?days=30 → [ { date, upCount, downCount, totalUsers } ]

// 3. PROJECTS
GET /api/projects             → [ Project ]
GET /api/projects/:id         → Project + sites[]
GET /api/projects/:id/stats   → { totalSites, byStatus[], byRegion[] }

// 4. SITES
GET /api/sites                ?project=&province=&status=&page=&limit= 
  → { data: [Site], total, page, pages }
GET /api/sites/:id            → Site + logs[] + entries[]
GET /api/sites/nearby         ?lat=&lng=&radius=km 
  → [ { site, distance_km } ]
POST /api/sites               → { ...Site } → Site
PUT /api/sites/:id            → { ...Site } → Site
DELETE /api/sites/:id         → { success }
GET /api/sites/map            ?project=&status= 
  → [ { id, lat, lng, projectId, status, siteName } ]

// 5. FREE WIFI DAILY LOGS
GET /api/freewifi/logs        ?site=&date_from=&date_to=&page= 
  → { data: [FreeWifiDailyLog], total }
POST /api/freewifi/logs       → { siteId, date, status, bandwidth, users, remarks }
  → FreeWifiDailyLog
PUT /api/freewifi/logs/:id    → { ... } → FreeWifiDailyLog
POST /api/freewifi/bulk       → { logs: [...] } → { inserted, errors }
GET /api/freewifi/summary     ?date= 
  → { totalSites, upCount, downCount, avgBandwidth, totalUsers }
GET /api/freewifi/trend       ?site=&days= 
  → [ { date, status, bandwidth, users } ]

// 6. DICT PROJECT ENTRIES
GET /api/dict/entries         ?project=&site=&date_from=&date_to= 
  → { data: [DictProjectEntry], total }
POST /api/dict/entries        → { projectId, siteId, date, status, percent, deliverables, remarks }
PUT /api/dict/entries/:id     → { ... } → DictProjectEntry
GET /api/dict/accomplishment  ?project= 
  → [ { siteId, siteName, latestPercent, latestStatus, lastUpdate } ]

// 7. MILESTONES
GET /api/milestones           ?project=&site= 
  → [ Milestone ]
POST /api/milestones          → { projectId, siteId, title, targetDate, description }
PUT /api/milestones/:id       → { ... } → Milestone
PUT /api/milestones/:id/status → { status, actualDate } → Milestone

// 8. REPORTS
POST /api/reports/generate    → { type, projectId, dateFrom, dateTo, format }
  → { reportId, downloadUrl }
GET /api/reports              → [ GeneratedReport ]
GET /api/reports/:id/download → File stream (PDF/XLSX/CSV)

// 9. MAP
GET /api/map/sites            ?projects[]=&status= 
  → [ { id, lat, lng, projectId, status, siteName, province, municipality } ]
GET /api/map/heatmap          ?date= 
  → [ { lat, lng, intensity } ]

// 10. ADMIN
GET /api/users                → [ User ]
POST /api/users               → { email, name, role, projectAccess[] }
PUT /api/users/:id            → { ... }
DELETE /api/users/:id         → { success }
GET /api/audit-logs           ?user=&action=&date_from= 
  → [ AuditLog ]
`;

export const folderStructure = `
dict-mris/
├── api/                          # PHP REST API
│   ├── config/
│   │   ├── Database.php
│   │   ├── Constants.php
│   │   └── CORS.php
│   ├── auth/
│   │   ├── Login.php
│   │   ├── Logout.php
│   │   └── JWT.php
│   ├── dashboard/
│   │   ├── GetStats.php
│   │   ├── GetRegionStats.php
│   │   └── GetTrends.php
│   ├── projects/
│   │   ├── List.php
│   │   ├── Get.php
│   │   └── Stats.php
│   ├── sites/
│   │   ├── List.php
│   │   ├── Get.php
│   │   ├── Create.php
│   │   ├── Update.php
│   │   ├── Delete.php
│   │   ├── Nearby.php
│   │   └── MapData.php
│   ├── freewifi/
│   │   ├── ListLogs.php
│   │   ├── CreateLog.php
│   │   ├── UpdateLog.php
│   │   ├── BulkImport.php
│   │   ├── DailySummary.php
│   │   └── Trend.php
│   ├── dict/
│   │   ├── ListEntries.php
│   │   ├── CreateEntry.php
│   │   ├── UpdateEntry.php
│   │   └── Accomplishment.php
│   ├── milestones/
│   │   ├── List.php
│   │   ├── Create.php
│   │   ├── Update.php
│   │   └── UpdateStatus.php
│   ├── reports/
│   │   ├── Generate.php
│   │   ├── List.php
│   │   └── Download.php
│   ├── map/
│   │   ├── Sites.php
│   │   └── Heatmap.php
│   ├── admin/
│   │   ├── Users.php
│   │   └── AuditLogs.php
│   └── uploads/
│       └── attachments/
├── assets/
│   ├── css/
│   │   ├── bootstrap.min.css
│   │   ├── leaflet.css
│   │   ├── tabler-icons.min.css
│   │   └── custom.css
│   ├── js/
│   │   ├── bootstrap.bundle.min.js
│   │   ├── leaflet.js
│   │   ├── chart.js
│   │   ├── tabler-icons.min.js
│   │   └── app.js
│   └── img/
│       └── logos/
│           ├── freewifi.png
│           ├── pnpki.png
│           ├── ilcdb.png
│           ├── iidb.png
│           ├── cybersecurity.png
│           ├── elgu.png
│           ├── egov.png
│           ├── govnet.png
│           └── gecs.png
├── modules/
│   ├── dashboard/
│   │   └── index.php
│   ├── freewifi/
│   │   ├── daily-log.php
│   │   ├── bulk-import.php
│   │   ├── site-list.php
│   │   └── site-detail.php
│   ├── dict-projects/
│   │   ├── project-list.php
│   │   ├── accomplishment.php
│   │   ├── milestones.php
│   │   └── site-detail.php
│   ├── map/
│   │   └── unified-map.php
│   ├── reports/
│   │   ├── generate.php
│   │   └── history.php
│   └── admin/
│       ├── users.php
│       ├── roles.php
│       └── audit.php
├── views/
│   ├── partials/
│   │   ├── header.php
│   │   ├── sidebar.php
│   │   ├── navbar.php
│   │   └── footer.php
│   └── layouts/
│       └── main.php
├── config/
│   └── db.php
├── exports/                      # Generated reports storage
├── uploads/                      # Attachment uploads
├── index.php                     # Entry point / Login
├── .htaccess                     # URL rewriting
└── composer.json
`;
