import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { DonationRequest } from '../types';
import { Heart, Clock, CheckCircle, XCircle, Trophy, MessageSquare, Loader, Zap, AlertTriangle, Activity, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CFG = {
  pending: { label:'Pending', Icon:Clock, cls:'status-pending' },
  accepted: { label:'Accepted', Icon:CheckCircle, cls:'status-accepted' },
  rejected: { label:'Rejected', Icon:XCircle, cls:'status-rejected' },
  completed: { label:'Completed', Icon:Trophy, cls:'status-completed' },
};
const URGENCY_CFG = {
  normal: { label:'Normal', Icon:Activity, cls:'urgency-normal' },
  urgent: { label:'Urgent', Icon:AlertTriangle, cls:'urgency-urgent' },
  critical: { label:'Critical!', Icon:Zap, cls:'urgency-critical' },
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'received'|'sent'>('received');
  const [updating, setUpdating] = useState<string|null>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const fetch = async () => {
    try { const { data } = await api.get('/requests/my'); setRequests(data.requests); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try { await api.patch(`/requests/${id}/status`, { status }); await fetch(); }
    catch(e) { console.error(e); } finally { setUpdating(null); }
  };

  const received = requests.filter(r => r.donorId?._id === user?._id);
  const sent = requests.filter(r => r.requesterId?._id === user?._id);
  const shown = tab === 'received' ? received : sent;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blood-100 rounded-xl flex items-center justify-center"><Heart className="w-5 h-5 text-blood-700" /></div>
        <div><h1 className="font-display text-2xl font-bold text-gray-800">Blood Requests</h1><p className="text-gray-400 text-sm">Manage your donation requests</p></div>
      </div>

      <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
        {(['received','sent'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${tab===t?'bg-white text-blood-700 shadow-sm':'text-gray-400 hover:text-gray-600'}`}>
            {t==='received'?'📥':'📤'} {t.charAt(0).toUpperCase()+t.slice(1)} <span className="ml-1 text-xs bg-blood-100 text-blood-700 px-1.5 py-0.5 rounded-full">{t==='received'?received.length:sent.length}</span>
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><div className="spinner w-8 h-8" /></div>
      : shown.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-12 h-12 text-blood-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">No {tab} requests</p>
          <p className="text-xs text-gray-400 mt-1">{tab==='sent'?'Go to the map to find donors':'Requests from others appear here'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map(req => {
            const status = STATUS_CFG[req.status];
            const urgency = URGENCY_CFG[req.urgencyLevel||'normal'];
            const isDonor = req.donorId?._id === user?._id;
            const partner = isDonor ? req.requesterId : req.donorId;
            const isUpdating = updating === req._id;

            return (
              <div key={req._id} className={`card p-4 ${req.status==='accepted'?'accepted-glow border-emerald-200':req.status==='completed'?'border-blue-100':''}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blood-400 to-blood-700 flex items-center justify-center text-white font-black shadow-sm">{partner?.name?.charAt(0)}</div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{partner?.name}</p>
                      <div className="flex items-center gap-1.5"><span className="badge-blood">{req.bloodType}</span><span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${urgency.cls}`}><urgency.Icon className="w-3 h-3" />{urgency.label}</span></div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${status.cls}`}><status.Icon className="w-3 h-3" />{status.label}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(req.createdAt),'MMM d')}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl px-3 py-2.5 mb-3 grid grid-cols-2 gap-y-1.5">
                  <div><p className="text-gray-400 text-xs">Hospital</p><p className="font-medium text-gray-700 text-xs truncate">{req.hospital}</p></div>
                  <div><p className="text-gray-400 text-xs">Reason</p><p className="font-medium text-gray-700 text-xs truncate">{req.reason}</p></div>
                  {req.requiredUnits>1&&<div><p className="text-gray-400 text-xs">Units</p><p className="font-medium text-gray-700 text-xs">{req.requiredUnits} units</p></div>}
                  {req.contactNote&&<div className="col-span-2"><p className="text-gray-400 text-xs">Note</p><p className="font-medium text-gray-700 text-xs">{req.contactNote}</p></div>}
                </div>

                {req.status==='accepted'&&req.acceptedAt&&<div className="mb-3 flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-200"><CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> Accepted {format(new Date(req.acceptedAt),'MMM d')} — Chat unlocked!</div>}

                <div className="flex gap-2">
                  {isDonor && req.status==='pending' && <>
                    <button disabled={isUpdating} onClick={() => updateStatus(req._id,'accepted')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5">{isUpdating?<div className="spinner w-3.5 h-3.5" />:<><CheckCircle className="w-3.5 h-3.5" /> Accept</>}</button>
                    <button disabled={isUpdating} onClick={() => updateStatus(req._id,'rejected')} className="flex-1 bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Reject</button>
                  </>}
                  {req.status==='accepted' && <>
                    <button onClick={() => navigate(`/chat/${partner?._id}`)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"><MessageSquare className="w-3.5 h-3.5" /> Open Chat</button>
                    <button disabled={isUpdating} onClick={() => updateStatus(req._id,'completed')} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5">{isUpdating?<div className="spinner w-3.5 h-3.5" />:<><Trophy className="w-3.5 h-3.5" /> Complete</>}</button>
                  </>}
                  {req.status==='completed' && <button onClick={() => navigate(`/chat/${partner?._id}`)} className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Chat History</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
