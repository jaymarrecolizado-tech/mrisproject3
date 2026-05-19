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

  function truncate(str: string | null, maxLen: number) {
    if (!str) return '—';
    try {
      const parsed = JSON.parse(str);
      const text = JSON.stringify(parsed);
      return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
    } catch {
      return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
    }
  }

  const totalPages = Math.ceil(total / perPage);
  const entityTypes = ['user', 'project', 'site', 'log', 'milestone', 'role', 'permission'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="text-dict-blue" size={26} />
            Audit Trail
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            System activity log and change history
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <Filter size={14} />
          {showFilters ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">User</label>
              <input
                type="text"
                placeholder="User ID"
                value={filters.user_id}
                onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dict-blue/30"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Action</label>
              <input
                type="text"
                placeholder="e.g. login, create"
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dict-blue/30"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Entity Type</label>
              <select
                value={filters.entity_type}
                onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dict-blue/30"
              >
                <option value="">All</option>
                {entityTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">From Date</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dict-blue/30"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">To Date</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dict-blue/30"
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
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Clear
            </button>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Entity</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">IP Address</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-dict-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        {formatDate(log.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-slate-400" />
                        <span className="text-slate-700">{log.user_name || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-dict-blue">
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatEntityType(log.entity_type)}
                      {log.entity_id && <span className="text-slate-400 ml-1">#{log.entity_id}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                      {log.ip_address || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-slate-400 hover:text-dict-blue hover:bg-blue-50 rounded transition-colors"
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-500">
              Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
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
                        : 'hover:bg-white text-slate-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
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
            className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-800">Audit Log Details</h3>
              <p className="text-xs text-slate-400 mt-0.5">ID: {selectedLog.id}</p>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-400">Timestamp</p>
                  <p className="text-slate-700">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">User</p>
                  <p className="text-slate-700">{selectedLog.user_name || 'System'} ({selectedLog.user_email || 'N/A'})</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-400">Action</p>
                  <p className="text-slate-700 font-medium">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">IP Address</p>
                  <p className="text-slate-700 font-mono text-xs">{selectedLog.ip_address || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-400">Entity Type</p>
                  <p className="text-slate-700">{formatEntityType(selectedLog.entity_type)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Entity ID</p>
                  <p className="text-slate-700">{selectedLog.entity_id || '—'}</p>
                </div>
              </div>
              {selectedLog.old_values && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Old Values</p>
                  <pre className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 overflow-auto max-h-32">
                    {truncate(selectedLog.old_values, 500)}
                  </pre>
                </div>
              )}
              {selectedLog.new_values && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">New Values</p>
                  <pre className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 overflow-auto max-h-32">
                    {truncate(selectedLog.new_values, 500)}
                  </pre>
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
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
