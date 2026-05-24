import { useState, useEffect, useMemo } from 'react';
import {
  Users, Search, Plus, Edit2, Trash2, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight, Loader2, Shield, Mail, Building2,
  Key, Eye, EyeOff, FolderKanban, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface ApiUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  department: string | null;
  is_active: number;
  last_login_at: string | null;
  created_at: string;
  role_slug: string;
  role_name: string;
  role_id: number;
}

interface Role {
  id: number;
  name: string;
  slug: string;
}

interface ProjectAccess {
  project_id: number;
  name: string;
  code: string;
  color: string;
  type: string;
  access_level: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [accessUser, setAccessUser] = useState<ApiUser | null>(null);
  const toast = useToast();
  const pageSize = 10;

  useEffect(() => {
    Promise.all([
      api.get<ApiUser[]>('users.list'),
      api.get<Role[]>('roles.list'),
    ]).then(([userRes, roleRes]) => {
      setUsers(userRes.data);
      setRoles(roleRes.data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q)
      );
    }
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role_slug === roleFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(u => u.is_active === (statusFilter === 'active' ? 1 : 0));
    }
    return result;
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleToggleActive = async (user: ApiUser) => {
    try {
      await api.put(`users.update?id=${user.id}`, { is_active: user.is_active ? 0 : 1 });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: u.is_active ? 0 : 1 } : u));
      toast.success(user.is_active ? 'User deactivated' : 'User activated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user');
    }
  };

  const handleDelete = async (user: ApiUser) => {
    if (!confirm(`Deactivate ${user.name}?`)) return;
    try {
      await api.delete(`users.delete?id=${user.id}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      toast.success('User deactivated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to deactivate user');
    }
  };

  const roleColor = (slug: string) => {
    const map: Record<string, string> = {
      super_admin: 'bg-red-100 text-red-700',
      admin: 'bg-purple-100 text-purple-700',
      project_manager: 'bg-blue-100 text-blue-700',
      encoder: 'bg-amber-100 text-amber-700',
      viewer: 'bg-slate-100 text-slate-700',
    };
    return map[slug] || 'bg-slate-100 text-slate-700';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-dict-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-dict-blue" size={26} />
            User Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage system users, roles, and access</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-dict-blue text-white rounded-lg text-sm hover:bg-blue-900"
        >
          <Plus size={14} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue"
          >
            <option value="all">All Roles</option>
            {roles.map(r => <option key={r.id} value={r.slug}>{r.name}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider hidden md:table-cell">Department</th>
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Last Login</th>
                <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-dict-blue text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Mail size={10} /> {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${roleColor(user.role_slug)}`}>
                      <Shield size={8} className="mr-1" /> {user.role_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                    {user.department ? (
                      <span className="flex items-center gap-1"><Building2 size={10} /> {user.department}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-medium">
                        <XCircle size={12} /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditingUser(user); setShowCreateModal(true); }}
                        className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setAccessUser(user)}
                        className="p-1.5 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-600"
                        title="Manage Project Access"
                      >
                        <FolderKanban size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className="p-1.5 hover:bg-amber-50 rounded-lg text-slate-400 hover:text-amber-600"
                        title={user.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {user.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"
                        title="Deactivate"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No users found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length}
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
        {showCreateModal && (
          <UserFormModal
            user={editingUser}
            roles={roles}
            onClose={() => { setShowCreateModal(false); setEditingUser(null); }}
            onSuccess={() => {
              setShowCreateModal(false);
              setEditingUser(null);
              api.get<ApiUser[]>('users.list').then(res => setUsers(res.data));
              toast.success(editingUser ? 'User updated' : 'User created');
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {accessUser && (
          <ProjectAccessModal
            user={accessUser}
            onClose={() => setAccessUser(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function UserFormModal({
  user,
  roles,
  onClose,
  onSuccess,
}: {
  user: ApiUser | null;
  roles: Role[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [roleId, setRoleId] = useState(user?.role_id?.toString() || (roles.find(r => r.slug === 'encoder')?.id.toString() || '4'));
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !password) {
      toast.error('Password is required for new users');
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, any> = { name, email, phone: phone || null, department: department || null, role_id: parseInt(roleId, 10) };
      if (password) payload.password = password;

      if (user) {
        await api.put(`users.update?id=${user.id}`, payload);
      } else {
        await api.post('users.create', payload);
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save user');
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
        className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Shield size={18} className="text-dict-blue" />
              {user ? 'Edit User' : 'Add User'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{user ? 'Update user details' : 'Create a new system user'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto max-h-[70vh] space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Password {user && <span className="text-slate-400">(leave blank to keep current)</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue pr-10"
                required={!user}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
            <select
              value={roleId}
              onChange={e => setRoleId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue"
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
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
                <><Loader2 size={14} className="animate-spin" /> Saving...</>
              ) : (
                <><Key size={14} /> {user ? 'Update' : 'Create'}</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function ProjectAccessModal({
  user,
  onClose,
}: {
  user: ApiUser;
  onClose: () => void;
}) {
  const [accessList, setAccessList] = useState<ProjectAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    api.get<ProjectAccess[]>(`users.project-access.get?id=${user.id}`)
      .then((res) => {
        setAccessList(res.data || []);
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to load project access');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user.id]);

  const handleLevelChange = (projectId: number, level: string) => {
    setAccessList(prev => prev.map(item => 
      item.project_id === projectId ? { ...item, access_level: level === 'none' ? null : level } : item
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = accessList.map(item => ({
        project_id: item.project_id,
        access_level: item.access_level || 'none'
      }));
      await api.put(`users.project-access.update?id=${user.id}`, { access: payload });
      toast.success('Project access updated successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update project access');
    } finally {
      setSaving(false);
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
              <FolderKanban size={18} className="text-dict-blue" />
              Project Access: {user.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Assign project-level view, edit, or admin permissions</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 text-xl">×</button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-dict-blue" />
            </div>
          ) : accessList.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No active projects found.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {accessList.map((project) => (
                <div key={project.project_id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0`} style={{ backgroundColor: project.color || '#94a3b8' }} />
                      <span className="font-medium text-slate-700 text-sm truncate">{project.name}</span>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono ml-4 uppercase">
                      {project.type} ({project.code})
                    </span>
                  </div>
                  <select
                    value={project.access_level || 'none'}
                    onChange={(e) => handleLevelChange(project.project_id, e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-dict-blue"
                  >
                    <option value="none">No Access</option>
                    <option value="view">Viewer</option>
                    <option value="edit">Editor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className="flex-1 py-2 bg-dict-blue text-white rounded-lg text-sm font-medium hover:bg-blue-900 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 size={14} className="animate-spin" /> Saving...</>
            ) : (
              <><Save size={14} /> Save Access</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
