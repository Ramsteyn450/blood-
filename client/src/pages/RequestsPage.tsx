import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { DonationRequest } from '../types';
import { Heart, Clock, CheckCircle, XCircle, Trophy, MessageSquare, Loader, Zap, AlertTriangle, Activity, Calendar, MapPin, Navigation, X, Share2 } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CFG = {
  pending:   { label:'Pending',   Icon:Clock,        cls:'status-pending' },
  accepted:  { label:'Accepted',  Icon:CheckCircle,  cls:'status-accepted' },
  rejected:  { label:'Rejected',  Icon:XCircle,      cls:'status-rejected' },
  completed: { label:'Completed', Icon:Trophy,       cls:'status-completed' },
};
const URGENCY_CFG = {
  normal:   { label:'Normal',   Icon:Activity,       cls:'urgency-normal' },
  urgent:   { label:'Urgent',   Icon:AlertTriangle,  cls:'urgency-urgent' },
  critical: { label:'Critical!', Icon:Zap,           cls:'urgency-critical' },
};

// ── Live Location Modal ──────────────────────────────────────────────────────
function LiveLocationModal({ request, onClose }: { request: DonationRequest; onClose(): void }) {
  const { user } = useAuthStore();
  const [sharing, setSharing] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState('');
  const watchRef = useRef<number | null>(null);
  const partner = request.donorId?._id === user?._id ? request.requesterId : request.donorId;

  const startSharing = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setSharing(true);
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        // Send live location via API
        try {
          await api.post('/users/update_location', { lat: latitude, lng: longitude });
        } catch { /* silent */ }
      },
      (err) => { setError(err.message); setSharing(false); },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  };

  const stopSharing = () => {
    if (watchRef.current !== null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
    setSharing(false);
  };

  useEffect(() => () => { if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current!); }, []);

  const googleMapsLink = position ? `https://maps.google.com/?q=${position.lat},${position.lng}` : '';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9500] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 pt-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Navigation className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-white">Live Location</h2>
              <p className="text-emerald-100 text-xs">Share your real-time location</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl"><X className="w-5 h-5 text-white" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blood-400 to-blood-700 rounded-full flex items-center justify-center text-white font-black">
              {(partner as {name?:string})?.name?.charAt(0)}
            </div>
            <div>
              <p className="text-xs text-gray-400">Sharing with</p>
              <p className="font-bold text-gray-800">{(partner as {name?:string})?.name}</p>
            </div>
            {sharing && <div className="ml-auto flex items-center gap-1.5 text-emerald-600 text-xs font-bold"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />LIVE</div>}
          </div>

          {position && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <p className="text-xs text-emerald-600 font-bold mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Your current location</p>
              <p className="text-xs text-emerald-700 font-mono">{position.lat.toFixed(6)}, {position.lng.toFixed(6)}</p>
              <a href={googleMapsLink} target="_blank" rel="noreferrer"
                className="mt-2 flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-xl transition-colors w-full justify-center">
                <Share2 className="w-3.5 h-3.5" /> Open in Google Maps
              </a>
            </div>
          )}

          {error && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

          <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
            ⚠️ Your live location is shared only with <strong>{(partner as {name?:string})?.name}</strong> who accepted your blood request. Stop sharing anytime by clicking below.
          </div>

          {!sharing ? (
            <button onClick={startSharing} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl transition-all">
              <Navigation className="w-4 h-4" /> Start Sharing Location
            </button>
          ) : (
            <button onClick={stopSharing} className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-2xl transition-all">
              <X className="w-4 h-4" /> Stop Sharing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function RequestsPage() {
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'received'|'sent'>('received');
  const [updating, setUpdating] = useState<string|null>(null);
  const [locationRequest, setLocationRequest] = useState<DonationRequest|null>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const fetchReqs = async () => {
    try { const { data } = await api.get('/requests/my'); setRequests(data.requests); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchReqs(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try { await api.patch(`/requests/${id}/status`, { status }); await fetchReqs(); }
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
            {t==='received'?'📥':'📤'} {t.charAt(0).toUpperCase()+t.slice(1)}{' '}
            <span className="ml-1 text-xs bg-blood-100 text-blood-700 px-1.5 py-0.5 rounded-full">{t==='received'?received.length:sent.length}</span>
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
                      <div className="flex items-center gap-1.5">
                        <span className="badge-blood">{req.bloodType}</span>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${urgency.cls}`}><urgency.Icon className="w-3 h-3"/>{urgency.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${status.cls}`}><status.Icon className="w-3 h-3"/>{status.label}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3"/>{format(new Date(req.createdAt),'MMM d')}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl px-3 py-2.5 mb-3 grid grid-cols-2 gap-y-1.5">
                  <div><p className="text-gray-400 text-xs">Hospital</p><p className="font-medium text-gray-700 text-xs truncate">{req.hospital}</p></div>
                  <div><p className="text-gray-400 text-xs">Reason</p><p className="font-medium text-gray-700 text-xs truncate">{req.reason}</p></div>
                  {req.requiredUnits>1&&<div><p className="text-gray-400 text-xs">Units</p><p className="font-medium text-gray-700 text-xs">{req.requiredUnits} units</p></div>}
                  {req.contactNote&&<div className="col-span-2"><p className="text-gray-400 text-xs">Note</p><p className="font-medium text-gray-700 text-xs">{req.contactNote}</p></div>}
                </div>

                {req.status==='accepted'&&req.acceptedAt&&(
                  <div className="mb-3 flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0"/>Accepted {format(new Date(req.acceptedAt),'MMM d')} — Chat unlocked!
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {isDonor && req.status==='pending' && <>
                    <button disabled={isUpdating} onClick={()=>updateStatus(req._id,'accepted')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5">{isUpdating?<div className="spinner w-3.5 h-3.5"/>:<><CheckCircle className="w-3.5 h-3.5"/>Accept</>}</button>
                    <button disabled={isUpdating} onClick={()=>updateStatus(req._id,'rejected')} className="flex-1 bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"><XCircle className="w-3.5 h-3.5"/>Reject</button>
                  </>}
                  {req.status==='accepted' && <>
                    <button onClick={()=>navigate(`/chat/${partner?._id}`)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"><MessageSquare className="w-3.5 h-3.5"/>Open Chat</button>
                    {/* 🔴 LIVE LOCATION BUTTON — only shown when accepted */}
                    <button onClick={()=>setLocationRequest(req)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5"/>Share Location
                    </button>
                    <button disabled={isUpdating} onClick={()=>updateStatus(req._id,'completed')} className="w-full bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 border border-blue-200 text-xs font-bold py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 mt-0.5">{isUpdating?<div className="spinner w-3.5 h-3.5"/>:<><Loader className="w-3.5 h-3.5"/>Mark Complete</>}</button>
                  </>}
                  {req.status==='completed'&&<button onClick={()=>navigate(`/chat/${partner?._id}`)} className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"><MessageSquare className="w-3.5 h-3.5"/>Chat History</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {locationRequest && <LiveLocationModal request={locationRequest} onClose={() => setLocationRequest(null)} />}
    </div>
  );
}
