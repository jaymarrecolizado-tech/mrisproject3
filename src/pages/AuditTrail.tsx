import { useState, useEffect } from 'react';
import { Shield, Filter, Calendar, User, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  old_values: string | null;
  new_values: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export default function AuditTrail() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    entity_type: '',
    date_from: '',
    date_to: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  function fetchLogs() {
    setIsLoading(true);
    const params: Record<string, string> = { page: String(page), per_page: String(perPage) };
    if (filters.user_id) params.user_id = filters.user_id;
    if (filters.action) params.action = filters.action;
    if (filters.entity_type) params.entity_type = filters.entity_type;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;

    api.get<PaginatedResponse<AuditLog>>('audit.list', params)
      .then((res) => {
        setLogs(res.data.data);
        setTotal(res.data.total);
        setIsLoading(false);
      })
      .catch(() => {
        setLogs([]);
        setTotal(0);
        setIsLoading(false);
      });
  }

  function applyFilters() {
    setPage(1);
    fetchLogs();
  }

  function clearFilters() {
    setFilters({ user_id: '', action: '', entity_type: '', date_from: '', date_to: '' });
    setPage(1);
  }

  function formatAction(action: string) {
    return action.replace(/\./g, ' › ').replace(/_/g, ' ');
  }

  function formatEntityType(type: string | null) {
    if (!type) return '—';
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }

  const totalPages = Math.ceil(total / perPage);
  const entityTypes = ['user', 'project', 'site', 'log', 'milestone', 'role', 'permission'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Shield className="text-dict-blue" size={26} />
            Audit Trail
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            System activity log and change history
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <Filter size={14} />
          {showFilters ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">User</label>
              <input
                type="text"
                placeholder="User ID"
                value={filters.user_id}
                onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-dict-blue/30"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Action</label>
              <input
                type="text"
                placeholder="e.g. login, create"
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-dict-blue/30"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Entity Type</label>
              <select
                value={filters.entity_type}
                onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-dict-blue/30"
              >
                <option value="">All</option>
                {entityTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">From Date</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-dict-blue/30"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">To Date</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-dict-blue/30"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={applyFilters}
              className="px-4 py-2 text-sm bg-dict-blue text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
            >
              <Search size={14} />
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              Clear
            </button>
          </div>
        </motion.div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Timestamp</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Entity</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">IP Address</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="w-6 h-6 border-2 border-dict-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400 dark:text-slate-500" />
                        {formatDate(log.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-slate-400 dark:text-slate-500" />
                        <span className="text-slate-700 dark:text-slate-200">{log.user_name || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-dict-blue">
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {formatEntityType(log.entity_type)}
                      {log.entity_id && <span className="text-slate-400 dark:text-slate-500 ml-1">#{log.entity_id}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                      {log.ip_address || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-dict-blue hover:bg-blue-50 rounded transition-colors"
                        title="View details"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-white dark:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-7 h-7 text-xs rounded transition-colors ${
                      page === pageNum
                        ? 'bg-dict-blue text-white'
                        : 'hover:bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded hover:bg-white dark:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedLog(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Audit Log Details</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">ID: {selectedLog.id}</p>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Timestamp</p>
                  <p className="text-slate-700 dark:text-slate-200">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">User</p>
                  <p className="text-slate-700 dark:text-slate-200">{selectedLog.user_name || 'System'} ({selectedLog.user_email || 'N/A'})</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Action</p>
                  <p className="text-slate-700 dark:text-slate-200 font-medium">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">IP Address</p>
                  <p className="text-slate-700 dark:text-slate-200 font-mono text-xs">{selectedLog.ip_address || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Entity Type</p>
                  <p className="text-slate-700 dark:text-slate-200">{formatEntityType(selectedLog.entity_type)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Entity ID</p>
                  <p className="text-slate-700 dark:text-slate-200">{selectedLog.entity_id || '—'}</p>
                </div>
              </div>
              {selectedLog.old_values && selectedLog.new_values && (() => {
                let oldObj: Record<string, unknown> = {};
                let newObj: Record<string, unknown> = {};
                try { oldObj = JSON.parse(selectedLog.old_values); } catch { /* ignore */ }
                try { newObj = JSON.parse(selectedLog.new_values); } catch { /* ignore */ }
                const allKeys = [...new Set([...Object.keys(oldObj), ...Object.keys(newObj)])];
                if (allKeys.length === 0) return null;
                return (
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Changes</p>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                          <tr>
                            <th className="text-left px-3 py-2 text-slate-500 dark:text-slate-400 font-medium">Field</th>
                            <th className="text-left px-3 py-2 text-slate-500 dark:text-slate-400 font-medium">Before</th>
                            <th className="text-left px-3 py-2 text-slate-500 dark:text-slate-400 font-medium">After</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {allKeys.map((key) => {
                            const oldVal = String(oldObj[key] ?? '');
                            const newVal = String(newObj[key] ?? '');
                            const changed = oldVal !== newVal;
                            return (
                              <tr key={key}>
                                <td className="px-3 py-1.5 font-medium text-slate-700 dark:text-slate-200">{key.replace(/_/g, ' ')}</td>
                                <td className={`px-3 py-1.5 ${changed ? 'bg-red-50 text-red-700' : 'text-slate-400 dark:text-slate-500'}`}>{oldVal || '—'}</td>
                                <td className={`px-3 py-1.5 ${changed ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400 dark:text-slate-500'}`}>{newVal || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-sm bg-dict-blue text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
