import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FolderKanban, Search, ChevronLeft, ChevronRight, Plus,
  CheckCircle2, Clock, Circle,
  Building2, Calendar, ArrowUpDown, BarChart3, Loader2, FileText, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../services/api';
import { projects } from '../data/mockData';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import type { Site, DictProjectEntry } from '../types';

interface ProjectWithStats {
  id: string;
  name: string;
  full_name: string;
  description: string;
  color: string;
  completion_rate: number;
  total_sites: number;
  completed_sites: number;
  ongoing_sites: number;
  planned_sites: number;
  delayed_sites: number;
}

export default function DictProjects() {
  const [projectsList, setProjectsList] = useState<ProjectWithStats[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('siteName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [showSaveEntry, setShowSaveEntry] = useState(false);
  const [entrySiteId, setEntrySiteId] = useState<string | null>(null);
  const toast = useToast();
  const { hasPermission } = useAuth();
  const pageSize = 12;

  useEffect(() => {
    Promise.all([
      api.get<ProjectWithStats[]>('projects.list'),
      api.get<any[]>('sites.list', { per_page: 2000 }),
    ]).then(([projRes, siteRes]) => {
      setProjectsList(projRes.data);
      const mappedSites = siteRes.data.map((apiSite: any) => ({
        id: String(apiSite.id),
        projectId: String(apiSite.project_id),
        nationwideId: apiSite.nationwide_id || '',
        siteCode: apiSite.site_code,
        locationName: apiSite.location_name,
        siteName: apiSite.site_name || apiSite.location_name,
        barangay: apiSite.barangay || '',
        municipality: apiSite.municipality || '',
        province: apiSite.province || '',
        district: apiSite.district || '',
        islandGroup: apiSite.island_group,
        latitude: Number(apiSite.latitude || 0),
        longitude: Number(apiSite.longitude || 0),
        siteType: apiSite.site_type || '',
        ispProvider: apiSite.isp_provider || '',
        lastMileTech: apiSite.last_mile_tech || '',
        bwDownload: Number(apiSite.bw_download || 0),
        status: apiSite.status,
        lastUpdated: apiSite.last_updated || '',
        dailyUsers: apiSite.daily_users || undefined
      }));
      setSites(mappedSites);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, []);

  const milestoneProjects = projectsList.length > 0 ? projectsList : projects.filter(p => p.type === 'milestone').map(p => ({
    id: p.id,
    name: p.name,
    full_name: p.fullName,
    description: p.description,
    color: p.color,
    completion_rate: p.completionRate,
    total_sites: p.totalSites,
    completed_sites: 0,
    ongoing_sites: 0,
    planned_sites: 0,
    delayed_sites: 0,
  }));

  const activeProject = selectedProject ? milestoneProjects.find(p => p.id === selectedProject) : null;
  const projectSites = useMemo(() => {
    if (!selectedProject) return [];
    return sites.filter(s => String(s.projectId) === String(selectedProject));
  }, [selectedProject, sites]);

  const filteredSites = useMemo(() => {
    let result = projectSites;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.siteName.toLowerCase().includes(q) ||
        s.siteCode.toLowerCase().includes(q) ||
        s.province.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }
    result = [...result].sort((a, b) => {
      const aVal = (a as any)[sortField] ?? '';
      const bVal = (b as any)[sortField] ?? '';
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [projectSites, search, statusFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filteredSites.length / pageSize);
  const paginatedSites = filteredSites.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FolderKanban className="text-dict-blue" size={26} />
            DICT Projects
          </h1>
          <p className="text-slate-500 text-sm mt-1">Select a project to view accomplishment tracking and milestones</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {milestoneProjects.map(p => (
            <motion.div
              key={p.id}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedProject(p.id)}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: p.color }}>
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{p.name}</h3>
                    <p className="text-xs text-slate-400">{p.full_name}</p>
                  </div>
                </div>
                <span className="text-lg font-bold" style={{ color: p.color }}>{p.completion_rate}%</span>
              </div>

              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full transition-all" style={{ width: `${p.completion_rate}%`, backgroundColor: p.color }} />
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-emerald-50 rounded-lg p-2">
                  <p className="text-sm font-bold text-emerald-600">{p.completed_sites}</p>
                  <p className="text-[9px] text-emerald-500 uppercase">Done</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-sm font-bold text-blue-600">{p.ongoing_sites}</p>
                  <p className="text-[9px] text-blue-500 uppercase">Active</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2">
                  <p className="text-sm font-bold text-amber-600">{p.planned_sites}</p>
                  <p className="text-[9px] text-amber-500 uppercase">Planned</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2">
                  <p className="text-sm font-bold text-red-600">{p.delayed_sites}</p>
                  <p className="text-[9px] text-red-500 uppercase">Delayed</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => { setSelectedProject(null); setSelectedSite(null); }} className="text-slate-400 hover:text-slate-600">DICT Projects</button>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-800 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeProject?.color }} />
          {activeProject?.name}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl" style={{ backgroundColor: activeProject?.color }}>
              <Building2 size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{activeProject?.full_name}</h1>
              <p className="text-sm text-slate-500">{activeProject?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: activeProject?.color }}>{activeProject?.completion_rate}%</p>
              <p className="text-xs text-slate-400">Completion Rate</p>
            </div>
            {hasPermission('entries.create') && (
              <button
                onClick={() => { setEntrySiteId(null); setShowSaveEntry(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-dict-blue text-white rounded-lg text-sm hover:bg-blue-900"
              >
                <Plus size={14} /> Add Entry
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Accomplishment by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
              { name: 'Completed', value: projectSites.filter(s => s.status === 'COMPLETED').length, color: '#22c55e' },
              { name: 'Ongoing', value: projectSites.filter(s => s.status === 'ONGOING').length, color: '#3b82f6' },
              { name: 'Planned', value: projectSites.filter(s => s.status === 'PLANNED').length, color: '#f59e0b' },
              { name: 'Pending', value: projectSites.filter(s => s.status === 'PENDING').length, color: '#6b7280' },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {['#22c55e', '#3b82f6', '#f59e0b', '#6b7280'].map((c, i) => <Cell key={i} fill={c} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <MilestonesPanel projectId={selectedProject} canManage={hasPermission('milestones.manage')} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search sites..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue"
          >
            <option value="all">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="ONGOING">Ongoing</option>
            <option value="PLANNED">Planned</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('siteName')}>
                  <span className="flex items-center gap-1">Site <ArrowUpDown size={10} /></span>
                </th>
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Province</th>
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Island</th>
                <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Last Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSites.map(site => (
                <tr
                  key={site.id}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedSite(site)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{site.siteName}</p>
                    <p className="text-[10px] text-slate-400">{site.nationwideId}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{site.siteCode}</td>
                  <td className="px-4 py-3 text-slate-600">{site.province}</td>
                  <td className="px-4 py-3 text-slate-600">{site.islandGroup}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={site.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{site.lastUpdated}</td>
                </tr>
              ))}
              {paginatedSites.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No sites found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredSites.length)} of {filteredSites.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={16} /></button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
              <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded text-sm font-medium ${currentPage === i + 1 ? 'bg-dict-blue text-white' : 'hover:bg-slate-100 text-slate-600'}`}>{i + 1}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedSite && (
          <SiteDetailModal
            site={selectedSite}
            projectId={selectedProject}
            onClose={() => setSelectedSite(null)}
            onAddEntry={() => { setEntrySiteId(selectedSite.id); setShowSaveEntry(true); }}
            canCreateEntry={hasPermission('entries.create')}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSaveEntry && selectedProject && (
          <SaveEntryModal
            projectId={selectedProject}
            siteId={entrySiteId}
            sites={sites}
            onClose={() => { setShowSaveEntry(false); setEntrySiteId(null); }}
            onSuccess={() => {
              setShowSaveEntry(false);
              setEntrySiteId(null);
              toast.success('Accomplishment entry saved');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <CheckCircle2 size={10} /> },
    ONGOING: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Clock size={10} /> },
    PLANNED: { bg: 'bg-amber-100', text: 'text-amber-700', icon: <Calendar size={10} /> },
    PENDING: { bg: 'bg-slate-100', text: 'text-slate-700', icon: <Circle size={10} /> },
  };
  const c = config[status] || config.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>
      {c.icon} {status}
    </span>
  );
}

function MilestonesPanel({ projectId, canManage }: { projectId: string; canManage: boolean }) {
  const [milestones, setMilestones] = useState<Array<{ id: number; title: string; target_date: string; actual_date: string | null; status: string; description: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingMs, setEditingMs] = useState<typeof milestones[0] | null>(null);
  const toast = useToast();

  const loadMilestones = useCallback(() => {
    setLoading(true);
    api.get<typeof milestones>('milestones.list', { project_id: projectId })
      .then(res => { setMilestones(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { loadMilestones(); }, [loadMilestones]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete('milestones.delete', id);
      toast.success('Milestone deleted');
      loadMilestones();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">Milestones</h3>
        {canManage && (
          <button
            onClick={() => { setEditingMs(null); setShowCreate(true); }}
            className="flex items-center gap-1 text-xs text-dict-blue hover:text-blue-800 font-medium"
          >
            <Plus size={12} /> Add
          </button>
        )}
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-dict-blue" />
        </div>
      ) : milestones.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">No milestones yet. Click "Add" to create one.</p>
      ) : (
        <div className="space-y-4">
          {milestones.map((ms, idx) => (
            <div key={ms.id} className="relative pl-6 group">
              {idx < milestones.length - 1 && (
                <div className="absolute left-[9px] top-5 bottom-[-16px] w-0.5 bg-slate-200" />
              )}
              <div className={`absolute left-0 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                ms.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-500' :
                ms.status === 'IN_PROGRESS' ? 'bg-white border-blue-500' :
                ms.status === 'DELAYED' ? 'bg-white border-red-400' :
                'bg-white border-slate-300'
              }`}>
                {ms.status === 'COMPLETED' && <CheckCircle2 size={10} className="text-white" />}
                {ms.status === 'IN_PROGRESS' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                {ms.status === 'DELAYED' && <div className="w-2 h-2 rounded-full bg-red-400" />}
              </div>
              <div>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-700">{ms.title}</p>
                  {canManage && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingMs(ms); setShowCreate(true); }} className="p-0.5 text-slate-400 hover:text-blue-600">
                        <FileText size={12} />
                      </button>
                      <button onClick={() => handleDelete(ms.id)} className="p-0.5 text-slate-400 hover:text-red-600">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">Target: {ms.target_date}</p>
                {ms.actual_date && <p className="text-[10px] text-emerald-600">Completed: {ms.actual_date}</p>}
                {ms.description && <p className="text-[10px] text-slate-500 mt-0.5">{ms.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <MilestoneFormModal
            projectId={projectId}
            milestone={editingMs}
            onClose={() => { setShowCreate(false); setEditingMs(null); }}
            onSuccess={() => { setShowCreate(false); setEditingMs(null); loadMilestones(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SiteDetailModal({ site, projectId, onClose, onAddEntry, canCreateEntry }: { site: Site; projectId: string; onClose: () => void; onAddEntry: () => void; canCreateEntry: boolean }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'entries'>('overview');
  const [entries, setEntries] = useState<DictProjectEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  useEffect(() => {
    if (activeTab === 'entries') {
      setLoadingEntries(true);
      api.get<DictProjectEntry[]>(`entries.list`, { site_id: site.id, project_id: projectId })
        .then(res => { setEntries(res.data); setLoadingEntries(false); })
        .catch(() => setLoadingEntries(false));
    }
  }, [activeTab, site.id, projectId]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800">{site.siteName}</h2>
            <p className="text-xs text-slate-400">{site.siteCode}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={site.status} />
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 text-xl">×</button>
          </div>
        </div>

        <div className="flex border-b border-slate-100">
          {(['overview', 'entries'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab ? 'border-dict-blue text-dict-blue' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Location" value={site.locationName} />
              <InfoRow label="Province" value={site.province} />
              <InfoRow label="Island Group" value={site.islandGroup} />
              <InfoRow label="District" value={site.district} />
              <InfoRow label="Coordinates" value={`${site.latitude.toFixed(4)}, ${site.longitude.toFixed(4)}`} />
              <InfoRow label="Last Updated" value={site.lastUpdated} />
            </div>
          )}

          {activeTab === 'entries' && (
            <div className="space-y-3">
              {loadingEntries ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-dict-blue" />
                </div>
              ) : entries.length === 0 ? (
                <>
                  <p className="text-sm text-slate-400 text-center py-8">No accomplishment entries yet.</p>
                  {canCreateEntry && (
                    <button
                      onClick={onAddEntry}
                      className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-dict-blue hover:text-dict-blue transition-colors"
                    >
                      + Add Accomplishment Entry
                    </button>
                  )}
                </>
              ) : (
                <>
                  {entries.map(entry => (
                    <div key={entry.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-dict-blue" />
                          <span className="text-sm font-medium text-slate-700">{entry.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {(entry as any).updated_by_name && (
                            <span className="text-[10px] text-slate-400">by {(entry as any).updated_by_name}</span>
                          )}
                          <StatusBadge status={entry.status} />
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-dict-blue rounded-full"
                            style={{ width: `${entry.accomplishmentPercent}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{entry.accomplishmentPercent}% accomplished</p>
                      </div>
                      {entry.deliverables && (
                        <p className="text-xs text-slate-600 mb-1"><span className="font-medium">Deliverables:</span> {entry.deliverables}</p>
                      )}
                      {entry.remarks && (
                        <p className="text-xs text-slate-500"><span className="font-medium">Remarks:</span> {entry.remarks}</p>
                      )}
                    </div>
                  ))}
                  {canCreateEntry && (
                    <button
                      onClick={onAddEntry}
                      className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-dict-blue hover:text-dict-blue transition-colors"
                    >
                      + Add Another Entry
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-slate-50 rounded-lg">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{label}</p>
      <p className="text-sm font-medium text-slate-700 mt-0.5">{value}</p>
    </div>
  );
}

function MilestoneFormModal({
  projectId,
  milestone,
  onClose,
  onSuccess,
}: {
  projectId: string;
  milestone: { id: number; title: string; target_date: string; actual_date: string | null; status: string; description: string | null } | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(milestone?.title || '');
  const [targetDate, setTargetDate] = useState(milestone?.target_date || '');
  const [actualDate, setActualDate] = useState(milestone?.actual_date || '');
  const [status, setStatus] = useState(milestone?.status || 'PENDING');
  const [description, setDescription] = useState(milestone?.description || '');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title is required'); return; }
    setSubmitting(true);
    try {
      const body = {
        project_id: parseInt(projectId, 10),
        title: title.trim(),
        target_date: targetDate || null,
        actual_date: actualDate || null,
        status,
        description: description.trim() || null,
      };
      if (milestone) {
        await api.put('milestones.update', body, milestone.id);
        toast.success('Milestone updated');
      } else {
        await api.post('milestones.create', body);
        toast.success('Milestone created');
      }
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save milestone');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">{milestone ? 'Edit Milestone' : 'New Milestone'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Phase 1 Deployment"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Actual Date</label>
              <input
                type="date"
                value={actualDate}
                onChange={e => setActualDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue"
            >
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="DELAYED">Delayed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Details about this milestone..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-dict-blue text-white rounded-lg text-sm font-medium hover:bg-blue-900 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><CheckCircle2 size={14} /> {milestone ? 'Update' : 'Create'}</>}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function SaveEntryModal({
  projectId,
  siteId,
  sites,
  onClose,
  onSuccess,
}: {
  projectId: string;
  siteId: string | null;
  sites: Site[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSite, setSelectedSite] = useState(siteId || '');
  const [status, setStatus] = useState('ONGOING');
  const [accomplishmentPercent, setAccomplishmentPercent] = useState(0);
  const [deliverables, setDeliverables] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('entries.create', {
        project_id: parseInt(projectId, 10),
        site_id: selectedSite ? parseInt(selectedSite, 10) : null,
        date,
        status,
        accomplishment_percent: accomplishmentPercent,
        deliverables: deliverables || null,
        remarks: remarks || null,
      });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText size={18} className="text-dict-blue" />
              Add Accomplishment Entry
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Record progress for this project</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto max-h-[70vh] space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue"
              >
                <option value="PLANNED">Planned</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
                <option value="DELAYED">Delayed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Site (optional)</label>
            <select
              value={selectedSite}
              onChange={e => setSelectedSite(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue"
            >
              <option value="">-- General project entry --</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.siteName} ({s.siteCode})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Accomplishment: <span className="text-dict-blue font-bold">{accomplishmentPercent}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={accomplishmentPercent}
              onChange={e => setAccomplishmentPercent(parseInt(e.target.value, 10))}
              className="w-full accent-dict-blue"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Deliverables</label>
            <textarea
              value={deliverables}
              onChange={e => setDeliverables(e.target.value)}
              placeholder="What was delivered or accomplished..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Remarks</label>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Additional notes or issues..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-dict-blue text-white rounded-lg text-sm font-medium hover:bg-blue-900 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> Save Entry
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
