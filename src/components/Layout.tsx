import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Map, Wifi, FolderKanban, FileText,
  Database, ChevronLeft, ChevronRight, Menu, X, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/map', label: 'Unified Map', icon: Map },
  { path: '/freewifi', label: 'Free WiFi', icon: Wifi },
  { path: '/dict-projects', label: 'DICT Projects', icon: FolderKanban },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/schema', label: 'MySQL Spec', icon: Database },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: number; name: string; color: string; total_sites: number; active_sites: number }>>([]);
  const location = useLocation();

  useEffect(() => {
    api.get<Array<{ id: number; name: string; color: string; total_sites: number; active_sites: number }>>('projects.list')
      .then((res) => setProjects(res.data))
      .catch(() => {});
  }, []);

  const initials = user?.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="flex h-screen bg-slate-50">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-dict-blue text-white transition-all duration-300 flex flex-col
          ${collapsed ? 'w-16' : 'w-64'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-dict-gold flex items-center justify-center">
                <span className="text-dict-blue font-bold text-sm">DICT</span>
              </div>
              <div className="leading-tight">
                <p className="text-xs font-bold">DICT MRIS</p>
                <p className="text-[10px] text-white/60">Unified Reporting</p>
              </div>
            </div>
          )}
          <button
            onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
            className="p-1 rounded hover:bg-white/10 hidden lg:block"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded hover:bg-white/10 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                  ${isActive ? 'bg-dict-gold/20 text-dict-gold font-medium' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}

          {!collapsed && projects.length > 0 && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-3 text-[10px] uppercase tracking-wider text-white/40 font-semibold">Projects</p>
              </div>
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white/90 cursor-default"
                  title={collapsed ? p.name : undefined}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs">{p.name}</p>
                      <p className="text-[10px] text-white/30">{p.active_sites}/{p.total_sites} sites</p>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 w-full"
          >
            <LogOut size={16} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-700">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400">{user?.email || ''}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-dict-blue text-white flex items-center justify-center text-sm font-bold">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
