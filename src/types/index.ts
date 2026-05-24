export interface Project {
  id: string;
  code: string;
  name: string;
  fullName: string;
  color: string;
  icon: string;
  description: string;
  type: 'daily' | 'milestone';
  totalSites: number;
  activeSites: number;
  downSites: number;
  completionRate: number;
}

export interface Site {
  id: string;
  projectId: string;
  nationwideId: string;
  siteCode: string;
  locationName: string;
  siteName: string;
  barangay: string;
  municipality: string;
  province: string;
  district: string;
  islandGroup: 'Luzon' | 'Visayas' | 'Mindanao';
  latitude: number;
  longitude: number;
  siteType: string;
  ispProvider: string;
  lastMileTech: string;
  bwDownload: number;
  status: 'UP' | 'DOWN' | 'PARTIAL' | 'PENDING' | 'COMPLETED' | 'ONGOING' | 'PLANNED';
  lastUpdated: string;
  dailyUsers?: number;
}

export interface FreeWifiDailyLog {
  id: string;
  siteId: string;
  date: string;
  status: 'UP' | 'DOWN';
  bandwidthUtilization: number;
  totalUniqueUsers: number;
  remarks: string;
  loggedBy: string;
}

export interface DictProjectEntry {
  id: string;
  projectId: string;
  siteId: string;
  date: string;
  status: 'COMPLETED' | 'ONGOING' | 'PLANNED' | 'DELAYED';
  accomplishmentPercent: number;
  deliverables: string;
  remarks: string;
  attachments: string[];
  updatedBy: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  siteId: string;
  title: string;
  targetDate: string;
  actualDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'project_manager' | 'encoder' | 'viewer';
  projectAccess: string[];
  role_id?: number;
}

export interface RegionStats {
  islandGroup: string;
  totalSites: number;
  upSites: number;
  downSites: number;
  avgUsers: number;
}

export interface DailySummary {
  date: string;
  totalSites: number;
  upCount: number;
  downCount: number;
  partialCount: number;
  totalUsers: number;
  avgBandwidth: number;
}
