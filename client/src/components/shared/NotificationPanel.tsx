import { useEffect, useRef, useState } from 'react';
import { Bell, X, CheckCheck, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  request_received: '🩸', request_accepted: '✅', request_rejected: '❌',
  request_completed: '🏅', appointment_booked: '📅', appointment_confirmed: '📅',
  appointment_cancelled: '🚫', appointment_completed: '🏅', emergency_alert: '🚨',
  emergency_accepted: '✅', donation_reminder: '💉', badge_awarded: '🏅', message: '💬',
};

export default function NotificationPanel() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const fetchUnread = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnread(data.count || 0);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  const deleteOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.delete(`/notifications/${id}`);
    setNotifications(ns => ns.filter(n => n._id !== id));
  };

  const today = new Date().toDateString();
  const todayNots = notifications.filter(n => new Date(n.createdAt).toDateString() === today);
  const earlierNots = notifications.filter(n => new Date(n.createdAt).toDateString() !== today);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-50 transition-colors"
        title={t('notifications.title')}
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-blood-600 text-white text-xs font-black rounded-full flex items-center justify-center animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-[360px] max-h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-[9999] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h3 className="font-display font-bold text-gray-800">{t('notifications.title')}</h3>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-blood-600 font-semibold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blood-50 transition-colors">
                  <CheckCheck className="w-3.5 h-3.5" /> {t('notifications.markAllRead')}
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => <div key={i} className="flex gap-3"><div className="w-8 h-8 skeleton rounded-full" /><div className="flex-1 space-y-2"><div className="h-3 skeleton w-3/4" /><div className="h-2.5 skeleton w-full" /></div></div>)}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Bell className="w-10 h-10 text-gray-200 mb-2" />
                <p className="text-gray-400 text-sm">{t('notifications.noNotifications')}</p>
              </div>
            ) : (
              <div>
                {todayNots.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wider">{t('notifications.today')}</p>
                    {todayNots.map(n => <NotifCard key={n._id} n={n} onDelete={deleteOne} onClose={() => setOpen(false)} />)}
                  </div>
                )}
                {earlierNots.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wider">{t('notifications.earlier')}</p>
                    {earlierNots.map(n => <NotifCard key={n._id} n={n} onDelete={deleteOne} onClose={() => setOpen(false)} />)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifCard({ n, onDelete, onClose }: { n: Notification; onDelete(id: string, e: React.MouseEvent): void; onClose(): void }) {
  const icon = TYPE_ICONS[n.type] || '🔔';
  const handleClick = () => {
    if (n.actionUrl) { window.location.href = n.actionUrl; onClose(); }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors group ${!n.read ? 'bg-blood-50/40' : ''}`}
    >
      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-xl">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-semibold text-gray-800 truncate ${!n.read ? 'text-blood-700' : ''}`}>{n.title}</p>
          {!n.read && <div className="w-2 h-2 bg-blood-500 rounded-full flex-shrink-0" />}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
        <p className="text-xs text-gray-300 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
      </div>
      <button
        onClick={(e) => onDelete(n._id, e)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
