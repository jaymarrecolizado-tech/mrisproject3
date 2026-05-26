import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2, Loader2, AlertCircle, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: number;
  created_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const toast = useToast();

  const loadNotifications = useCallback(() => {
    setLoading(true);
    api.get<Notification[]>('notifications.list')
      .then(res => { setNotifications(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const markAsRead = async (id: number) => {
    try {
      await api.post('notifications.mark-read', null, { id });
      loadNotifications();
    } catch {
      // Ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('notifications.mark-all-read');
      toast.success('All notifications marked as read');
      loadNotifications();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await api.delete('notifications.delete', id);
      loadNotifications();
    } catch {
      // Ignore
    }
  };

  const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  const typeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'error': return <AlertCircle size={16} className="text-red-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Bell className="text-dict-blue" size={26} />
            Notifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-sm text-dict-blue border border-dict-blue rounded-lg hover:bg-blue-50 transition-colors"
          >
            <CheckCheck size={14} /> Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {(['all', 'unread'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-dict-blue text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {f === 'all' ? 'All' : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-dict-blue" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
            <Bell size={40} className="mb-3 opacity-30" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(n => (
              <div
                key={n.id}
                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${!n.is_read ? 'bg-blue-50/30' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">{typeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{n.title}</p>
                      {!n.is_read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{formatDate(n.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!n.is_read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-emerald-600 rounded hover:bg-emerald-50"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 rounded hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
