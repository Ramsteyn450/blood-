import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { User, DonorStatus } from '../types';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, Navigation, Loader, MapPin, Heart, MessageSquare, CheckCircle, Clock, Zap, X, Search, Siren, Tent, Users, Building, Shield } from 'lucide-react';
import RequestModal from '../components/map/RequestModal';
import FilterPanel from '../components/map/FilterPanel';
import EmergencyAlertModal from '../components/map/EmergencyAlertModal';
import { format } from 'date-fns';

interface Camp {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  place: string;
  hospital: string;
  doctors: string;
  campType: string;
  poster: string;
  locationName: string;
  location: { coordinates: [number, number] };
  organizerId: { name: string; organizationName: string };
  rsvps: string[];
}

const BLOOD_COLORS: Record<string,string> = { 'A+':'#e74c3c','A-':'#c0392b','B+':'#e67e22','B-':'#d35400','AB+':'#9b59b6','AB-':'#8e44ad','O+':'#e91e63','O-':'#c2185b' };
const AVAIL_COLOR: Record<string,string> = { available:'#10b981', busy:'#f59e0b', offline:'#9ca3af' };

const TAMIL_NADU_CITIES = [
  { name: 'Tiruchirappalli (Trichy)', lat: 10.7905, lng: 78.7047 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9616 },
  { name: 'Madurai', lat: 9.9252, lng: 78.1198 },
  { name: 'Salem', lat: 11.6643, lng: 78.1460 }
];

const DISTANCE_OPTIONS = [
  { label: '2 KM', value: 2000 },
  { label: '3 KM', value: 3000 },
  { label: '5 KM', value: 5000 },
  { label: '10 KM', value: 10000 },
  { label: '20 KM', value: 20000 },
  { label: 'All', value: 0 },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function createDonorIcon(donor: User, selected: boolean) {
  const color = BLOOD_COLORS[donor.bloodType] || '#DC143C';
  const availColor = AVAIL_COLOR[(donor as unknown as {availabilityStatus:string}).availabilityStatus || 'available'];
  const size = selected ? 48 : 38;
  return L.divIcon({
    html: `
      <div style="position:relative; width:${size}px; height:${size + 20}px; display:flex; flex-direction:column; align-items:center;">
        ${selected ? `<div style="position:absolute; top:0; left:0; width:${size}px; height:${size}px; border-radius:50%; border:3px solid ${color}; animation: ping-slow 2s infinite; pointer-events:none;"></div>` : ''}
        <div style="width:${size}px; height:${size}px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: linear-gradient(135deg, ${color}, ${color}dd); border: 2.5px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display:flex; align-items:center; justify-content:center;">
          <span style="transform:rotate(45deg); color:white; font-family:'DM Sans',sans-serif; font-weight:800; font-size:${selected?'13':'11'}px; white-space:nowrap;">${donor.bloodType}</span>
        </div>
        <div style="position:absolute; top:-3px; right:-3px; width:10px; height:10px; border-radius:50%; background:${availColor}; border:2px solid white;"></div>
        <div style="margin-top:2px; background:#1C1C28; color:white; font-size:8px; font-weight:700; padding:1px 5px; border-radius:5px; white-space:nowrap; border:1px solid rgba(255,255,255,0.1);">${donor.name.split(' ')[0]}</div>
      </div>
    `,
    className: 'donor-marker-wrap',
    iconSize: [size, size + 22],
    iconAnchor: [size / 2, size + 16],
    popupAnchor: [0, -(size + 10)]
  });
}

function createHospitalIcon(org: User, selected: boolean) {
  const size = selected ? 48 : 38;
  const avatarUrl = org.avatar || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=150';
  return L.divIcon({
    html: `
      <div style="position:relative; width:${size}px; height:${size + 20}px; display:flex; flex-direction:column; align-items:center;">
        <div style="
          width:${size}px; 
          height:${size}px; 
          border-radius: 50%; 
          border: 3px solid #1e3a8a; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.2); 
          overflow: hidden; 
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <img src="${avatarUrl}" style="width:100%; height:100%; object-cover: cover;" />
        </div>
        <div style="position:absolute; top:-2px; right:-2px; width:12px; height:12px; border-radius:50%; background:#10b981; border:2.5px solid white;"></div>
        <div style="margin-top:3px; background:#1e3a8a; color:white; font-size:7px; font-weight:800; padding:1px 5px; border-radius:4px; white-space:nowrap;">HOSPITAL</div>
      </div>
    `,
    className: 'hospital-marker-wrap',
    iconSize: [size, size + 20],
    iconAnchor: [size / 2, size + 20],
    popupAnchor: [0, -size]
  });
}

function createCampIcon() {
  return L.divIcon({
    html: `
      <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:#dc143c; border-radius:10px; border:2px solid white; box-shadow:0 4px 12px rgba(0,0,0,0.25);">
        <span style="font-size:18px; line-height:1;">⛺</span>
      </div>
    `,
    className: 'camp-marker-wrap',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
}

function ActionBtn({ status, onRequest, onChat }: { status: DonorStatus|null; onRequest(): void; onChat(): void }) {
  if (!status) return <button onClick={onRequest} className="flex items-center gap-1 bg-blood-600 hover:bg-blood-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all hover:-translate-y-0.5"><Heart className="w-3 h-3" /> Request</button>;
  if (status.status === 'pending') return <div className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold py-2 px-3 rounded-lg border border-amber-200"><Clock className="w-3 h-3" /> Pending</div>;
  if (status.status === 'accepted' || status.status === 'completed') return <button onClick={onChat} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all hover:-translate-y-0.5 animate-glow"><MessageSquare className="w-3 h-3" /> Chat</button>;
  return <button onClick={onRequest} className="flex items-center gap-1 bg-blood-600 hover:bg-blood-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all"><Heart className="w-3 h-3" /> Request Again</button>;
}

// Map manual fly-to helper
function MapViewCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);
  return null;
}

function MapControls({ onLocate }: { onLocate(lat: number, lng: number): void }) {
  const map = useMap();
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <button onClick={() => { map.locate({ setView: true, maxZoom: 14 }); map.once('locationfound', e => onLocate(e.latlng.lat, e.latlng.lng)); }}
        className="w-10 h-10 bg-white shadow-lg rounded-xl flex items-center justify-center hover:bg-blood-50 transition-colors" title="My location">
        <Navigation className="w-4 h-4 text-gray-600" />
      </button>
      <button onClick={() => map.setView([10.7905, 78.7047], 8)}
        className="w-10 h-10 bg-white shadow-lg rounded-xl flex items-center justify-center hover:bg-blood-50 transition-colors" title="Reset to Tamil Nadu">
        <MapPin className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
}

export default function MapPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonor, setSelectedDonor] = useState<User | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<User | null>(null);
  const [requestDonor, setRequestDonor] = useState<User | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, DonorStatus>>({});
  const [filters, setFilters] = useState<Record<string,string>>({});
  const [searchText, setSearchText] = useState('');
  const [selectedDistance, setSelectedDistance] = useState(0); // 0 = All
  const [mapCenter, setMapCenter] = useState<[number, number]>([10.7905, 78.7047]); // Default Trichy
  const [userLat, setUserLat] = useState<number | undefined>();
  const [userLng, setUserLng] = useState<number | undefined>();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const fetchCamps = async () => {
    try {
      const { data } = await api.get('/camps');
      setCamps(data.camps || []);
    } catch { /* silent */ }
  };

  const fetchUsers = useCallback(async (extra?: Record<string,string>) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { ...filters, ...extra };
      if (searchText) params.name = searchText;
      if (selectedDistance > 0 && userLat && userLng) {
        params.lat = String(userLat);
        params.lng = String(userLng);
        params.maxDistance = String(selectedDistance);
      }
      const { data } = await api.get('/users/donors', { params });
      let result = data.donors as User[];

      // Client-side distance sorting/filtering
      if (userLat && userLng && selectedDistance > 0) {
        result = result
          .map(d => {
            const [lng, lat] = d.location?.coordinates || [0, 0];
            return { ...d, _distKm: haversineKm(userLat, userLng, lat, lng) };
          })
          .filter(d => (d as unknown as {_distKm:number})._distKm <= selectedDistance / 1000)
          .sort((a, b) => (a as unknown as {_distKm:number})._distKm - (b as unknown as {_distKm:number})._distKm) as User[];
      }

      setUsers(result);
      // Fetch statuses only for donors
      const donorIds = result.filter(u => u.role === 'user').map(d => d._id);
      if (donorIds.length > 0) {
        const sr = await api.post('/requests/bulk-status', { donorIds });
        setStatuses(sr.data.statusMap || {});
      }
    } catch(e) { console.error(e); } finally { setLoading(false); }
  }, [filters, searchText, selectedDistance, userLat, userLng]);

  useEffect(() => { fetchUsers(); fetchCamps(); }, [fetchUsers]);

  const handleLocate = async (lat: number, lng: number) => {
    setUserLat(lat);
    setUserLng(lng);
    setMapCenter([lat, lng]);
    await api.post('/users/update_location', { lat, lng });
    fetchUsers({ lat: String(lat), lng: String(lng) });
  };

  const triggerBrowserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { handleLocate(pos.coords.latitude, pos.coords.longitude); },
        () => {
          // Geolocation failed/blocked, alert user to pick manual city fallback
          alert('GPS location permission denied or unavailable. Please choose your city manually from the dropdown.');
        }
      );
    }
  };

  const handleDistanceSelect = (dist: number) => {
    setSelectedDistance(dist);
    if (dist > 0 && !userLat) {
      triggerBrowserLocation();
    }
  };

  const getDistKm = (target: User): number | null => {
    if (!userLat || !userLng) return null;
    const [lng, lat] = target.location?.coordinates || [0, 0];
    if (!lat && !lng) return null;
    return haversineKm(userLat, userLng, lat, lng);
  };

  // Split donors and organizations
  const donorsList = users.filter(u => u.role === 'user');
  const orgsList = users.filter(u => u.role === 'organization');

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="h-[calc(100vh-64px)] flex bg-stone-50">
      {/* Sidebar */}
      <div className="hidden lg:flex w-[320px] flex-col bg-white border-r border-gray-100 shadow-sm z-10">
        <div className="px-4 pt-4 pb-3 border-b border-gray-50 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-gray-800">Tamil Nadu Networks</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">{donorsList.length} Donors · {orgsList.length} Hospitals</p>
            </div>
            <button onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl font-semibold transition-all ${activeCount>0?'bg-blood-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <SlidersHorizontal className="w-3.5 h-3.5" />Filters
            </button>
          </div>

          {/* Manual Location Dropdown (Tamil Nadu Cities) */}
          <div className="bg-red-50/40 border border-red-100 rounded-xl p-2.5 space-y-2">
            <p className="text-[10px] font-bold text-blood-700 uppercase tracking-wider">📍 Focus Location / City</p>
            <select
              onChange={e => {
                const city = TAMIL_NADU_CITIES.find(c => c.name === e.target.value);
                if (city) handleLocate(city.lat, city.lng);
              }}
              className="w-full text-xs bg-white border border-gray-200 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-blood-400"
            >
              <option value="">Select Tamil Nadu City...</option>
              {TAMIL_NADU_CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          {/* Smart Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Search donor or hospital..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blood-200 focus:border-blood-400"
            />
          </div>

          {/* Distance Filter */}
          <div>
            <p className="text-xs font-bold text-gray-400 mb-1.5">{t('map.distanceFilter')}</p>
            <div className="flex flex-wrap gap-1">
              {DISTANCE_OPTIONS.map(opt => (
                <button key={opt.label} onClick={() => handleDistanceSelect(opt.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${selectedDistance===opt.value?'bg-blood-600 text-white shadow':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Blood Quick Filters */}
          <div className="flex gap-1 flex-wrap">
            {['','A+','B+','O+','AB+','O-'].map(bt => (
              <button key={bt} onClick={() => setFilters(p => ({ ...p, bloodType: bt }))}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${(filters.bloodType||''===bt)?'bg-blood-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {bt||'All'}
              </button>
            ))}
          </div>

          {/* Emergency Button */}
          <button
            onClick={() => setShowEmergency(true)}
            className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            <Siren className="w-3.5 h-3.5 animate-pulse" />{t('map.emergency')}
          </button>
        </div>

        {/* Sidebar Scroll list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Hospitals Group */}
          {orgsList.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest flex items-center gap-1"><Building className="w-3 h-3" /> Hospitals & Blood Banks</p>
              {orgsList.map(org => {
                const dist = getDistKm(org);
                return (
                  <div key={org._id} onClick={() => { setSelectedHospital(org); setMapCenter([org.location.coordinates[1], org.location.coordinates[0]]); }}
                    className={`rounded-2xl p-3 cursor-pointer border bg-blue-50/10 border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all`}>
                    <div className="flex items-center gap-2.5">
                      <img src={org.avatar || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=100'} className="w-9 h-9 rounded-full object-cover border border-blue-200" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-800 text-xs truncate">{org.organizationName || org.name}</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" /> {org.district || org.state}
                          {dist !== null && <span className="text-blue-600 font-bold ml-1">{dist.toFixed(1)} KM</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Donors Group */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-blood-700 uppercase tracking-widest flex items-center gap-1"><Heart className="w-3 h-3" /> Active Donors</p>
            {loading ? Array(3).fill(0).map((_,i) => <div key={i} className="h-16 skeleton rounded-2xl" />)
            : donorsList.length === 0 ? <div className="text-center py-8 text-xs text-gray-400">No active donors found.</div>
            : donorsList.map(donor => {
              const st = statuses[donor._id] || null;
              const isSelected = selectedDonor?._id === donor._id;
              const dist = getDistKm(donor);
              return (
                <div key={donor._id} onClick={() => { setSelectedDonor(isSelected ? null : donor); if (donor.location?.coordinates) setMapCenter([donor.location.coordinates[1], donor.location.coordinates[0]]); }}
                  className={`rounded-2xl p-3 cursor-pointer border ${isSelected?'bg-blood-50 border-blood-200 shadow-md':'bg-white border-gray-100 hover:border-gray-200'}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blood-400 to-blood-700 flex items-center justify-center text-white font-black text-xs flex-shrink-0">{donor.name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-xs truncate">{donor.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="badge-blood text-[9px] px-1.5">{donor.bloodType}</span>
                        {dist !== null && <span className="text-[10px] text-blood-600 font-bold">{dist.toFixed(1)} KM</span>}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="mt-3 grid grid-cols-2 gap-1 animate-fade-in">
                      <ActionBtn status={st} onRequest={() => setRequestDonor(donor)} onChat={() => navigate(`/chat/${donor._id}`)} />
                      <button onClick={e => { e.stopPropagation(); navigate(`/profile/${donor._id}`); }} className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition-colors">Profile</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {loading && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] glass shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-sm text-gray-600"><Loader className="w-4 h-4 animate-spin text-blood-600" /> Loading...</div>}
        
        {/* Mobile Locate GPS Button */}
        <button onClick={triggerBrowserLocation}
          className="lg:hidden absolute bottom-24 right-4 z-[1000] w-12 h-12 bg-white shadow-xl rounded-2xl flex items-center justify-center hover:bg-blood-50 transition-colors border border-gray-100">
          <Navigation className="w-5 h-5 text-blood-700 animate-pulse" />
        </button>

        <MapContainer center={mapCenter} zoom={9} style={{ height: '100%', width: '100%' }} zoomControl={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <MapViewCenter center={mapCenter} />
          <MapControls onLocate={handleLocate} />
          
          {/* Radius circle */}
          {userLat && userLng && selectedDistance > 0 && (
            <Circle center={[userLat, userLng]} radius={selectedDistance} pathOptions={{ color: '#DC143C', fillColor: '#DC143C', fillOpacity: 0.05, weight: 1.5, dashArray: '6,6' }} />
          )}

          {/* Donors Markers */}
          {donorsList.map(donor => {
            const [lng, lat] = donor.location?.coordinates || [0, 0];
            if (!lat && !lng) return null;
            const isSel = selectedDonor?._id === donor._id;
            const st = statuses[donor._id] || null;
            const dist = getDistKm(donor);
            return (
              <Marker key={donor._id} position={[lat, lng]} icon={createDonorIcon(donor, isSel)} eventHandlers={{ click: () => setSelectedDonor(donor) }}>
                <Popup>
                  <div className="p-4 w-[240px]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blood-400 to-blood-700 flex items-center justify-center text-white font-black text-lg">{donor.name.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{donor.name}</p>
                        <div className="flex items-center gap-1.5"><span className="badge-blood">{donor.bloodType}</span>{donor.emergencyAvailable&&<Zap className="w-3.5 h-3.5 text-red-500" />}</div>
                        {dist !== null && <p className="text-xs text-blood-600 font-bold mt-0.5">{dist.toFixed(1)} KM away</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <ActionBtn status={st} onRequest={() => setRequestDonor(donor)} onChat={() => navigate(`/chat/${donor._id}`)} />
                        <button onClick={() => navigate(`/profile/${donor._id}`)} className="flex-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg">Profile</button>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Organizations / Hospitals Markers (Displays Hospital Real Profile Image) */}
          {orgsList.map(org => {
            const [lng, lat] = org.location?.coordinates || [0, 0];
            if (!lat && !lng) return null;
            const isSel = selectedHospital?._id === org._id;
            const dist = getDistKm(org);
            return (
              <Marker key={org._id} position={[lat, lng]} icon={createHospitalIcon(org, isSel)} eventHandlers={{ click: () => setSelectedHospital(org) }}>
                <Popup>
                  <div className="p-4 w-[250px]">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={org.avatar || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=100'} className="w-12 h-12 rounded-full object-cover border border-blue-200" />
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{org.organizationName || org.name}</p>
                        {dist !== null && <p className="text-xs text-blue-600 font-bold mt-0.5">{dist.toFixed(1)} KM away</p>}
                        <p className="text-[10px] text-gray-400 mt-0.5">{org.district}, {org.state}</p>
                      </div>
                    </div>
                    {org.bio && <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5 mb-3 leading-relaxed">"{org.bio}"</p>}
                    <button onClick={() => navigate('/appointments')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1">
                      <Building className="w-3.5 h-3.5" /> Book Donation Slot
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Donation Camps Markers */}
          {camps.map(camp => {
            const [lng, lat] = camp.location?.coordinates || [0, 0];
            if (!lat && !lng) return null;
            return (
              <Marker key={camp._id} position={[lat, lng]} icon={createCampIcon()}>
                <Popup>
                  <div className="p-4 w-[240px]">
                    <div className="flex items-center gap-2 mb-2 text-blood-700">
                      <Tent className="w-5 h-5" />
                      <h4 className="font-bold text-sm text-gray-800">{camp.title}</h4>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-3 mb-2">{camp.description}</p>
                    <div className="bg-gray-50 rounded-lg p-2 text-xs space-y-1 text-gray-600 mb-3 border border-gray-100">
                      <p>📍 {camp.locationName}</p>
                      <p>📅 {format(new Date(camp.date), 'MMM d, yyyy')}</p>
                      <p>🕒 {camp.time}</p>
                    </div>
                    <button onClick={() => navigate('/camps')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1">
                      <Users className="w-3.5 h-3.5" /> RSVP / Join Drive
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        </MapContainer>
      </div>

      {showFilter && <FilterPanel filters={filters} onApply={f => { setFilters(f); setShowFilter(false); }} onClose={() => setShowFilter(false)} />}
      {requestDonor && <RequestModal donor={requestDonor} onClose={() => setRequestDonor(null)} onSuccess={() => { setRequestDonor(null); fetchUsers(); navigate('/requests'); }} />}
      {showEmergency && <EmergencyAlertModal userLat={userLat} userLng={userLng} onClose={() => setShowEmergency(false)} />}
    </div>
  );
}
