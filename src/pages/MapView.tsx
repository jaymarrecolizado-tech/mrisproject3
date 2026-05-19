import { useState, useMemo, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Filter, Layers, Wifi, ShieldCheck, Database, Building2, ShieldAlert, Landmark, IdCard, Network, Radio, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { projects as mockProjects, sites as mockSites } from '../data/mockData';
import { api } from '../services/api';
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

function apiSiteToSite(api: ApiSite): Site {
  return {
    id: String(api.id),
    siteCode: api.site_code,
    siteName: api.site_name || api.location_name,
    locationName: api.location_name,
    province: api.province,
    islandGroup: api.island_group,
    district: api.district,
    municipality: api.municipality,
    latitude: api.latitude,
    longitude: api.longitude,
    status: api.status,
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
    type: api.type,
    description: api.description,
    completionRate: 0,
    totalSites: 0,
  };
}

function createCustomIcon(projectId: string, status: string, projectColor: string) {
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
    const bounds = L.latLngBounds(sites.map(s => [s.latitude, s.longitude]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
  }, [map, sites]);

  useMemo(() => {
    setTimeout(fitBounds, 300);
  }, [fitBounds]);

  return null;
}

export default function MapView() {
  const [apiSites, setApiSites] = useState<Site[]>([]);
  const [apiProjects, setApiProjects] = useState<typeof mockProjects>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<ApiSite[]>('sites.map-data'),
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
        completionRate: p.completionRate, totalSites: p.totalSites,
      })));
      setSelectedProjects(mockProjects.filter(p => p.type === 'milestone').map(p => p.id));
      setIsLoading(false);
    });
  }, []);

  const projects = apiProjects.length > 0 ? apiProjects : mockProjects;
  const sites = apiSites.length > 0 ? apiSites : mockSites;

  const filteredSites = useMemo(() => {
    return sites.filter(s => {
      if (!selectedProjects.includes(s.projectId)) return false;
      if (statusFilter === 'all') return true;
      if (statusFilter === 'active') return ['UP', 'COMPLETED', 'ONGOING'].includes(s.status);
      if (statusFilter === 'down') return ['DOWN'].includes(s.status);
      if (statusFilter === 'pending') return ['PENDING', 'PLANNED'].includes(s.status);
      return s.status === statusFilter;
    });
  }, [selectedProjects, statusFilter, sites]);

  const toggleProject = (id: string) => {
    setSelectedProjects(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedProjects(projects.map(p => p.id));
  const clearAll = () => setSelectedProjects([]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-7rem)] -m-4 lg:-m-6 flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-dict-blue mx-auto mb-4" />
          <p className="text-slate-400">Loading map data...</p>
        </div>
      </div>
    );
  }

  const clusterIconFn = createClusterIconFactory(projects);

  return (
    <div className="h-[calc(100vh-7rem)] -m-4 lg:-m-6 relative">
      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="absolute top-4 left-4 z-[1000] bg-white rounded-xl border border-slate-200 shadow-lg w-72 max-h-[calc(100%-2rem)] overflow-y-auto"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Filter size={16} /> Map Filters
              </h3>
              <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-slate-100 rounded">
                <X size={14} />
              </button>
            </div>

            {/* Project Filters */}
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase">Projects</p>
                <div className="flex gap-1">
                  <button onClick={selectAll} className="text-[10px] px-2 py-0.5 bg-slate-100 rounded hover:bg-slate-200">All</button>
                  <button onClick={clearAll} className="text-[10px] px-2 py-0.5 bg-slate-100 rounded hover:bg-slate-200">None</button>
                </div>
              </div>
              <div className="space-y-2">
                {projects.map(p => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded">
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(p.id)}
                      onChange={() => toggleProject(p.id)}
                      className="rounded border-slate-300"
                    />
                    <span className="w-5 h-5 rounded flex items-center justify-center text-white" style={{ backgroundColor: p.color }}>
                      {projectIcons[p.id] || projectIcons.fw}
                    </span>
                    <span className="text-sm text-slate-700">{p.name}</span>
                    <span className="ml-auto text-[10px] text-slate-400">
                      {sites.filter(s => s.projectId === p.id).length}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Status</p>
              <div className="space-y-1.5">
                {[
                  { value: 'all', label: 'All Statuses', color: '#64748b' },
                  { value: 'active', label: 'Active / UP', color: '#22c55e' },
                  { value: 'down', label: 'Down / Delayed', color: '#ef4444' },
                  { value: 'pending', label: 'Pending / Planned', color: '#f59e0b' },
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded">
                    <input
                      type="radio"
                      name="status"
                      value={opt.value}
                      checked={statusFilter === opt.value}
                      onChange={() => setStatusFilter(opt.value)}
                      className="border-slate-300"
                    />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: opt.color }} />
                    <span className="text-sm text-slate-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <p className="text-xs text-slate-500">
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
          className="absolute top-4 left-4 z-[1000] bg-white p-2.5 rounded-lg border border-slate-200 shadow-lg hover:bg-slate-50"
        >
          <Layers size={18} />
        </button>
      )}

      {/* Site Detail Panel */}
      <AnimatePresence>
        {selectedSite && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute top-4 right-4 z-[1000] bg-white rounded-xl border border-slate-200 shadow-lg w-80 max-h-[calc(100%-2rem)] overflow-y-auto"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">{selectedSite.siteName}</h3>
                <p className="text-xs text-slate-400">{selectedSite.siteCode}</p>
              </div>
              <button onClick={() => setSelectedSite(null)} className="p-1 hover:bg-slate-100 rounded">
                <X size={14} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase ${
                    selectedSite.status === 'UP' || selectedSite.status === 'COMPLETED' ? 'bg-emerald-500' :
                    selectedSite.status === 'DOWN' ? 'bg-red-500' :
                    selectedSite.status === 'ONGOING' ? 'bg-blue-500' :
                    'bg-amber-500'
                  }`}
                >
                  {selectedSite.status}
                </span>
                <span className="text-xs text-slate-500">{selectedSite.nationwideId}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Location</span><span className="text-slate-700 text-right">{selectedSite.locationName}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Province</span><span className="text-slate-700">{selectedSite.province}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Island Group</span><span className="text-slate-700">{selectedSite.islandGroup}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">District</span><span className="text-slate-700">{selectedSite.district}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">ISP</span><span className="text-slate-700">{selectedSite.ispProvider}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Technology</span><span className="text-slate-700">{selectedSite.lastMileTech}</span></div>
                {selectedSite.bwDownload > 0 && (
                  <div className="flex justify-between"><span className="text-slate-400">BW Download</span><span className="text-slate-700">{selectedSite.bwDownload} Mbps</span></div>
                )}
                <div className="flex justify-between"><span className="text-slate-400">Coordinates</span><span className="text-slate-700 text-[10px]">{selectedSite.latitude.toFixed(4)}, {selectedSite.longitude.toFixed(4)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Last Updated</span><span className="text-slate-700">{selectedSite.lastUpdated}</span></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <MapContainer
        center={[12.8797, 121.774]}
        zoom={6}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                position={[site.latitude, site.longitude]}
                icon={createCustomIcon(site.projectId, site.status, project?.color || '#3b82f6')}
                eventHandlers={{
                  click: () => setSelectedSite(site),
                }}
                // @ts-ignore — custom property for cluster icon coloring
                projectId={site.projectId}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <p className="font-semibold text-sm">{site.siteName}</p>
                    <p className="text-xs text-slate-500">{site.locationName}</p>
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
