import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { User, DonorStatus } from '../types';
import { SlidersHorizontal, Navigation, Loader, MapPin, Heart, MessageSquare, CheckCircle, Clock, Zap, X } from 'lucide-react';
import RequestModal from '../components/map/RequestModal';
import FilterPanel from '../components/map/FilterPanel';

const BLOOD_COLORS: Record<string,string> = { 'A+':'#e74c3c','A-':'#c0392b','B+':'#e67e22','B-':'#d35400','AB+':'#9b59b6','AB-':'#8e44ad','O+':'#e91e63','O-':'#c2185b' };

function createDonorIcon(donor: User, selected: boolean) {
  const color = BLOOD_COLORS[donor.bloodType] || '#DC143C';
  const size = selected ? 48 : 38;
  return L.divIcon({
    html: `
      <div style="position:relative; width:${size}px; height:${size + 15}px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
        ${selected ? `<div style="position:absolute; top:0; left:0; width:${size}px; height:${size}px; border-radius:50%; border:3px solid ${color}; animation: ping-slow 2s infinite; pointer-events:none;"></div>` : ''}
        <div style="
          width:${size}px; 
          height:${size}px; 
          border-radius: 50% 50% 50% 0; 
          transform: rotate(-45deg); 
          background: linear-gradient(135deg, ${color}, ${color}dd); 
          border: 2.5px solid white; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 2px 6px ${color}33; 
          display: flex; 
          align-items: center; 
          justify-content: center;
        ">
          <span style="
            transform: rotate(45deg); 
            color: white; 
            font-family: 'DM Sans', sans-serif; 
            font-weight: 800; 
            font-size: ${selected ? '13' : '11'}px;
            white-space: nowrap;
          ">${donor.bloodType}</span>
        </div>
        <div class="shadow-sm" style="
          margin-top: 2px;
          background: #1C1C28;
          color: white;
          font-size: 8px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 5px;
          white-space: nowrap;
          border: 1px solid rgba(255,255,255,0.1);
        ">${donor.name.split(' ')[0]}</div>
      </div>
    `,
    className: 'donor-marker-wrap',
    iconSize: [size, size + 20],
    iconAnchor: [size / 2, size + 15],
    popupAnchor: [0, -(size + 10)]
  });
}

function ActionBtn({ status, onRequest, onChat }: { status: DonorStatus|null; onRequest(): void; onChat(): void; }) {
  if (!status) return <button onClick={onRequest} className="flex items-center gap-1 bg-blood-600 hover:bg-blood-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all hover:-translate-y-0.5"><Heart className="w-3 h-3" /> Request</button>;
  if (status.status === 'pending') return <div className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold py-2 px-3 rounded-lg border border-amber-200"><Clock className="w-3 h-3" /> Pending</div>;
  if (status.status === 'accepted' || status.status === 'completed') return <button onClick={onChat} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all hover:-translate-y-0.5 animate-glow"><MessageSquare className="w-3 h-3" /> Chat</button>;
  return <button onClick={onRequest} className="flex items-center gap-1 bg-blood-600 hover:bg-blood-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all"><Heart className="w-3 h-3" /> Request Again</button>;
}

function MapControls({ onLocate }: { onLocate(lat: number, lng: number): void }) {
  const map = useMap();
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <button onClick={() => { map.locate({ setView:true, maxZoom:14 }); map.once('locationfound', e => onLocate(e.latlng.lat, e.latlng.lng)); }}
        className="w-10 h-10 bg-white shadow-lg rounded-xl flex items-center justify-center hover:bg-blood-50 transition-colors" title="My location">
        <Navigation className="w-4 h-4 text-gray-600" />
      </button>
      <button onClick={() => map.setView([20.5937,78.9629],5)}
        className="w-10 h-10 bg-white shadow-lg rounded-xl flex items-center justify-center hover:bg-blood-50 transition-colors" title="Reset">
        <MapPin className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
}

export default function MapPage() {
  const [donors, setDonors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<User|null>(null);
  const [requestDonor, setRequestDonor] = useState<User|null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, DonorStatus>>({});
  const [filters, setFilters] = useState<Record<string,string>>({});
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const fetchDonors = useCallback(async (extra?: Record<string,string>) => {
    setLoading(true);
    try {
      const { data } = await api.get('/users/donors', { params: { ...filters, ...extra } });
      setDonors(data.donors);
      if (data.donors.length > 0) {
        const ids = data.donors.map((d: User) => d._id);
        const sr = await api.post('/requests/bulk-status', { donorIds: ids });
        setStatuses(sr.data.statusMap || {});
      }
    } catch(e) { console.error(e); } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchDonors(); }, [fetchDonors]);

  const handleLocate = async (lat: number, lng: number) => {
    await api.post('/users/update_location', { lat, lng });
    fetchDonors({ lat: String(lat), lng: String(lng) });
  };

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="h-[calc(100vh-64px)] flex bg-stone-50">
      {/* Sidebar */}
      <div className="hidden lg:flex w-[300px] flex-col bg-white border-r border-gray-100 shadow-sm z-10">
        <div className="px-4 pt-4 pb-3 border-b border-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div><h2 className="font-display text-lg font-bold text-gray-800">Nearby Donors</h2><p className="text-xs text-gray-400 mt-0.5">{donors.length} found</p></div>
            <button onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-semibold transition-all ${activeCount>0?'bg-blood-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <SlidersHorizontal className="w-3.5 h-3.5" />Filters{activeCount>0&&<span className="w-4 h-4 bg-white text-blood-600 rounded-full text-xs flex items-center justify-center font-black">{activeCount}</span>}
            </button>
          </div>
          <div className="flex gap-1 flex-wrap">
            {['','A+','B+','O+','AB+'].map(bt => (
              <button key={bt} onClick={() => setFilters(p => ({ ...p, bloodType: bt }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${(filters.bloodType||''===bt)?'bg-blood-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {bt||'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? Array(4).fill(0).map((_,i) => <div key={i} className="rounded-2xl p-4 space-y-2"><div className="flex gap-3 items-center"><div className="w-11 h-11 rounded-full skeleton" /><div className="flex-1 space-y-1.5"><div className="h-3.5 skeleton w-3/4" /><div className="h-3 skeleton w-1/2" /></div></div></div>)
          : donors.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center"><MapPin className="w-8 h-8 text-blood-300 mb-2" /><p className="font-semibold text-gray-500 text-sm">No donors found</p><p className="text-xs text-gray-400 mt-1">Try adjusting filters</p></div>
          : donors.map(donor => {
            const st = statuses[donor._id] || null;
            const isSelected = selected?._id === donor._id;
            return (
              <div key={donor._id} onClick={() => setSelected(isSelected ? null : donor)}
                className={`rounded-2xl p-3 cursor-pointer transition-all duration-200 border ${isSelected?'bg-blood-50 border-blood-200 shadow-md':'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'}${st?.status==='accepted'?' accepted-glow':''}`}>
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blood-400 to-blood-700 flex items-center justify-center text-white font-black">{donor.name.charAt(0)}</div>
                    {donor.emergencyAvailable && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"><Zap className="w-2.5 h-2.5 text-white" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5"><p className="font-bold text-gray-800 text-sm truncate">{donor.name}</p>{donor.badges>0&&<span className="text-xs bg-amber-100 text-amber-600 px-1.5 rounded-full font-bold">×{donor.badges}</span>}</div>
                    <div className="flex items-center gap-1.5 mt-0.5"><span className="badge-blood">{donor.bloodType}</span>{donor.state&&<span className="text-xs text-gray-400 truncate">{donor.state}</span>}</div>
                    {st && <div className={`inline-flex items-center gap-1 mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${st.status==='accepted'?'bg-emerald-100 text-emerald-600':st.status==='pending'?'bg-amber-100 text-amber-600':'bg-blue-100 text-blue-600'}`}>{st.status==='accepted'&&<CheckCircle className="w-3 h-3" />}{st.status.charAt(0).toUpperCase()+st.status.slice(1)}</div>}
                  </div>
                </div>
                {isSelected && <div className="mt-3 grid grid-cols-2 gap-2 animate-fade-in">
                  <ActionBtn status={st} onRequest={() => setRequestDonor(donor)} onChat={() => navigate(`/chat/${donor._id}`)} />
                  <button onClick={e => { e.stopPropagation(); navigate(`/profile/${donor._id}`); }} className="text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg transition-colors">Profile</button>
                </div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {loading && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] glass shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-sm text-gray-600"><Loader className="w-4 h-4 animate-spin text-blood-600" /> Loading donors...</div>}
        <MapContainer center={[20.5937,78.9629]} zoom={5} style={{ height:'100%', width:'100%' }} zoomControl={true}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <MapControls onLocate={handleLocate} />
          {donors.map(donor => {
            const [lng, lat] = donor.location?.coordinates || [0,0];
            if (!lat && !lng) return null;
            const isSel = selected?._id === donor._id;
            const st = statuses[donor._id] || null;
            return (
              <Marker key={donor._id} position={[lat,lng]} icon={createDonorIcon(donor,isSel)} eventHandlers={{ click: () => setSelected(donor) }} zIndexOffset={isSel?1000:0}>
                <Popup>
                  <div className="p-4 w-[230px]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blood-400 to-blood-700 flex items-center justify-center text-white font-black text-lg">{donor.name.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{donor.name}</p>
                        <div className="flex items-center gap-1.5"><span className="badge-blood">{donor.bloodType}</span>{donor.emergencyAvailable&&<Zap className="w-3.5 h-3.5 text-red-500" />}</div>
                        {donor.state&&<p className="text-xs text-gray-400 mt-0.5">{donor.district?`${donor.district}, `:''}{donor.state}</p>}
                      </div>
                    </div>
                    {donor.publicNote&&<p className="text-xs text-gray-500 italic bg-gray-50 rounded-lg px-2.5 py-1.5 mb-3">"{donor.publicNote}"</p>}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <ActionBtn status={st} onRequest={() => setRequestDonor(donor)} onChat={() => navigate(`/chat/${donor._id}`)} />
                        <button onClick={() => navigate(`/profile/${donor._id}`)} className="flex-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg">Profile</button>
                      </div>
                      {st?.status==='accepted'&&<div className="text-xs text-emerald-600 font-semibold text-center bg-emerald-50 rounded-lg py-1 border border-emerald-200">✓ Accepted — Chat Unlocked</div>}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Mobile bottom sheet */}
      {selected && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-[900] px-3">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blood-400 to-blood-700 flex items-center justify-center text-white font-black text-lg">{selected.name.charAt(0)}</div>
                <div><p className="font-bold text-gray-800">{selected.name}</p><span className="badge-blood">{selected.bloodType}</span></div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="flex gap-2">
              <ActionBtn status={statuses[selected._id]||null} onRequest={() => setRequestDonor(selected)} onChat={() => navigate(`/chat/${selected._id}`)} />
              <button onClick={() => navigate(`/profile/${selected._id}`)} className="flex-1 btn-secondary text-xs py-2">View Profile</button>
            </div>
          </div>
        </div>
      )}

      {showFilter && <FilterPanel filters={filters} onApply={f => { setFilters(f); setShowFilter(false); }} onClose={() => setShowFilter(false)} />}
      {requestDonor && <RequestModal donor={requestDonor} onClose={() => setRequestDonor(null)} onSuccess={() => { setRequestDonor(null); fetchDonors(); navigate('/requests'); }} />}
    </div>
  );
}
