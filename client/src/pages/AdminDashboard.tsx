import { useState, useEffect } from 'react';
import api from '../utils/api';
import { AdminStats, User, DonationRequest, Report } from '../types';
import { Users, Heart, Activity, AlertTriangle, Ban, CheckCircle, LayoutDashboard, Flag, Shield, Trophy, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

type Tab = 'overview'|'users'|'donations'|'reports';

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<AdminStats|null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [donations, setDonations] = useState<DonationRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { if(tab==='users') fetchUsers(); else if(tab==='donations') fetchDonations(); else if(tab==='reports') fetchReports(); }, [tab, search]);

  const fetchStats = async () => { try { const { data } = await api.get('/admin/stats'); setStats(data.stats); } catch(e){console.error(e);} finally{setLoading(false);} };
  const fetchUsers = async () => { setLoading(true); try { const { data } = await api.get('/admin/users', { params: { search } }); setUsers(data.users); } catch(e){console.error(e);} finally{setLoading(false);} };
  const fetchDonations = async () => { setLoading(true); try { const { data } = await api.get('/admin/donations'); setDonations(data.donations); } catch(e){console.error(e);} finally{setLoading(false);} };
  const fetchReports = async () => { setLoading(true); try { const { data } = await api.get('/admin/reports'); setReports(data.reports); } catch(e){console.error(e);} finally{setLoading(false);} };
  const toggleBan = async (id: string, banned: boolean) => { try { await api.patch(`/admin/users/${id}/ban`, { banned: !banned }); fetchUsers(); fetchStats(); } catch(e){console.error(e);} };
  const markReviewed = async (id: string) => { try { await api.patch(`/admin/reports/${id}/review`); fetchReports(); } catch(e){console.error(e);} };

  const TABS = [{ id:'overview' as Tab, icon:LayoutDashboard, label:'Overview' },{ id:'users' as Tab, icon:Users, label:'Users' },{ id:'donations' as Tab, icon:Heart, label:'Donations' },{ id:'reports' as Tab, icon:Flag, label:'Reports' }];
  const colorMap: Record<string,string> = { blue:'bg-blue-100 text-blue-600', emerald:'bg-emerald-100 text-emerald-600', amber:'bg-amber-100 text-amber-600', orange:'bg-orange-100 text-orange-600', teal:'bg-teal-100 text-teal-600', blood:'bg-blood-100 text-blood-600', red:'bg-red-100 text-red-600', purple:'bg-purple-100 text-purple-600' };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 page-enter">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blood-100 rounded-xl flex items-center justify-center"><Shield className="w-5 h-5 text-blood-700" /></div>
        <div><h1 className="font-display text-2xl font-bold text-gray-800">Admin Dashboard</h1><p className="text-gray-400 text-sm">LifeFlow Network Control Panel</p></div>
      </div>

      <div className="flex overflow-x-auto gap-1 bg-gray-100 p-1 rounded-2xl mb-6 w-fit">
        {TABS.map(({ id, icon:Icon, label }) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 py-2 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${tab===id?'bg-white text-blood-700 shadow-sm':'text-gray-400 hover:text-gray-600'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { icon:Users, label:'Total Users', value:stats.totalUsers, color:'blue', sub:'Registered' },
              { icon:Activity, label:'Active Donors', value:stats.activeDonors, color:'emerald', sub:'Eligible & visible' },
              { icon:Ban, label:'Ineligible', value:stats.ineligibleUsers||0, color:'amber', sub:'Not eligible' },
              { icon:Heart, label:'Pending', value:stats.pendingRequests, color:'orange', sub:'Awaiting' },
              { icon:CheckCircle, label:'Accepted', value:stats.acceptedRequests||0, color:'teal', sub:'Active' },
              { icon:Trophy, label:'Completed', value:stats.totalDonations, color:'blood', sub:'Successful' },
              { icon:AlertTriangle, label:'Reports', value:stats.totalReports, color:'red', sub:'Pending review' },
              { icon:MessageSquare, label:'Community', value:stats.communityMessages||0, color:'purple', sub:'Messages' },
            ].map(({ icon:Icon, label, value, color, sub }) => (
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
              <h3 className="font-bold text-gray-700 mb-4 text-sm">Donor Health</h3>
              {[
                { label:'Eligible Rate', val:stats.totalUsers>0?(stats.activeDonors/stats.totalUsers)*100:0, color:'bg-emerald-500' },
                { label:'Completion Rate', val:(stats.totalDonations+stats.pendingRequests)>0?(stats.totalDonations/(stats.totalDonations+stats.pendingRequests))*100:0, color:'bg-blood-500' },
              ].map(({ label, val, color }) => (
                <div key={label} className="mb-4">
                  <div className="flex justify-between text-sm mb-1.5"><span className="text-gray-600 font-medium">{label}</span><span className="font-black text-gray-800">{Math.round(val)}%</span></div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width:`${val}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="card p-5">
              <h3 className="font-bold text-gray-700 mb-4 text-sm">Quick Actions</h3>
              {[{ icon:Users, label:'Manage Users', t:'users' as Tab },{ icon:Heart, label:'View Donations', t:'donations' as Tab },{ icon:Flag, label:`Review Reports (${stats.totalReports})`, t:'reports' as Tab }].map(({ icon:Icon, label, t }) => (
                <button key={label} onClick={() => setTab(t)} className="w-full flex items-center gap-3 p-3 hover:bg-blood-50 rounded-xl transition-colors text-left group mb-2">
                  <div className="w-8 h-8 bg-blood-50 group-hover:bg-blood-100 rounded-lg flex items-center justify-center transition-colors"><Icon className="w-4 h-4 text-blood-600" /></div>
                  <span className="font-semibold text-gray-700 text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'users' && (
        <div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="input-field max-w-xs mb-4" />
          {loading ? <div className="flex justify-center py-8"><div className="spinner w-6 h-6" /></div> : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>{['User','Blood','State','Status','Badges','Joined','Action'].map(h=><th key={h} className="text-left py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-wider">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(u => (
                      <tr key={u._id} className="hover:bg-gray-50/80">
                        <td className="py-3 px-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-blood-400 to-blood-700 flex items-center justify-center text-white font-black text-xs">{u.name.charAt(0)}</div><div><p className="font-bold text-gray-800 text-xs">{u.name}</p><p className="text-xs text-gray-400 truncate max-w-[120px]">{u.email}</p></div></div></td>
                        <td className="py-3 px-4"><span className="badge-blood">{u.bloodType}</span></td>
                        <td className="py-3 px-4 text-gray-500 text-xs">{u.state||'—'}</td>
                        <td className="py-3 px-4"><span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${u.isBanned?'bg-red-100 text-red-700 border-red-200':u.eligible?'bg-emerald-100 text-emerald-700 border-emerald-200':'bg-gray-100 text-gray-500 border-gray-200'}`}>{u.isBanned?'Banned':u.eligible?'Eligible':'Ineligible'}</span></td>
                        <td className="py-3 px-4 font-black text-amber-600">{u.badges}</td>
                        <td className="py-3 px-4 text-gray-400 text-xs">{format(new Date(u.createdAt),'MMM d, yy')}</td>
                        <td className="py-3 px-4"><button onClick={() => toggleBan(u._id, u.isBanned)} className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors ${u.isBanned?'bg-emerald-100 text-emerald-700 hover:bg-emerald-200':'bg-red-100 text-red-700 hover:bg-red-200'}`}>{u.isBanned?<><CheckCircle className="w-3 h-3" /> Unban</>:<><Ban className="w-3 h-3" /> Ban</>}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length===0&&<div className="text-center py-12 text-gray-400"><Users className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No users found</p></div>}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'donations' && (
        <div className="space-y-3">
          {loading ? <div className="flex justify-center py-8"><div className="spinner w-6 h-6" /></div>
          : donations.length===0 ? <div className="text-center py-12 text-gray-400"><Heart className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No donations</p></div>
          : donations.map(d => (
            <div key={d._id} className="card p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div><p className="text-xs text-gray-400">Requester</p><p className="font-bold text-gray-800 text-sm">{(d.requesterId as any)?.name}</p></div>
                  <Heart className="w-4 h-4 text-blood-400" />
                  <div><p className="text-xs text-gray-400">Donor</p><p className="font-bold text-gray-800 text-sm">{(d.donorId as any)?.name}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-blood">{d.bloodType}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${d.status==='completed'?'bg-blue-100 text-blue-700 border-blue-200':d.status==='accepted'?'bg-emerald-100 text-emerald-700 border-emerald-200':d.status==='pending'?'bg-amber-100 text-amber-700 border-amber-200':'bg-red-100 text-red-700 border-red-200'}`}>{d.status}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{d.hospital} · {d.reason} · {format(new Date(d.createdAt),'MMM d, yyyy')}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-3">
          {loading ? <div className="flex justify-center py-8"><div className="spinner w-6 h-6" /></div>
          : reports.length===0 ? <div className="text-center py-12 text-gray-400"><Flag className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No reports</p></div>
          : reports.map(r => (
            <div key={r._id} className={`card p-4 ${r.reviewed?'opacity-60':'border-red-100'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap"><span className="text-xs text-gray-400">Reported:</span><span className="font-bold text-gray-800 text-sm">{(r.reportedUserId as any)?.name}</span><span className="badge-blood text-xs">{(r.reportedUserId as any)?.bloodType}</span></div>
                  <div className="flex items-center gap-2 mb-2"><span className="text-xs text-gray-400">By:</span><span className="text-sm text-gray-600 font-medium">{(r.reportedBy as any)?.name}</span></div>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-2.5">{r.reason}</p>
                  <p className="text-xs text-gray-400 mt-2">{format(new Date(r.createdAt),'MMM d, yyyy h:mm a')}</p>
                </div>
                {!r.reviewed ? <button onClick={() => markReviewed(r._id)} className="flex items-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap"><CheckCircle className="w-3.5 h-3.5" /> Reviewed</button>
                : <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Done</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
