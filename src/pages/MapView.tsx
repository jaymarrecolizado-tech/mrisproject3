import { useState, useMemo, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Filter, Layers, Wifi, ShieldCheck, Database, Building2, ShieldAlert, Landmark, IdCard, Network, Radio, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { projects as mockProjects, sites as mockSites } from '../data/mockData';
import { api } from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';
import type { Site } from '../types';

interface ApiSite {
  id: number;
  site_code: string;
  location_name: string;
  site_name: string;
  province: string;
  municipality: string;
  barangay: string;
  district: string;
  island_group: string;
  latitude: number;
  longitude: number;
  status: string;
  isp_provider: string;
  bw_download: number;
  site_type: string;
  project_id: number;
  project_code: string;
  project_name: string;
  project_color: string;
  nationwide_id?: string;
  last_mile_tech?: string;
  last_updated?: string;
}

interface ApiProject {
  id: number;
  code: string;
  name: string;
  full_name: string;
  color: string;
  type: string;
  description: string;
}

// Leaflet default icon fix for bundlers
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const projectIcons: Record<string, React.ReactNode> = {
  fw: <Wifi size={14} />,
  pnpki: <ShieldCheck size={14} />,
  ilcdb: <Database size={14} />,
  iidb: <Building2 size={14} />,
  cyber: <ShieldAlert size={14} />,
  elgu: <Landmark size={14} />,
  egov: <IdCard size={14} />,
  govnet: <Network size={14} />,
  gecs: <Radio size={14} />,
};

const projectMarkerColors = [
  '#0f766e',
  '#2563eb',
  '#9333ea',
  '#dc2626',
  '#ca8a04',
  '#16a34a',
  '#0891b2',
  '#db2777',
  '#4f46e5',
  '#ea580c',
  '#475569',
  '#65a30d',
];

function withUniqueProjectColors(projects: typeof mockProjects) {
  return projects.map((project, index) => ({
    ...project,
    color: projectMarkerColors[index % projectMarkerColors.length],
  }));
}

function formatCoordinate(value: number | string | null | undefined) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(4) : '-';
}

function apiSiteToSite(api: ApiSite): Site {
  return {
    id: String(api.id),
    siteCode: api.site_code,
    siteName: api.site_name || api.location_name,
    locationName: api.location_name,
    barangay: api.barangay || '',
    province: api.province,
    islandGroup: api.island_group as any,
    district: api.district,
    municipality: api.municipality,
    latitude: Number(api.latitude || 0),
    longitude: Number(api.longitude || 0),
    status: api.status as any,
    ispProvider: api.isp_provider,
    bwDownload: api.bw_download,
    siteType: api.site_type,
    projectId: String(api.project_id),
    nationwideId: api.nationwide_id || '',
    lastMileTech: api.last_mile_tech || '',
    lastUpdated: api.last_updated || '',
  };
}

function apiProjectToMock(api: ApiProject) {
  return {
    id: String(api.id),
    code: api.code,
    name: api.name,
    fullName: api.full_name,
    color: api.color,
    type: api.type as any,
    icon: '',
    description: api.description,
    activeSites: 0,
    downSites: 0,
    completionRate: 0,
    totalSites: 0,
  };
}

function createCustomIcon(status: string, projectColor: string) {
  const color = projectColor || '#3b82f6';

  const statusColors: Record<string, string> = {
    UP: '#22c55e', DOWN: '#ef4444', PARTIAL: '#f59e0b',
    PENDING: '#6b7280', COMPLETED: '#22c55e', ONGOING: '#3b82f6', PLANNED: '#8b5cf6'
  };
  const statusColor = statusColors[status] || '#6b7280';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/>
        </filter>
      </defs>
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z"
        fill="${color}" filter="url(#shadow)" stroke="white" stroke-width="2"/>
      <circle cx="18" cy="18" r="6" fill="white"/>
      <circle cx="28" cy="8" r="5" fill="${statusColor}" stroke="white" stroke-width="1.5"/>
    </svg>
  `;

  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:36px;height:44px;">${svg}</div>`,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  });
}

// Create cluster icon with project color
function createClusterIconFactory(allProjects: typeof mockProjects) {
  return function createClusterIcon(cluster: any) {
    const childCount = cluster.getChildCount();
    const childMarkers = cluster.getAllChildMarkers();

    const projectCounts: Record<string, number> = {};
    childMarkers.forEach((m: any) => {
      const pid = m.options.projectId;
      if (pid) projectCounts[pid] = (projectCounts[pid] || 0) + 1;
    });

    let dominantColor = '#003366';
    let maxCount = 0;
    Object.entries(projectCounts).forEach(([pid, count]) => {
      if (count > maxCount) {
        maxCount = count;
        const proj = allProjects.find(p => p.id === pid);
        if (proj) dominantColor = proj.color;
      }
    });

    const size = childCount < 10 ? 36 : childCount < 100 ? 44 : 52;

    return L.divIcon({
      className: '',
      html: `
        <div style="
          width:${size}px;height:${size}px;
          border-radius:50%;
          background:${dominantColor};
          color:white;
          display:flex;
          align-items:center;
          justify-content:center;
          font-weight:bold;
          font-size:${childCount < 100 ? '13px' : '11px'};
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          font-family:sans-serif;
        ">${childCount}</div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };
}

function MapBounds({ sites }: { sites: Site[] }) {
  const map = useMap();

  const fitBounds = useCallback(() => {
    if (sites.length === 0) return;
    const bounds = L.latLngBounds(sites.map(s => [Number(s.latitude), Number(s.longitude)]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
  }, [map, sites]);

  useMemo(() => {
    setTimeout(fitBounds, 300);
  }, [fitBounds]);

  return null;
}

export default function MapView() {
  const { darkMode } = useDarkMode();
  const [apiSites, setApiSites] = useState<Site[]>([]);
  const [apiProjects, setApiProjects] = useState<typeof mockProjects>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [hoveredSite, setHoveredSite] = useState<Site | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [regionFilter, setRegionFilter] = useState('');
  const [regions, setRegions] = useState<string[]>([]);

  useEffect(() => {
    api.get<Array<{ region: string }>>('sites.regions').then(res => {
      setRegions(res.data.map((r: { region: string }) => r.region));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const regionParam = regionFilter || undefined;
    Promise.all([
      api.get<ApiSite[]>('sites.map-data', regionParam ? { region: regionParam } : {}),
      api.get<ApiProject[]>('projects.list'),
    ]).then(([siteRes, projRes]) => {
      const sites = siteRes.data.map(apiSiteToSite);
      const projs = projRes.data.map(apiProjectToMock);
      setApiSites(sites);
      setApiProjects(projs);
      setSelectedProjects(projs.map(p => p.id));
      setIsLoading(false);
    }).catch(() => {
      setApiSites(mockSites);
      setApiProjects(mockProjects.filter(p => p.type === 'milestone').map(p => ({
        id: p.id, code: p.name, name: p.name, fullName: p.fullName,
        color: p.color, type: p.type, description: p.description,
        icon: p.icon || '', activeSites: p.activeSites || 0, downSites: p.downSites || 0,
        completionRate: p.completionRate, totalSites: p.totalSites,
      })));
      setSelectedProjects(mockProjects.filter(p => p.type === 'milestone').map(p => p.id));
      setIsLoading(false);
    });
  }, [regionFilter]);

  const sourceProjects = apiProjects.length > 0 ? apiProjects : mockProjects;
  const projects = useMemo(() => withUniqueProjectColors(sourceProjects), [sourceProjects]);
  const sites = apiSites.length > 0 ? apiSites : mockSites;

  const filteredSites = useMemo(() => {
    return sites.filter(s => {
      if (!Number.isFinite(Number(s.latitude)) || !Number.isFinite(Number(s.longitude))) return false;
      if (!selectedProjects.includes(s.projectId)) return false;
      if (statusFilter === 'all') return true;
      if (statusFilter === 'active') return ['UP', 'COMPLETED', 'ONGOING'].includes(s.status);
      if (statusFilter === 'down') return ['DOWN'].includes(s.status);
      if (statusFilter === 'pending') return ['PENDING', 'PLANNED'].includes(s.status);
      return s.status === statusFilter;
    });
  }, [selectedProjects, statusFilter, sites]);

  const projectSiteCounts = useMemo(() => {
    return sites.reduce<Record<string, number>>((counts, site) => {
      if (!Number.isFinite(Number(site.latitude)) || !Number.isFinite(Number(site.longitude))) {
        return counts;
      }
      counts[site.projectId] = (counts[site.projectId] || 0) + 1;
      return counts;
    }, {});
  }, [sites]);

  const toggleProject = (id: string) => {
    setSelectedProjects(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedProjects(projects.map(p => p.id));
  const clearAll = () => setSelectedProjects([]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-7rem)] -m-4 lg:-m-6 flex items-center justify-center bg-slate-100 dark:bg-slate-700">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-dict-blue mx-auto mb-4" />
          <p className="text-slate-400 dark:text-slate-500">Loading map data...</p>
        </div>
      </div>
    );
  }

  const clusterIconFn = createClusterIconFactory(projects);
  const detailSite = selectedSite || hoveredSite;
  const detailProject = detailSite ? projects.find(p => p.id === detailSite.projectId) : null;
  const isHoverPreview = Boolean(hoveredSite && !selectedSite);

  return (
    <div className="h-[calc(100vh-7rem)] -m-4 lg:-m-6 relative">
      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="absolute top-4 left-4 z-[1000] bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg w-72 max-h-[calc(100%-2rem)] overflow-y-auto"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Filter size={16} /> Map Filters
              </h3>
              <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                <X size={14} />
              </button>
            </div>

            {/* Project Filters */}
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Projects</p>
                <div className="flex gap-1">
                  <button onClick={selectAll} className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200">All</button>
                  <button onClick={clearAll} className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200">None</button>
                </div>
              </div>
              <div className="space-y-2">
                {projects.map(p => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-1.5 rounded">
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(p.id)}
                      onChange={() => toggleProject(p.id)}
                      className="rounded border-slate-300"
                    />
                    <span className="w-5 h-5 rounded flex items-center justify-center text-white" style={{ backgroundColor: p.color }}>
                      {projectIcons[p.id] || projectIcons.fw}
                    </span>
                    <span className="text-sm text-slate-700 dark:text-slate-200">{p.name}</span>
                    <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500">
                      {sites.filter(s => s.projectId === p.id).length}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Region Filter */}
            {regions.length > 0 && (
            <div className="p-4 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">Region</p>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-dict-blue/30"
              >
                <option value="">All Regions</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            )}

            {/* Status Filter */}
            <div className="p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">Status</p>
              <div className="space-y-1.5">
                {[
                  { value: 'all', label: 'All Statuses', color: '#64748b' },
                  { value: 'active', label: 'Active / UP', color: '#22c55e' },
                  { value: 'down', label: 'Down / Delayed', color: '#ef4444' },
                  { value: 'pending', label: 'Pending / Planned', color: '#f59e0b' },
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-1.5 rounded">
                    <input
                      type="radio"
                      name="status"
                      value={opt.value}
                      checked={statusFilter === opt.value}
                      onChange={() => setStatusFilter(opt.value)}
                      className="border-slate-300"
                    />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: opt.color }} />
                    <span className="text-sm text-slate-700 dark:text-slate-200">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing <strong>{filteredSites.length.toLocaleString()}</strong> of {sites.length.toLocaleString()} sites
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle filter button */}
      {!showFilters && (
        <button
          onClick={() => setShowFilters(true)}
          className="absolute top-4 left-4 z-[1000] bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <Layers size={18} />
        </button>
      )}

      {/* Project color legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg w-72 max-h-64 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
            <Layers size={15} />
            Project Legend
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Marker colors are unique per project</p>
        </div>
        <div className="p-3 space-y-1.5 max-h-48 overflow-y-auto">
          {projects.map(project => {
            const isEnabled = selectedProjects.includes(project.id);
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => toggleProject(project.id)}
                className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                  isEnabled ? 'hover:bg-slate-50 dark:hover:bg-slate-700' : 'opacity-45 hover:opacity-70 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <span className="w-4 h-4 rounded-full border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: project.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{project.name}</span>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 truncate">{project.fullName}</span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{projectSiteCounts[project.id] || 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Site Detail Panel */}
      <AnimatePresence>
        {detailSite && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute top-4 right-4 z-[1000] bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg w-80 max-h-[calc(100%-2rem)] overflow-y-auto"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{detailSite.siteName}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">{detailSite.siteCode}</p>
              </div>
              {isHoverPreview ? (
                <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Hover</span>
              ) : (
                <button onClick={() => setSelectedSite(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                {detailProject && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: detailProject.color }}
                  >
                    {projectIcons[detailProject.id] || projectIcons.fw}
                    {detailProject.name}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase ${
                    detailSite.status === 'UP' || detailSite.status === 'COMPLETED' ? 'bg-emerald-500' :
                    detailSite.status === 'DOWN' ? 'bg-red-500' :
                    detailSite.status === 'ONGOING' ? 'bg-blue-500' :
                    'bg-amber-500'
                  }`}
                >
                  {detailSite.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{detailProject?.fullName || detailProject?.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500">Location</span><span className="text-slate-700 dark:text-slate-200 text-right">{detailSite.locationName}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500">Barangay</span><span className="text-slate-700 dark:text-slate-200 text-right">{detailSite.barangay || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500">Municipality</span><span className="text-slate-700 dark:text-slate-200 text-right">{detailSite.municipality || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500">Province</span><span className="text-slate-700 dark:text-slate-200">{detailSite.province}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500">Island Group</span><span className="text-slate-700 dark:text-slate-200">{detailSite.islandGroup}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500">District</span><span className="text-slate-700 dark:text-slate-200">{detailSite.district}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500">ISP</span><span className="text-slate-700 dark:text-slate-200">{detailSite.ispProvider || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500">Technology</span><span className="text-slate-700 dark:text-slate-200">{detailSite.lastMileTech || '-'}</span></div>
                {detailSite.bwDownload > 0 && (
                  <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500">BW Download</span><span className="text-slate-700 dark:text-slate-200">{detailSite.bwDownload} Mbps</span></div>
                )}
                <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500">Coordinates</span><span className="text-slate-700 dark:text-slate-200 text-[10px]">{formatCoordinate(detailSite.latitude)}, {formatCoordinate(detailSite.longitude)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500">Last Updated</span><span className="text-slate-700 dark:text-slate-200">{detailSite.lastUpdated || '-'}</span></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <MapContainer
        center={[17.0, 121.5]}
        zoom={8}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
      >
        <TileLayer
          attribution={darkMode
            ? '&copy; <a href="https://carto.com/">CARTO</a>'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}
          url={darkMode
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
        />
        <MapBounds sites={filteredSites} />
        <MarkerClusterGroup
          chunkedLoading
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          maxClusterRadius={60}
          iconCreateFunction={clusterIconFn}
        >
          {filteredSites.map(site => {
            const project = projects.find(p => p.id === site.projectId);
            return (
              <Marker
                key={site.id}
                position={[Number(site.latitude), Number(site.longitude)]}
                icon={createCustomIcon(site.status, project?.color || '#3b82f6')}
                eventHandlers={{
                  click: () => {
                    setHoveredSite(null);
                    setSelectedSite(site);
                  },
                  mouseover: () => setHoveredSite(site),
                  mouseout: () => {
                    if (!selectedSite) {
                      setHoveredSite(current => current?.id === site.id ? null : current);
                    }
                  },
                }}
                // @ts-ignore — custom property for cluster icon coloring
                projectId={site.projectId}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <p className="font-semibold text-sm">{site.siteName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{site.locationName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: project?.color }}
                      />
                      <span className="text-xs">{project?.name}</span>
                      <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded text-white ${
                        site.status === 'UP' || site.status === 'COMPLETED' ? 'bg-emerald-500' :
                        site.status === 'DOWN' ? 'bg-red-500' : 'bg-amber-500'
                      }`}>
                        {site.status}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
