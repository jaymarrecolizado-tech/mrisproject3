import { useState, useEffect, useCallback, useMemo } from 'react';
import { Shield, Check, X, Loader2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Permission {
  id: number;
  slug: string;
  name: string;
  group_name: string;
  description: string;
}

interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
  permission_slugs: string | null;
  user_count?: number;
}

export default function Roles() {
  const toast = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    Promise.all([
      api.get<Role[]>('roles.list'),
      api.get<Record<string, Permission[]>>('permissions.list'),
      api.get<{ id: string; role_id: string }[]>('users.list', { per_page: '1000' }),
    ]).then(([rolesRes, permsRes, usersRes]) => {
      const rolesData = rolesRes.data.map(r => ({
        ...r,
        user_count: usersRes.data.filter(u => u.role_id === String(r.id)).length,
      }));
      setRoles(rolesData);
      setPermissions(permsRes.data);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openEditor = (role: Role) => {
    setEditingRole(role);
    const perms = role.permission_slugs
      ? new Set(role.permission_slugs.split(','))
      : new Set<string>();
    setSelectedPerms(perms);
  };

  const togglePerm = (slug: string) => {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggleGroup = (group: string) => {
    const groupPerms = permissions[group]?.map(p => p.slug) || [];
    const allSelected = groupPerms.every(s => selectedPerms.has(s));
    setSelectedPerms(prev => {
      const next = new Set(prev);
      if (allSelected) {
        groupPerms.forEach(s => next.delete(s));
      } else {
        groupPerms.forEach(s => next.add(s));
      }
      return next;
    });
  };

  const selectAll = () => {
    const all = Object.values(permissions).flat().map(p => p.slug);
    setSelectedPerms(new Set(all));
  };

  const clearAll = () => {
    setSelectedPerms(new Set());
  };

  const handleSave = async () => {
    if (!editingRole) return;
    setSaving(true);
    try {
      await api.put('roles.update', { permissions: Array.from(selectedPerms) }, editingRole.id);
      toast.success(`Permissions updated for ${editingRole.name}`);
      setEditingRole(null);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const permGroups = useMemo(() => Object.keys(permissions).sort(), [permissions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-slate-400">Loading roles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Shield className="text-dict-blue" size={26} />
          Roles & Permissions
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage role-based access control — {roles.length} roles defined
        </p>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map(role => {
          const permCount = role.permission_slugs ? role.permission_slugs.split(',').length : 0;
          return (
            <motion.div
              key={role.id}
              whileHover={{ y: -2 }}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{role.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{role.slug}</p>
                </div>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                  {role.user_count ?? 0} users
                </span>
              </div>
              {role.description && (
                <p className="text-sm text-slate-500 mt-2">{role.description}</p>
              )}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">{permCount} permissions</span>
                <button
                  onClick={() => openEditor(role)}
                  className="text-sm text-dict-blue hover:underline font-medium"
                >
                  Edit Permissions
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Permission Editor Modal */}
      <AnimatePresence>
        {editingRole && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setEditingRole(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Shield size={20} className="text-dict-blue" />
                    {editingRole.name} — Permissions
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedPerms.size} of {Object.values(permissions).flat().length} permissions selected</p>
                </div>
                <button onClick={() => setEditingRole(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">✕</button>
              </div>

              {/* Quick Actions */}
              <div className="px-6 py-3 border-b border-slate-100 flex gap-2">
                <button onClick={selectAll} className="text-xs px-2 py-1 bg-slate-100 rounded hover:bg-slate-200 text-slate-600">Select All</button>
                <button onClick={clearAll} className="text-xs px-2 py-1 bg-slate-100 rounded hover:bg-slate-200 text-slate-600">Clear All</button>
              </div>

              {/* Permission Groups */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {permGroups.map(group => {
                  const groupPerms = permissions[group];
                  const groupSelected = groupPerms.filter(p => selectedPerms.has(p.slug)).length;
                  const allSelected = groupSelected === groupPerms.length;
                  const someSelected = groupSelected > 0 && !allSelected;

                  return (
                    <div key={group} className="border border-slate-200 rounded-lg">
                      <button
                        onClick={() => toggleGroup(group)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-t-lg hover:bg-slate-100"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            allSelected ? 'bg-dict-blue border-dict-blue' :
                            someSelected ? 'bg-dict-blue/30 border-dict-blue' :
                            'border-slate-300'
                          }`}>
                            {allSelected && <Check size={10} className="text-white" />}
                            {someSelected && <div className="w-2 h-0.5 bg-dict-blue rounded" />}
                          </div>
                          <span className="text-sm font-medium text-slate-700 capitalize">{group.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="text-xs text-slate-400">{groupSelected}/{groupPerms.length}</span>
                      </button>
                      <div className="p-3 grid grid-cols-2 gap-1.5">
                        {groupPerms.map(perm => {
                          const checked = selectedPerms.has(perm.slug);
                          return (
                            <label
                              key={perm.slug}
                              className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded"
                            >
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                  checked ? 'bg-dict-blue border-dict-blue' : 'border-slate-300'
                                }`}
                                onClick={(e) => { e.preventDefault(); togglePerm(perm.slug); }}
                              >
                                {checked && <Check size={10} className="text-white" />}
                              </div>
                              <span className="text-xs text-slate-600">{perm.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => setEditingRole(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-dict-blue text-white rounded-lg text-sm hover:bg-blue-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save Permissions</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
