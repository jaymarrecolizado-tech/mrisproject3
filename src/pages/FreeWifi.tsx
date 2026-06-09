import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Wifi, Search, Calendar,
  Upload, Download, Plus, ChevronLeft, ChevronRight,
  Activity, ArrowUpDown, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { api } from '../services/api';
import { dailySummaries } from '../data/mockDataDev';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import SitePhotos from '../components/SitePhotos';
import type { Site } from '../types';

export default function FreeWifi() {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const [searchParams] = useSearchParams();
  const [sites, setSites] = useState<Site[]>([]);
  const [trendData, setTrendData] = useState<typeof dailySummaries>(dailySummaries);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState<'logs' | 'sites'>('logs');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('siteName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const pageSize = 15;

  const fetchSites = useCallback(() => {
    // project_id=1 is FREEWIFI — use numeric ID for reliable lookup
    api.get<any[]>('sites.list', { project_id: 1, per_page: 2000 })
      .then((res) => {
        const mapped = res.data.map((apiSite: any) => ({
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
        setSites(mapped);
      })
      .catch(() => setSites([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchSites();
    // Fetch real 30-day trend data
    api.get<any[]>('dashboard.daily', { days: 30 })
      .then((res) => {
        const normalized = res.data.map((d: any) => ({
          date: d.date,
          totalSites: d.total_sites ?? d.totalSites ?? 0,
          upCount: Number(d.up_count ?? d.upCount ?? 0),
          downCount: Number(d.down_count ?? d.downCount ?? 0),
          totalUsers: Number(d.total_users ?? d.totalUsers ?? 0),
          avgBandwidth: Number(d.avg_bandwidth ?? d.avgBandwidth ?? 0),
        }));
        if (normalized.length > 0) setTrendData(normalized as typeof dailySummaries);
      })
      .catch(() => {}); // keep mock data on error
  }, [fetchSites]);

  const fwSites = sites;

  const provinces = useMemo(() => {
    const set = new Set(fwSites.map(s => s.province));
    return Array.from(set).sort();
  }, [fwSites]);

  const filteredSites = useMemo(() => {
    let result = fwSites;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.siteName.toLowerCase().includes(q) ||
        s.siteCode.toLowerCase().includes(q) ||
        s.province.toLowerCase().includes(q) ||
        s.municipality.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }
    if (provinceFilter !== 'all') {
      result = result.filter(s => s.province === provinceFilter);
    }
    result = [...result].sort((a, b) => {
      const aVal = (a as any)[sortField] ?? '';
      const bVal = (b as any)[sortField] ?? '';
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [fwSites, search, statusFilter, provinceFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filteredSites.length / pageSize);
  const paginatedSites = filteredSites.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const stats = useMemo(() => {
    const up = fwSites.filter(s => s.status === 'UP').length;
    const down = fwSites.filter(s => s.status === 'DOWN').length;
    return { total: fwSites.length, up, down, rate: fwSites.length > 0 ? ((up / fwSites.length) * 100).toFixed(1) : '0.0' };
  }, [fwSites]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleExportLogs = async () => {
    try {
      await api.download('logs.export', `logs_export_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success('Logs exported successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const handleExportSites = async () => {
    try {
      await api.download('sites.export', `sites_export_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success('Sites exported successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400 dark:text-slate-500">Loading Free WiFi sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Wifi className="text-fw-sky" size={26} />
            Free WiFi Monitoring
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Nationwide Free WiFi Program — {stats.total} sites deployed
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission('logs.bulk_import') && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Upload size={14} /> Import
            </button>
          )}
          {hasPermission('sites.export') && (
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                <Download size={14} /> Export
              </button>
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button onClick={handleExportLogs} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-t-lg">
                  Daily Logs
                </button>
                <button onClick={handleExportSites} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-b-lg">
                  Sites
                </button>
              </div>
            </div>
          )}
          {hasPermission('logs.create') && (
            <button
              onClick={() => setShowLogModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-fw-sky text-white rounded-lg text-sm hover:bg-sky-600"
            >
              <Plus size={14} /> Submit Log
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">Total Sites</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">Online</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.up}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{stats.rate}% uptime</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">Offline</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{stats.down}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">Daily Users</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
            {(trendData[trendData.length - 1]?.totalUsers ?? dailySummaries[dailySummaries.length - 1]?.totalUsers ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* 30-day trend */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Activity size={18} className="text-fw-sky" />
          30-Day Status Trend
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="upGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="downGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tickFormatter={(v) => new Date(v).getDate().toString()} stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              labelFormatter={(v) => new Date(v).toLocaleDateString()} />
            <Area type="monotone" dataKey="upCount" stroke="#22c55e" fill="url(#upGrad)" strokeWidth={2} name="UP" />
            <Area type="monotone" dataKey="downCount" stroke="#ef4444" fill="url(#downGrad)" strokeWidth={2} name="DOWN" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Filters + Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search site name, code, province..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fw-sky/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="UP">UP</option>
            <option value="DOWN">DOWN</option>
            <option value="PARTIAL">Partial</option>
            <option value="PENDING">Pending</option>
          </select>
          <select
            value={provinceFilter}
            onChange={(e) => { setProvinceFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
          >
            <option value="all">All Provinces</option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('siteCode')}>
                  <span className="flex items-center gap-1">Code <ArrowUpDown size={12} /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('siteName')}>
                  <span className="flex items-center gap-1">Site Name <ArrowUpDown size={12} /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('province')}>
                  <span className="flex items-center gap-1">Province <ArrowUpDown size={12} /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('municipality')}>
                  <span className="flex items-center gap-1">Municipality <ArrowUpDown size={12} /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium">ISP</th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('bwDownload')}>
                  <span className="flex items-center gap-1">Bandwidth <ArrowUpDown size={12} /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('status')}>
                  <span className="flex items-center gap-1">Status <ArrowUpDown size={12} /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium">Users</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSites.map((site) => (
                <tr key={site.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{site.siteCode}</td>
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{site.siteName}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{site.province}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{site.municipality}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{site.ispProvider}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{site.bwDownload} Mbps</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={site.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {site.dailyUsers?.toLocaleString() ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedSite(site)}
                      className="text-fw-sky hover:text-sky-700 text-xs font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedSites.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                    No sites found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredSites.length)} of {filteredSites.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
                    ${page === currentPage ? 'bg-fw-sky text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Site Detail Modal */}
      <AnimatePresence>
        {selectedSite && (
          <SiteDetailModal site={selectedSite} onClose={() => setSelectedSite(null)} />
        )}
      </AnimatePresence>

      {/* Log Submission Modal */}
      <AnimatePresence>
        {showLogModal && (
          <LogModal onClose={() => setShowLogModal(false)} onSaved={fetchSites} sites={sites} />
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <ImportModal
            onClose={() => setShowImportModal(false)}
            importType={importType}
            onTypeChange={setImportType}
            onImport={async (file: File) => {
              try {
                const endpoint = importType === 'logs' ? 'logs.bulk-import' : 'sites.import';
                const res = await api.upload<{ imported: number }>(endpoint, file);
                toast.success(`Imported ${res.data?.imported ?? 0} records`);
                setShowImportModal(false);
                fetchSites();
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Import failed');
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    UP: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'UP' },
    DOWN: { bg: 'bg-red-100', text: 'text-red-700', label: 'DOWN' },
    PARTIAL: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Partial' },
    PENDING: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300', label: 'Pending' },
    MAINTENANCE: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Maintenance' },
  };
  const c = config[status] ?? config.DOWN;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'UP' ? 'bg-emerald-500' : status === 'DOWN' ? 'bg-red-500' : status === 'PARTIAL' ? 'bg-amber-500' : 'bg-slate-400'}`} />
      {c.label}
    </span>
  );
}

function SiteDetailModal({ site, onClose }: { site: Site; onClose: () => void }) {
  const [recentLogs, setRecentLogs] = useState<Array<{ date: string; users: number; bandwidth: number; loggedByName: string }>>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    setLoadingLogs(true);
    api.get<any[]>('logs.site-logs', { site_id: site.id, days: 14 })
      .then((res) => {
        const mapped = (res.data || []).map((l: any) => ({
          date: l.log_date || l.date || '',
          users: Number(l.total_unique_users ?? l.users ?? 0),
          bandwidth: Number(l.bandwidth_utilization ?? l.bandwidth ?? 0),
          loggedByName: l.logged_by_name || '',
        })).sort((a: any, b: any) => a.date.localeCompare(b.date));
        setRecentLogs(mapped);
      })
      .catch(() => setRecentLogs([]))
      .finally(() => setLoadingLogs(false));
  }, [site.id]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{site.siteName}</h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{site.siteCode} — {site.municipality}, {site.province}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500">✕</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <DetailItem label="Status" value={<StatusBadge status={site.status} />} />
            <DetailItem label="ISP" value={site.ispProvider} />
            <DetailItem label="Bandwidth" value={`${site.bwDownload} Mbps`} />
            <DetailItem label="Daily Users" value={site.dailyUsers?.toLocaleString() ?? '—'} />
          </div>
        </div>
        <div className="p-6">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">14-Day User Trend</h3>
          {loadingLogs ? (
            <div className="flex items-center justify-center h-[200px]">
              <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
            </div>
          ) : recentLogs.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">No log data available for this site.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={recentLogs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickFormatter={(v) => new Date(v).getDate().toString()} stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="users" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Users" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 max-h-40 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <th className="text-left py-1.5 font-medium">Date</th>
                      <th className="text-right py-1.5 font-medium">Users</th>
                      <th className="text-right py-1.5 font-medium">BW %</th>
                      <th className="text-right py-1.5 font-medium">Logged By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentLogs.slice().reverse().map((l) => (
                      <tr key={l.date} className="text-slate-600 dark:text-slate-300">
                        <td className="py-1">{new Date(l.date).toLocaleDateString()}</td>
                        <td className="text-right py-1">{l.users.toLocaleString()}</td>
                        <td className="text-right py-1">{l.bandwidth}%</td>
                        <td className="text-right py-1 text-slate-400 dark:text-slate-500">{l.loggedByName || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        <div className="px-6 pb-6">
          <SitePhotos siteId={site.id} canEdit />
        </div>
      </motion.div>
    </motion.div>
  );
}


function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-1">{value}</p>
    </div>
  );
}

function LogModal({ onClose, onSaved, sites }: { onClose: () => void; onSaved: () => void; sites: Site[] }) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    siteId: '', status: 'UP', users: '', bandwidth: '', remarks: '',
  });

  const fwSites = useMemo(() => sites.filter(s => s.projectId === '1' || (s as any).project_code === 'FREEWIFI'), [sites]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.siteId) {
      toast.error('Please select a site');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('logs.create', {
        site_id: parseInt(formData.siteId),
        status: formData.status,
        total_unique_users: parseInt(formData.users) || 0,
        bandwidth_utilization: parseFloat(formData.bandwidth) || 0,
        remarks: formData.remarks,
      });
      toast.success('Daily log submitted successfully');
      onSaved();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit log');
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
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar size={20} className="text-fw-sky" />
            Submit Daily Log
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Site</label>
            <select
              value={formData.siteId}
              onChange={(e) => setFormData(prev => ({ ...prev, siteId: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fw-sky/30"
              required
            >
              <option value="">Select a site...</option>
              {fwSites.map(s => (
                <option key={s.id} value={s.id}>{s.siteCode} — {s.siteName}, {s.province}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
            >
              <option value="UP">UP</option>
              <option value="DOWN">DOWN</option>
              <option value="PARTIAL">Partial</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Users</label>
              <input
                type="number"
                value={formData.users}
                onChange={(e) => setFormData(prev => ({ ...prev, users: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">BW (Mbps)</label>
              <input
                type="number"
                step="0.1"
                value={formData.bandwidth}
                onChange={(e) => setFormData(prev => ({ ...prev, bandwidth: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                placeholder="0.0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fw-sky/30"
              rows={3}
              placeholder="Optional notes..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-fw-sky text-white rounded-lg text-sm hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Submit Log'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function ImportModal({ onClose, onImport, importType, onTypeChange }: {
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
  importType: 'logs' | 'sites';
  onTypeChange: (type: 'logs' | 'sites') => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    await onImport(selectedFile);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Upload size={20} className="text-slate-600 dark:text-slate-300" />
            Import CSV
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Import Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onTypeChange('logs')}
                className={`flex-1 px-3 py-2 border rounded-lg text-sm ${
                  importType === 'logs'
                    ? 'border-fw-sky bg-sky-50 text-fw-sky'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Daily Logs
              </button>
              <button
                type="button"
                onClick={() => onTypeChange('sites')}
                className={`flex-1 px-3 py-2 border rounded-lg text-sm ${
                  importType === 'sites'
                    ? 'border-fw-sky bg-sky-50 text-fw-sky'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Sites
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">CSV File</label>
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center hover:border-slate-300 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload size={24} className="mx-auto text-slate-400 dark:text-slate-500 mb-2" />
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">CSV files only</p>
              </label>
            </div>
          </div>
          {importType === 'logs' && (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Expected CSV columns:</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">site_id, date, status, bandwidth, users, remarks</p>
            </div>
          )}
          {importType === 'sites' && (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Expected CSV columns:</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">project_id, site_code, location, site_name, barangay, municipality, province, island_group, lat, lng, type, ISP, bandwidth, status</p>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={!selectedFile}
              className="flex-1 px-4 py-2.5 bg-fw-sky text-white rounded-lg text-sm hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Upload size={14} /> Import
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
