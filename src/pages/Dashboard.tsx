import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, TrendingUp, TrendingDown, Activity,
  MapPin, Users, Wifi, CheckCircle2, AlertCircle,
  Clock, ArrowUpRight, ArrowDownRight, History, User
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { dailySummaries, regionStats } from '../data/mockData';

interface DashboardStats {
  total_sites: number;
  active_sites: number;
  down_sites: number;
  avg_completion: number;
  total_users_today: number;
  avg_bandwidth: number;
  uptime_rate: number;
  user_change: number;
  bandwidth_change: number;
  uptime_change: number;
}

interface DailySummary {
  date: string;
  upCount: number;
  downCount: number;
  totalSites: number;
  totalUsers: number;
  avgBandwidth: number;
}

interface ProjectStats {
  id: number;
  code: string;
  name: string;
  color: string;
  type: string;
  total_sites: number;
  up_sites: number;
  down_sites: number;
  completion_rate: number;
}

interface RegionStat {
  island_group: string;
  total_sites: number;
  up_sites: number;
  down_sites: number;
  avg_bandwidth: number;
}

interface AuditEntry {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  ip_address: string;
  created_at: string;
  user_name: string;
}

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyData, setDailyData] = useState<DailySummary[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [regionData, setRegionData] = useState<RegionStat[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditEntry[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Array<{ id: number; type: string; site_name: string; date: string; status: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isEncoder = user?.role === 'data_encoder';
  const isManager = user?.role === 'project_manager';
  const isAdmin = user?.role === 'super_admin';
  const isViewer = user?.role === 'viewer';

  useEffect(() => {
    Promise.all([
      api.get<DashboardStats>('dashboard.stats'),
      api.get<any[]>('dashboard.daily'),
      api.get<ProjectStats[]>('projects.stats'),
      api.get<RegionStat[]>('dashboard.regional'),
      api.get<any>('audit.list', { per_page: 8 }),
    ]).then(([statsRes, dailyRes, projRes, regionRes, auditRes]) => {
      setStats(statsRes.data);
      // Map API snake_case format to the frontend's camelCase format
      const normalizedDailyData = dailyRes.data.map(d => ({
        date: d.date,
        totalSites: d.total_sites ?? d.totalSites ?? 0,
        upCount: Number(d.up_count ?? d.upCount ?? 0),
        downCount: Number(d.down_count ?? d.downCount ?? 0),
        totalUsers: Number(d.total_users ?? d.totalUsers ?? 0),
        avgBandwidth: Number(d.avg_bandwidth ?? d.avgBandwidth ?? 0)
      }));
      setDailyData(normalizedDailyData);
      setProjectStats(projRes.data);
      setRegionData(regionRes.data);
      setRecentActivity(auditRes.data ?? []);
      setIsLoading(false);
    }).catch(() => {
      setStats(null);
      setDailyData(dailySummaries);
      setProjectStats([]);
      setRegionData([]);
      setIsLoading(false);
    });
  }, []);

  // Load encoder-specific recent submissions
  useEffect(() => {
    if (!isEncoder && !isManager) return;
    const loadMyData = async () => {
      try {
        if (isEncoder) {
          // Load recent logs and entries by this user
          const [logsRes, entriesRes] = await Promise.all([
            api.get<any[]>('logs.list', { per_page: 5 }),
            api.get<any[]>('entries.list', { per_page: 5 }),
          ]);
          const logItems = (logsRes.data ?? []).map((l: any) => ({
            id: l.id, type: 'Daily Log', site_name: l.site_name || l.site_code || `Site #${l.site_id}`,
            date: l.log_date, status: l.status,
          }));
          const entryItems = (entriesRes.data ?? []).map((e: any) => ({
            id: e.id, type: 'Project Entry', site_name: e.site_name || `Site #${e.site_id}`,
            date: e.entry_date, status: e.status,
          }));
          const combined = [...logItems, ...entryItems]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 8);
          setMySubmissions(combined);
        }
      } catch {
        // Silently ignore
      }
    };
    loadMyData();
  }, [isEncoder, isManager]);

  const displayData = useMemo(() => {
    const mockToday = dailySummaries[dailySummaries.length - 1];
    const mockYesterday = dailySummaries[dailySummaries.length - 2];
    const todayD = dailyData.length > 0 ? dailyData[dailyData.length - 1] : mockToday;
    const yesterdayD = dailyData.length > 1 ? dailyData[dailyData.length - 2] : mockYesterday;

    const avgCompletion = projectStats.length > 0
      ? projectStats.reduce((s, p) => s + p.completion_rate, 0) / projectStats.length
      : 80;

    if (stats && 'fw_total_sites' in (stats as any)) {
      const apiStats = stats as any;
      const total_sites = apiStats.fw_total_sites + (apiStats.dict_total_sites || 0);
      return {
        total_sites,
        active_sites: apiStats.fw_up_sites || 0,
        down_sites: apiStats.fw_down_sites || 0,
        avg_completion: avgCompletion,
        total_users_today: todayD.totalUsers,
        avg_bandwidth: todayD.avgBandwidth,
        uptime_rate: total_sites > 0 ? ((apiStats.fw_up_sites || 0) / total_sites) * 100 : 0,
        user_change: todayD.totalUsers - yesterdayD.totalUsers,
        bandwidth_change: todayD.avgBandwidth - yesterdayD.avgBandwidth,
        uptime_change: 0,
      };
    }

    if (stats) {
      return {
        total_sites: stats.total_sites ?? 0,
        active_sites: stats.active_sites ?? 0,
        down_sites: stats.down_sites ?? 0,
        avg_completion: avgCompletion,
        total_users_today: stats.total_users_today ?? todayD.totalUsers,
        avg_bandwidth: stats.avg_bandwidth ?? todayD.avgBandwidth,
        uptime_rate: stats.uptime_rate ?? (todayD.totalSites > 0 ? (todayD.upCount / todayD.totalSites) * 100 : 0),
        user_change: stats.user_change ?? (todayD.totalUsers - yesterdayD.totalUsers),
        bandwidth_change: stats.bandwidth_change ?? (todayD.avgBandwidth - yesterdayD.avgBandwidth),
        uptime_change: stats.uptime_change ?? (todayD.totalSites > 0 ? ((todayD.upCount / todayD.totalSites) - (yesterdayD.upCount / yesterdayD.totalSites)) * 100 : 0),
      };
    }

    return {
      total_sites: mockToday.totalSites,
      active_sites: mockToday.upCount,
      down_sites: mockToday.downCount,
      avg_completion: avgCompletion,
      total_users_today: mockToday.totalUsers,
      avg_bandwidth: mockToday.avgBandwidth,
      uptime_rate: mockToday.totalSites > 0 ? (mockToday.upCount / mockToday.totalSites) * 100 : 0,
      user_change: mockToday.totalUsers - mockYesterday.totalUsers,
      bandwidth_change: mockToday.avgBandwidth - mockYesterday.avgBandwidth,
      uptime_change: mockToday.totalSites > 0 ? ((mockToday.upCount / mockToday.totalSites) - (mockYesterday.upCount / mockYesterday.totalSites)) * 100 : 0,
    };
  }, [stats, projectStats, dailyData]);

  const today = dailyData.length > 0 ? dailyData[dailyData.length - 1] : dailySummaries[dailySummaries.length - 1];
  const yesterday = dailyData.length > 1 ? dailyData[dailyData.length - 2] : dailySummaries[dailySummaries.length - 2];
  const upChange = today.upCount - yesterday.upCount;

  const statusData = [
    { name: 'UP', value: today.upCount, color: '#22c55e' },
    { name: 'DOWN', value: today.downCount, color: '#ef4444' },
  ];

  const regionChartData = regionData.length > 0
    ? regionData.map(r => ({ name: r.island_group, UP: r.up_sites, DOWN: r.down_sites }))
    : regionStats.map(r => ({ name: r.islandGroup, UP: r.upSites, DOWN: r.downSites }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutDashboard className="text-dict-blue" size={26} />
            {isAdmin ? 'Executive Dashboard' : isManager ? 'Project Overview' : isEncoder ? 'My Dashboard' : 'Dashboard'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isAdmin ? 'Real-time overview of all DICT Region 2 projects'
              : isManager ? 'Status of your assigned projects in Region 2'
              : isEncoder ? 'Your recent submissions and assigned project status'
              : 'DICT Region 2 project overview'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Last updated</p>
          <p className="text-sm font-medium text-slate-700">{new Date().toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sites"
          value={displayData.total_sites.toLocaleString()}
          icon={<MapPin size={20} />}
          color="bg-blue-500"
          subtitle="Across all projects"
        />
        <StatCard
          title="Sites Active / UP"
          value={displayData.active_sites.toLocaleString()}
          icon={<Activity size={20} />}
          color="bg-emerald-500"
          subtitle={`${displayData.total_sites > 0 ? ((displayData.active_sites / displayData.total_sites) * 100).toFixed(1) : 0}% uptime`}
          trend={upChange >= 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(upChange)} from yesterday`}
        />
        <StatCard
          title="Sites Down"
          value={displayData.down_sites.toLocaleString()}
          icon={<AlertCircle size={20} />}
          color="bg-red-500"
          subtitle={`${displayData.total_sites > 0 ? ((displayData.down_sites / displayData.total_sites) * 100).toFixed(1) : 0}% of total`}
        />
        <StatCard
          title="Avg Completion"
          value={`${displayData.avg_completion.toFixed(1)}%`}
          icon={<CheckCircle2 size={20} />}
          color="bg-amber-500"
          subtitle="Milestone-based projects"
        />
      </div>

      {/* Encoder-specific: My Recent Submissions */}
      {isEncoder && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <History size={18} className="text-dict-blue" />
            My Recent Submissions
          </h3>
          {mySubmissions.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No submissions yet. Start by adding daily logs or project entries.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {mySubmissions.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    item.status === 'UP' || item.status === 'COMPLETED' ? 'bg-emerald-500' :
                    item.status === 'DOWN' || item.status === 'DELAYED' ? 'bg-red-500' :
                    'bg-amber-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{item.site_name}</p>
                    <p className="text-[10px] text-slate-400">{item.type}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    item.status === 'UP' || item.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                    item.status === 'DOWN' || item.status === 'DELAYED' ? 'bg-red-50 text-red-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>{item.status}</span>
                  <span className="text-[10px] text-slate-400">{item.date}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Manager-specific: My Projects Quick Status */}
      {isManager && projectStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <CheckCircle2 size={18} className="text-dict-blue" />
            My Projects Status
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {projectStats.map((p) => (
              <div key={p.id} className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-sm font-medium text-slate-700 truncate">{p.name}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                  <div className="h-full rounded-full transition-all" style={{ width: `${p.completion_rate}%`, backgroundColor: p.color }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{p.completion_rate}% complete</span>
                  <span>{p.up_sites}/{p.total_sites} UP</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Trend + Status Pie — Admin & Manager only */}
      {(isAdmin || isManager) && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Wifi size={18} className="text-fw-sky" />
                Free WiFi — 30-Day Trend
              </h3>
              <p className="text-xs text-slate-400">Daily UP vs DOWN site count</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> UP</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> DOWN</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailyData.length > 0 ? dailyData : dailySummaries}>
              <defs>
                <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tickFormatter={(v) => new Date(v).getDate().toString()} stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                labelFormatter={(v) => new Date(v).toLocaleDateString()}
              />
              <Area type="monotone" dataKey="upCount" stroke="#22c55e" fillOpacity={1} fill="url(#colorUp)" strokeWidth={2} name="UP" />
              <Area type="monotone" dataKey="downCount" stroke="#ef4444" fillOpacity={1} fill="url(#colorDown)" strokeWidth={2} name="DOWN" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <h3 className="font-semibold text-slate-800 mb-1">Today's Status</h3>
          <p className="text-xs text-slate-400 mb-4">{new Date().toLocaleDateString()}</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
                <span className="font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(isAdmin || isManager) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <h3 className="font-semibold text-slate-800 mb-4">Regional Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={regionChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="UP" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="DOWN" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <h3 className="font-semibold text-slate-800 mb-4">Project Completion Rates</h3>
          <div className="space-y-4">
            {projectStats.filter(p => p.type === 'milestone').length > 0 ? projectStats.filter(p => p.type === 'milestone').map((p) => (
              <div key={p.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="font-medium text-slate-700">{p.name}</span>
                  </span>
                  <span className="text-slate-500">{p.completion_rate}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${p.completion_rate}%`, backgroundColor: p.color }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {p.up_sites} of {p.total_sites} sites completed
                </p>
              </div>
            )) : (
              <p className="text-sm text-slate-400 text-center py-8">No project data available</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Admin-specific: System Overview */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Users size={18} className="text-dict-blue" />
            System Overview
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-slate-50">
              <p className="text-2xl font-bold text-slate-800">{projectStats.length}</p>
              <p className="text-xs text-slate-500 mt-1">Active Projects</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-50">
              <p className="text-2xl font-bold text-slate-800">{displayData.total_sites}</p>
              <p className="text-xs text-slate-500 mt-1">Total Sites</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-50">
              <p className="text-2xl font-bold text-emerald-700">{displayData.active_sites}</p>
              <p className="text-xs text-emerald-600 mt-1">Sites UP</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50">
              <p className="text-2xl font-bold text-red-700">{displayData.down_sites}</p>
              <p className="text-xs text-red-600 mt-1">Sites DOWN</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
      >
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <History size={18} className="text-dict-blue" />
          Recent Activity
        </h3>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No recent activity found.</p>
        ) : (
          <div className="space-y-0 divide-y divide-slate-50">
            {recentActivity.map((entry) => {
              const actionColor: Record<string, string> = {
                CREATE: 'bg-emerald-100 text-emerald-700',
                UPDATE: 'bg-blue-100 text-blue-700',
                DELETE: 'bg-red-100 text-red-700',
                LOGIN:  'bg-purple-100 text-purple-700',
                LOGOUT: 'bg-slate-100 text-slate-600',
                IMPORT: 'bg-amber-100 text-amber-700',
                EXPORT: 'bg-sky-100 text-sky-700',
              };
              const color = actionColor[entry.action?.toUpperCase()] || 'bg-slate-100 text-slate-600';
              const timeAgo = (() => {
                const diff = Math.floor((Date.now() - new Date(entry.created_at).getTime()) / 1000);
                if (diff < 60) return `${diff}s ago`;
                if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                return new Date(entry.created_at).toLocaleDateString();
              })();
              return (
                <div key={entry.id} className="flex items-center gap-3 py-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">
                      <span className="font-medium">{entry.user_name || 'System'}</span>
                      {' '}
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${color}`}>
                        {entry.action}
                      </span>
                      {' '}
                      <span className="text-slate-500">{entry.entity_type?.replace(/_/g, ' ')}</span>
                      {entry.entity_id ? <span className="text-slate-400"> #{entry.entity_id}</span> : null}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0 flex items-center gap-1">
                    <Clock size={10} />{timeAgo}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickStat
          icon={<Users size={18} />}
          label="Total Users Today"
          value={today.totalUsers.toLocaleString()}
          change={displayData.user_change ?? (today.totalUsers - yesterday.totalUsers)}
          suffix=" from yesterday"
        />
        <QuickStat
          icon={<Clock size={18} />}
          label="Avg Bandwidth"
          value={`${today.avgBandwidth} Mbps`}
          change={displayData.bandwidth_change ?? (today.avgBandwidth - yesterday.avgBandwidth)}
          suffix=" Mbps"
        />
        <QuickStat
          icon={<TrendingUp size={18} />}
          label="Uptime Rate"
          value={`${displayData.uptime_rate.toFixed(1)}%`}
          change={displayData.uptime_change ?? ((today.upCount / today.totalSites) - (yesterday.upCount / yesterday.totalSites)) * 100}
          suffix="%"
          isPercent
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, subtitle, trend, trendValue }: {
  title: string; value: string; icon: React.ReactNode; color: string;
  subtitle: string; trend?: 'up' | 'down'; trendValue?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          {trend && trendValue && (
            <p className={`text-xs mt-2 flex items-center gap-1 ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trendValue}
            </p>
          )}
        </div>
        <div className={`${color} text-white p-2.5 rounded-lg`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function QuickStat({ icon, label, value, change, suffix, isPercent }: {
  icon: React.ReactNode; label: string; value: string; change: number; suffix: string; isPercent?: boolean;
}) {
  const isPositive = change >= 0;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-lg font-bold text-slate-800">{value}</p>
        <p className={`text-[11px] flex items-center gap-0.5 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
          {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {isPercent ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` : `${change > 0 ? '+' : ''}${change.toLocaleString()}${suffix}`}
        </p>
      </div>
    </div>
  );
}
