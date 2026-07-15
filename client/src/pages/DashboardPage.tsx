import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Heart, Activity, Users, Trophy, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Stats {
  todayRequests: number;
  completedDonations: number;
  pendingRequests: number;
  nearbyDonors: number;
  badges: number;
}
interface MonthlyData { _id: { year: number; month: number }; count: number; }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [monthly, setMonthly] = useState<{ month: string; donations: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/dashboard/stats');
        setStats(data.stats);
        const trend = (data.monthlyTrend as MonthlyData[]).map(d => ({
          month: MONTHS[d._id.month - 1],
          donations: d.count,
        }));
        setMonthly(trend);
      } catch(e){ console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const statCards = [
    { label: t('dashboard.todayRequests'), value: stats?.todayRequests ?? 0, Icon: Heart, color: 'from-blood-500 to-blood-700', bg: 'bg-blood-50', text: 'text-blood-700' },
    { label: t('dashboard.completedDonations'), value: stats?.completedDonations ?? 0, Icon: Trophy, color: 'from-blue-500 to-blue-700', bg: 'bg-blue-50', text: 'text-blue-700' },
    { label: t('dashboard.nearbyDonors'), value: stats?.nearbyDonors ?? 0, Icon: Users, color: 'from-emerald-500 to-emerald-700', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { label: t('dashboard.myBadges'), value: stats?.badges ?? user?.badges ?? 0, Icon: Activity, color: 'from-amber-500 to-amber-700', bg: 'bg-amber-50', text: 'text-amber-700' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 page-enter space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{t('dashboard.welcome')},</p>
          <h1 className="font-display text-2xl font-bold text-gray-800">{user?.name?.split(' ')[0]} 👋</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-blood text-base px-3 py-1">{user?.bloodType}</span>
          {(stats?.pendingRequests ?? 0) > 0 && (
            <button onClick={() => navigate('/requests')} className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-2 rounded-xl font-bold hover:bg-amber-100 transition-colors">
              <Clock className="w-3.5 h-3.5" /> {stats?.pendingRequests} Pending <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="card p-4 h-24 skeleton" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map(({ label, value, Icon, bg, text }) => (
            <div key={label} className="card p-4 text-center">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`w-5 h-5 ${text}`} />
              </div>
              <p className={`text-2xl font-black ${text}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Monthly Trend Chart */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-blood-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blood-700" />
          </div>
          <div>
            <h2 className="font-display font-bold text-gray-800">{t('dashboard.monthlyTrend')}</h2>
            <p className="text-xs text-gray-400">Last 6 months donation activity</p>
          </div>
        </div>
        {monthly.length === 0 ? (
          <div className="h-40 flex items-center justify-center">
            <p className="text-gray-400 text-sm">No donation history yet. Start donating to see your trend!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }}
                cursor={{ fill: 'rgba(220,20,60,0.04)' }}
              />
              <Bar dataKey="donations" fill="#DC143C" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/map')} className="card p-4 text-left hover:border-blood-200 transition-all group">
          <div className="w-9 h-9 bg-blood-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blood-200 transition-colors">
            <Users className="w-5 h-5 text-blood-700" />
          </div>
          <p className="font-bold text-gray-800 text-sm">Find Donors</p>
          <p className="text-xs text-gray-400 mt-0.5">Search nearby blood donors on map</p>
        </button>
        <button onClick={() => navigate('/appointments')} className="card p-4 text-left hover:border-blue-200 transition-all group">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
            <Trophy className="w-5 h-5 text-blue-700" />
          </div>
          <p className="font-bold text-gray-800 text-sm">My Appointments</p>
          <p className="text-xs text-gray-400 mt-0.5">View and manage your donation slots</p>
        </button>
      </div>
    </div>
  );
}
