import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, TrendingUp, TrendingDown, Activity,
  MapPin, Users, Wifi, CheckCircle2, AlertCircle,
  Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { projects as mockProjects, dailySummaries, regionStats } from '../data/mockData';

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

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyData, setDailyData] = useState<DailySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<DashboardStats>('dashboard.stats'),
      api.get<DailySummary[]>('dashboard.daily'),
    ]).then(([statsRes, dailyRes]) => {
      setStats(statsRes.data);
      setDailyData(dailyRes.data);
      setIsLoading(false);
    }).catch(() => {
      setStats(null);
      setDailyData(dailySummaries);
      setIsLoading(false);
    });
  }, []);

  const displayData = useMemo(() => {
    if (stats) return stats;
    const totalSites = mockProjects.reduce((s, p) => s + p.totalSites, 0);
    const activeSites = mockProjects.reduce((s, p) => s + p.activeSites, 0);
    const downSites = mockProjects.reduce((s, p) => s + p.downSites, 0);
    const avgCompletion = mockProjects.reduce((s, p) => s + p.completionRate, 0) / mockProjects.length;
    const today = dailySummaries[dailySummaries.length - 1];
    const yesterday = dailySummaries[dailySummaries.length - 2];
    return {
      total_sites: totalSites,
      active_sites: activeSites,
      down_sites: downSites,
      avg_completion: avgCompletion,
      total_users_today: today.totalUsers,
      avg_bandwidth: today.avgBandwidth,
      uptime_rate: (today.upCount / today.totalSites) * 100,
      user_change: today.totalUsers - yesterday.totalUsers,
      bandwidth_change: today.avgBandwidth - yesterday.avgBandwidth,
      uptime_change: ((today.upCount / today.totalSites) - (yesterday.upCount / yesterday.totalSites)) * 100,
    };
  }, [stats]);

  const today = dailyData.length > 0 ? dailyData[dailyData.length - 1] : dailySummaries[dailySummaries.length - 1];
  const yesterday = dailyData.length > 1 ? dailyData[dailyData.length - 2] : dailySummaries[dailySummaries.length - 2];
  const upChange = today.upCount - yesterday.upCount;
  const userChange = stats ? stats.user_change : today.totalUsers - yesterday.totalUsers;

  const statusData = [
    { name: 'UP', value: today.upCount, color: '#22c55e' },
    { name: 'DOWN', value: today.downCount, color: '#ef4444' },
  ];

  const regionChartData = regionStats.map(r => ({
    name: r.islandGroup,
    UP: r.upSites,
    DOWN: r.downSites,
  }));

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
            Executive Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time overview of all DICT projects nationwide
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <h3 className="font-semibold text-slate-800 mb-4">Project Completion Rates</h3>
          <div className="space-y-4">
            {mockProjects.filter(p => p.id !== 'fw').map((p) => (
              <div key={p.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="font-medium text-slate-700">{p.name}</span>
                  </span>
                  <span className="text-slate-500">{p.completionRate}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${p.completionRate}%`, backgroundColor: p.color }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {p.activeSites} of {p.totalSites} sites completed
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickStat
          icon={<Users size={18} />}
          label="Total Users Today"
          value={today.totalUsers.toLocaleString()}
          change={userChange}
          suffix=" from yesterday"
        />
        <QuickStat
          icon={<Clock size={18} />}
          label="Avg Bandwidth"
          value={`${today.avgBandwidth} Mbps`}
          change={stats ? stats.bandwidth_change : today.avgBandwidth - yesterday.avgBandwidth}
          suffix=" Mbps"
        />
        <QuickStat
          icon={<TrendingUp size={18} />}
          label="Uptime Rate"
          value={`${displayData.uptime_rate.toFixed(1)}%`}
          change={stats ? stats.uptime_change : ((today.upCount / today.totalSites) - (yesterday.upCount / yesterday.totalSites)) * 100}
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
