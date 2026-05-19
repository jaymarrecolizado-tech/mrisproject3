import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Wifi, Search, Calendar, TrendingUp, TrendingDown,
  Upload, Download, Plus, ChevronLeft, ChevronRight,
  Signal, Activity, ArrowUpDown, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { api } from '../services/api';
import { dailySummaries, generateDailyLogs } from '../data/mockData';
import { useToast } from '../context/ToastContext';
import type { Site } from '../types';

export default function FreeWifi() {
  const toast = useToast();
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('siteName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const pageSize = 15;

  const fetchSites = useCallback(() => {
    api.get<Site[]>('sites.list', { project_id: 'fw' })
      .then((res) => setSites(res.data))
      .catch(() => setSites([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchSites();
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading Free WiFi sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wifi className="text-fw-sky" size={26} />
            Free WiFi Monitoring
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Nationwide Free WiFi Program — {stats.total} sites deployed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <Upload size={14} /> Import
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <Download size={14} /> Export
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-fw-sky text-white rounded-lg text-sm hover:bg-sky-600"
          >
            <Plus size={14} /> Submit Log
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Total Sites</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Online</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.up}</p>
          <p className="text-xs text-slate-400">{stats.rate}% uptime</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Offline</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{stats.down}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Daily Users</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {dailySummaries[dailySummaries.length - 1]?.totalUsers.toLocaleString() ?? '0'}
          </p>
        </div>
      </div>

      {/* 30-day trend */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Activity size={18} className="text-fw-sky" />
          30-Day Status Trend
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dailySummaries}>
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search site name, code, province..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fw-sky/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
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
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
          >
            <option value="all">All Provinces</option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
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
                <th className="text-left px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort('bandwidth')}>
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
                <tr key={site.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{site.siteCode}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{site.siteName}</td>
                  <td className="px-4 py-3 text-slate-500">{site.province}</td>
                  <td className="px-4 py-3 text-slate-500">{site.municipality}</td>
                  <td className="px-4 py-3 text-slate-500">{site.isp}</td>
                  <td className="px-4 py-3 text-slate-500">{site.bandwidth} Mbps</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={site.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">
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
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
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
            <p className="text-xs text-slate-400">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredSites.length)} of {filteredSites.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
                    ${page === currentPage ? 'bg-fw-sky text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
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
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    UP: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'UP' },
    DOWN: { bg: 'bg-red-100', text: 'text-red-700', label: 'DOWN' },
    PARTIAL: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Partial' },
    PENDING: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Pending' },
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
  const logs = generateDailyLogs(site.id);
  const recentLogs = logs.slice(-14);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{site.siteName}</h2>
              <p className="text-sm text-slate-400 mt-0.5">{site.siteCode} — {site.municipality}, {site.province}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">✕</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <DetailItem label="Status" value={<StatusBadge status={site.status} />} />
            <DetailItem label="ISP" value={site.isp} />
            <DetailItem label="Bandwidth" value={`${site.bandwidth} Mbps`} />
            <DetailItem label="Daily Users" value={site.dailyUsers?.toLocaleString() ?? '—'} />
          </div>
        </div>
        <div className="p-6">
          <h3 className="font-semibold text-slate-800 mb-3">14-Day User Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={recentLogs}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tickFormatter={(v) => new Date(v).getDate().toString()} stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="users" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-slate-700 mt-1">{value}</p>
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={20} className="text-fw-sky" />
            Submit Daily Log
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Site</label>
            <select
              value={formData.siteId}
              onChange={(e) => setFormData(prev => ({ ...prev, siteId: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fw-sky/30"
              required
            >
              <option value="">Select a site...</option>
              {fwSites.map(s => (
                <option key={s.id} value={s.id}>{s.siteCode} — {s.siteName}, {s.province}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
            >
              <option value="UP">UP</option>
              <option value="DOWN">DOWN</option>
              <option value="PARTIAL">Partial</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Users</label>
              <input
                type="number"
                value={formData.users}
                onChange={(e) => setFormData(prev => ({ ...prev, users: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">BW (Mbps)</label>
              <input
                type="number"
                step="0.1"
                value={formData.bandwidth}
                onChange={(e) => setFormData(prev => ({ ...prev, bandwidth: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
                placeholder="0.0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fw-sky/30"
              rows={3}
              placeholder="Optional notes..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
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
