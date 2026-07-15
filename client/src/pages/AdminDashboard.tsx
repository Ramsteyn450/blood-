import { useState, useEffect } from 'react';
import api from '../utils/api';
import { AdminStats, User, DonationRequest, Report } from '../types';
import {
  Users, Heart, Activity, AlertTriangle, Ban, CheckCircle, LayoutDashboard, Flag, Shield,
  Trophy, MessageSquare, Building, Calendar, TrendingUp, Droplets, Clock, Search,
  UserCheck, Star, MapPin, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

type Tab = 'overview' | 'users' | 'donations' | 'reports' | 'bloodbank' | 'analytics';

const BLOOD_COLORS: Record<string, string> = {
  'A+':'#e74c3c','A-':'#c0392b','B+':'#e67e22','B-':'#d35400',
  'AB+':'#9b59b6','AB-':'#8e44ad','O+':'#e91e63','O-':'#c2185b'
};

const PIE_COLORS = ['#DC143C','#e74c3c','#e67e22','#f39c12','#9b59b6','#8e44ad','#e91e63','#c2185b'];

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [donations, setDonations] = useState<DonationRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [orgs, setOrgs] = useState<User[]>([]);
  const [bloodDist, setBloodDist] = useState<{ name: string; value: number }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; requests: number; completed: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    if (tab === 'users') fetchUsers();
    else if (tab === 'donations') fetchDonations();
    else if (tab === 'reports') fetchReports();
    else if (tab === 'bloodbank') fetchOrgs();
    else if (tab === 'analytics') fetchAnalytics();
  }, [tab, search, roleFilter]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data.stats);
      // Blood type distribution from stats if available
      if (data.bloodTypeDist) {
        setBloodDist(Object.entries(data.bloodTypeDist).map(([name, value]) => ({ name, value: value as number })));
      }
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { search };
      if (roleFilter !== 'all') params.role = roleFilter;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchDonations = async () => { setLoading(true); try { const { data } = await api.get('/admin/donations'); setDonations(data.donations); } catch(e) { console.error(e); } finally { setLoading(false); } };
  const fetchReports = async () => { setLoading(true); try { const { data } = await api.get('/admin/reports'); setReports(data.reports); } catch(e) { console.error(e); } finally { setLoading(false); } };
  const fetchOrgs = async () => {
    setLoading(true);
    try { const { data } = await api.get('/admin/users', { params: { role: 'organization' } }); setOrgs(data.users); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  };
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/dashboard/stats');
      if (data.monthlyTrend) {
        setMonthlyData(data.monthlyTrend.map((d: { _id: { month: number }; count: number }) => ({
          month: MONTHS[d._id.month - 1],
          requests: d.count,
          completed: Math.round(d.count * 0.7),
        })));
      }
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const toggleBan = async (id: string, banned: boolean) => { try { await api.patch(`/admin/users/${id}/ban`, { banned: !banned }); fetchUsers(); fetchStats(); } catch(e) { console.error(e); } };
  const markReviewed = async (id: string) => { try { await api.patch(`/admin/reports/${id}/review`); fetchReports(); } catch(e) { console.error(e); } };
  const promoteToOrg = async (id: string) => {
    if (!confirm('Promote this user to Organization role?')) return;
    try { await api.patch(`/admin/users/${id}/role`, { role: 'organization' }); fetchUsers(); } catch(e) { console.error(e); }
  };

  const refresh = async () => { setRefreshing(true); await fetchStats(); setRefreshing(false); };

  const TABS = [
    { id:'overview'  as Tab, icon:LayoutDashboard, label:'Overview'  },
    { id:'analytics' as Tab, icon:TrendingUp,      label:'Analytics' },
    { id:'users'     as Tab, icon:Users,           label:'Users'     },
    { id:'bloodbank' as Tab, icon:Building,        label:'Orgs'      },
    { id:'donations' as Tab, icon:Heart,           label:'Donations' },
    { id:'reports'   as Tab, icon:Flag,            label:'Reports'   },
  ];

  const colorMap: Record<string,string> = {
    blue:'bg-blue-100 text-blue-600', emerald:'bg-emerald-100 text-emerald-600', amber:'bg-amber-100 text-amber-600',
    orange:'bg-orange-100 text-orange-600', teal:'bg-teal-100 text-teal-600', blood:'bg-blood-100 text-blood-600',
    red:'bg-red-100 text-red-600', purple:'bg-purple-100 text-purple-600', indigo:'bg-indigo-100 text-indigo-600',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blood-100 rounded-xl flex items-center justify-center"><Shield className="w-5 h-5 text-blood-700" /></div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm">LifeFlow Network Control Panel</p>
          </div>
        </div>
        <button onClick={refresh} disabled={refreshing} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blood-600 bg-white border border-gray-200 px-3 py-2 rounded-xl transition-colors">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-gray-100 p-1 rounded-2xl mb-6 scrollbar-none">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 py-2 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${tab===id?'bg-white text-blood-700 shadow-sm':'text-gray-400 hover:text-gray-600'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { icon:Users,       label:'Total Users',      value:stats.totalUsers,          color:'blue',   sub:'Registered' },
              { icon:Activity,    label:'Active Donors',    value:stats.activeDonors,         color:'emerald',sub:'Eligible & visible' },
              { icon:Heart,       label:'Pending Requests', value:stats.pendingRequests,      color:'orange', sub:'Awaiting response' },
              { icon:CheckCircle, label:'Accepted',         value:stats.acceptedRequests||0,  color:'teal',   sub:'In progress' },
              { icon:Trophy,      label:'Completed',        value:stats.totalDonations,       color:'blood',  sub:'Successful donations' },
              { icon:Building,    label:'Organizations',    value:stats.organizations||0,     color:'purple', sub:'Blood banks & hospitals' },
              { icon:AlertTriangle,label:'Reports',         value:stats.totalReports,         color:'red',    sub:'Pending review' },
              { icon:MessageSquare,label:'Community',       value:stats.communityMessages||0, color:'indigo', sub:'Messages posted' },
            ].map(({ icon: Icon, label, value, color, sub }) => (
              <div key={label} className="card p-4 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}><Icon className="w-5 h-5" /></div>
                <p className="font-display text-2xl font-bold text-gray-800">{value.toLocaleString()}</p>
                <p className="text-xs font-bold text-gray-600 mt-0.5">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="font-bold text-gray-700 mb-4 text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blood-600" />Network Health</h3>
              {[
                { label:'Eligible Donor Rate', val:stats.totalUsers>0?(stats.activeDonors/stats.totalUsers)*100:0, color:'bg-emerald-500' },
                { label:'Donation Completion',  val:(stats.totalDonations+stats.pendingRequests)>0?(stats.totalDonations/(stats.totalDonations+stats.pendingRequests))*100:0, color:'bg-blood-500' },
                { label:'Request Acceptance',   val:stats.pendingRequests+stats.acceptedRequests>0?((stats.acceptedRequests||0)/(stats.pendingRequests+(stats.acceptedRequests||0)))*100:0, color:'bg-blue-500' },
              ].map(({ label, val, color }) => (
                <div key={label} className="mb-4">
                  <div className="flex justify-between text-sm mb-1.5"><span className="text-gray-600 font-medium">{label}</span><span className="font-black text-gray-800">{Math.round(val)}%</span></div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width:`${val}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="card p-5">
              <h3 className="font-bold text-gray-700 mb-4 text-sm flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" />Quick Actions</h3>
              {[
                { icon:Users,     label:'Manage Users',             t:'users'     as Tab },
                { icon:Building,  label:'Organization Accounts',    t:'bloodbank' as Tab },
                { icon:TrendingUp,label:'View Analytics',           t:'analytics' as Tab },
                { icon:Heart,     label:'All Donations',            t:'donations' as Tab },
                { icon:Flag,      label:`Review Reports (${stats.totalReports})`, t:'reports'as Tab },
              ].map(({ icon: Icon, label, t }) => (
                <button key={label} onClick={() => setTab(t)} className="w-full flex items-center gap-3 p-3 hover:bg-blood-50 rounded-xl transition-colors text-left group mb-1.5">
                  <div className="w-8 h-8 bg-blood-50 group-hover:bg-blood-100 rounded-lg flex items-center justify-center transition-colors"><Icon className="w-4 h-4 text-blood-600" /></div>
                  <span className="font-semibold text-gray-700 text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── ANALYTICS ── */}
      {tab === 'analytics' && (
        <div className="space-y-5">
          {/* Blood Type Distribution */}
          {bloodDist.length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold text-gray-700 mb-4 text-sm flex items-center gap-2"><Droplets className="w-4 h-4 text-blood-600" />Blood Type Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={bloodDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(props) => `${props.name ?? ''} ${(((props.percent) ?? 0)*100).toFixed(0)}%`}>
                    {bloodDist.map((entry, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Monthly Trend */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-700 mb-4 text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blood-600" />Monthly Donation Trend</h3>
            {monthlyData.length === 0 ? (
              <div className="text-center py-8 text-gray-400"><p className="text-sm">No data yet</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                  <XAxis dataKey="month" tick={{ fontSize:11, fill:'#9ca3af' }} />
                  <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius:'12px', border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.1)', fontSize:'12px' }} />
                  <Bar dataKey="requests"  fill="#DC143C" radius={[4,4,0,0]} maxBarSize={24} name="Requests" />
                  <Bar dataKey="completed" fill="#10b981" radius={[4,4,0,0]} maxBarSize={24} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Blood type manual distribution if no API data */}
          {bloodDist.length === 0 && (
            <div className="card p-5">
              <h3 className="font-bold text-gray-700 mb-4 text-sm">Blood Type Overview</h3>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(BLOOD_COLORS).map(([bt, color]) => (
                  <div key={bt} className="text-center p-3 rounded-xl" style={{ background: color + '20' }}>
                    <p className="font-black text-lg" style={{ color }}>{bt}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">Blood type distribution will appear as more users register</p>
            </div>
          )}
        </div>
      )}

      {/* ── USERS ── */}
      {tab === 'users' && (
        <div>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..." className="input-field pl-10 w-full" />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field px-3 py-2">
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="organization">Organization</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {loading ? <div className="flex justify-center py-8"><div className="spinner w-6 h-6" /></div> : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>{['User','Blood','Role','Status','Badges','Location','Joined','Actions'].map(h => <th key={h} className="text-left py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-wider">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(u => (
                      <tr key={u._id} className="hover:bg-gray-50/80">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blood-400 to-blood-700 flex items-center justify-center text-white font-black text-xs">{u.name.charAt(0)}</div>
                            <div><p className="font-bold text-gray-800 text-xs">{u.name}</p><p className="text-xs text-gray-400 truncate max-w-[100px]">{u.email}</p></div>
                          </div>
                        </td>
                        <td className="py-3 px-4"><span className="badge-blood">{u.bloodType}</span></td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${u.role==='admin'?'bg-purple-100 text-purple-700 border-purple-200':u.role==='organization'?'bg-blue-100 text-blue-700 border-blue-200':'bg-gray-100 text-gray-600 border-gray-200'}`}>{u.role||'user'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${u.isBanned?'bg-red-100 text-red-700 border-red-200':u.eligible?'bg-emerald-100 text-emerald-700 border-emerald-200':'bg-gray-100 text-gray-500 border-gray-200'}`}>
                            {u.isBanned?'Banned':u.eligible?'Eligible':'Ineligible'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-black text-amber-600">{u.badges}</td>
                        <td className="py-3 px-4 text-gray-400 text-xs">
                          {(u.district || u.state) ? <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{u.district}{u.district&&u.state?', ':''}{u.state}</span> : '—'}
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-xs">{format(new Date(u.createdAt),'MMM d, yy')}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1.5 flex-wrap">
                            <button onClick={() => toggleBan(u._id, u.isBanned)} className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors ${u.isBanned?'bg-emerald-100 text-emerald-700 hover:bg-emerald-200':'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                              {u.isBanned?<><CheckCircle className="w-3 h-3"/>Unban</>:<><Ban className="w-3 h-3"/>Ban</>}
                            </button>
                            {u.role === 'user' && (
                              <button onClick={() => promoteToOrg(u._id)} className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                                <Building className="w-3 h-3" />Org
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length===0&&<div className="text-center py-12 text-gray-400"><Users className="w-8 h-8 mx-auto mb-2 opacity-30"/><p className="text-sm">No users found</p></div>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ORGANIZATIONS ── */}
      {tab === 'bloodbank' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-sm text-blue-700">
              <Building className="w-4 h-4" />
              <span>{orgs.length} Organization accounts</span>
            </div>
          </div>
          {loading ? <div className="flex justify-center py-8"><div className="spinner w-6 h-6" /></div> : (
            orgs.length === 0 ? (
              <div className="text-center py-16">
                <Building className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400">No organizations yet</p>
                <p className="text-xs text-gray-300 mt-1">Go to Users tab and promote users to Organization role</p>
                <button onClick={() => setTab('users')} className="mt-3 btn-primary text-sm px-4 py-2">Go to Users</button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {orgs.map(org => (
                  <div key={org._id} className="card p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Building className="w-5 h-5 text-blue-700" /></div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-sm">{org.organizationName || org.name}</p>
                        <p className="text-xs text-gray-400">{org.email}</p>
                      </div>
                      <span className="text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-xl">Organization</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />Location</p>
                        <p className="text-xs font-medium text-gray-700">{org.district}{org.district&&org.state?', ':''}{org.state||'—'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" />Since</p>
                        <p className="text-xs font-medium text-gray-700">{format(new Date(org.createdAt),'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <button onClick={() => toggleBan(org._id, org.isBanned)} className={`mt-3 w-full flex items-center justify-center gap-1 text-xs font-bold py-2 rounded-xl transition-colors ${org.isBanned?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700'}`}>
                      {org.isBanned?<><CheckCircle className="w-3.5 h-3.5"/>Unban Organization</>:<><Ban className="w-3.5 h-3.5"/>Suspend Organization</>}
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* ── DONATIONS ── */}
      {tab === 'donations' && (
        <div className="space-y-3">
          {loading ? <div className="flex justify-center py-8"><div className="spinner w-6 h-6" /></div>
          : donations.length===0 ? <div className="text-center py-12 text-gray-400"><Heart className="w-8 h-8 mx-auto mb-2 opacity-30"/><p className="text-sm">No donations</p></div>
          : donations.map(d => (
            <div key={d._id} className="card p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-blood-400 to-blood-700 flex items-center justify-center text-white font-black text-xs">{(d.requesterId as {name?:string})?.name?.charAt(0)}</div><div><p className="text-xs text-gray-400">Requester</p><p className="font-bold text-gray-800 text-xs">{(d.requesterId as {name?:string})?.name}</p></div></div>
                  <Heart className="w-4 h-4 text-blood-400" />
                  <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-white font-black text-xs">{(d.donorId as {name?:string})?.name?.charAt(0)}</div><div><p className="text-xs text-gray-400">Donor</p><p className="font-bold text-gray-800 text-xs">{(d.donorId as {name?:string})?.name}</p></div></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-blood">{d.bloodType}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${d.status==='completed'?'bg-blue-100 text-blue-700 border-blue-200':d.status==='accepted'?'bg-emerald-100 text-emerald-700 border-emerald-200':d.status==='pending'?'bg-amber-100 text-amber-700 border-amber-200':'bg-red-100 text-red-700 border-red-200'}`}>{d.status}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                <Clock className="w-3 h-3"/>{format(new Date(d.createdAt),'MMM d, yyyy h:mm a')}
                {d.hospital && <><span className="text-gray-300">·</span>{d.hospital}</>}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── REPORTS ── */}
      {tab === 'reports' && (
        <div className="space-y-3">
          {loading ? <div className="flex justify-center py-8"><div className="spinner w-6 h-6"/></div>
          : reports.length===0 ? <div className="text-center py-12 text-gray-400"><Flag className="w-8 h-8 mx-auto mb-2 opacity-30"/><p className="text-sm">No reports — all clear ✓</p></div>
          : reports.map(r => (
            <div key={r._id} className={`card p-4 ${r.reviewed?'opacity-60':'border-red-100'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs text-gray-400">Reported:</span>
                    <span className="font-bold text-gray-800 text-sm">{(r.reportedUserId as {name?:string})?.name}</span>
                    <span className="badge-blood text-xs">{(r.reportedUserId as {bloodType?:string})?.bloodType}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-400">By:</span>
                    <span className="text-sm text-gray-600 font-medium">{(r.reportedBy as {name?:string})?.name}</span>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-2.5">{r.reason}</p>
                  <p className="text-xs text-gray-400 mt-2">{format(new Date(r.createdAt),'MMM d, yyyy h:mm a')}</p>
                </div>
                {!r.reviewed
                  ? <button onClick={() => markReviewed(r._id)} className="flex items-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap"><CheckCircle className="w-3.5 h-3.5"/>Reviewed</button>
                  : <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5"/>Done</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


