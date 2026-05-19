import { useState, useEffect } from 'react';
import { User, Shield, Mail, Key, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface UserPermission {
  id: number;
  name: string;
}

interface UserRole {
  id: number;
  name: string;
  description: string;
  permissions: UserPermission[];
}

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (user?.role_id) {
      api.get<UserRole>('roles.get', { id: user.role_id })
        .then(res => setRole(res.data))
        .catch(() => {});
    }
  }, [user?.role_id]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setChanging(true);
    try {
      await api.post('auth.change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  const initials = user?.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <User className="text-dict-blue" size={26} />
          Profile & Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account information and password</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Account Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <User size={18} className="text-dict-blue" />
            Account Information
          </h2>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-dict-blue text-white flex items-center justify-center text-xl font-bold">
              {initials}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{user?.name}</h3>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <InfoField icon={<Mail size={14} />} label="Email" value={user?.email || '—'} />
            <InfoField icon={<User size={14} />} label="Full Name" value={user?.name || '—'} />
            <InfoField icon={<Shield size={14} />} label="Role" value={role?.name || user?.role || '—'} />
          </div>

          {role?.description && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">{role.description}</p>
            </div>
          )}
        </div>

        {/* Permissions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <Shield size={18} className="text-dict-blue" />
            Permissions
          </h2>

          {role?.permissions && role.permissions.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {role.permissions.map(p => (
                <div key={p.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span className="text-xs text-slate-700">{p.name.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">Loading permissions...</p>
          )}
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm lg:col-span-2">
          <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <Key size={18} className="text-dict-blue" />
            Change Password
          </h2>

          <form onSubmit={handleChangePassword} className="max-w-lg space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dict-blue pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 pr-10 ${
                      confirmPassword && newPassword !== confirmPassword
                        ? 'border-red-300 focus:ring-red-300'
                        : 'border-slate-200 focus:ring-dict-blue'
                    }`}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[10px] text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={changing || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="flex items-center gap-2 px-6 py-2.5 bg-dict-blue text-white rounded-lg text-sm font-medium hover:bg-blue-900 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {changing ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Changing...
                </>
              ) : (
                <>
                  <Key size={14} /> Change Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
      <div className="text-slate-400">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{label}</p>
        <p className="text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
}
