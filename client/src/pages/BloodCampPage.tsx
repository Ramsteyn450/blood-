import { useState, useEffect } from 'react';
import { Tent, Users, MapPin, Calendar, Clock, Plus, Building, UserCheck, AlertTriangle, CheckCircle, Navigation, Stethoscope, Image, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
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
  campType: 'Blood Donation' | 'Eye Camp' | 'General Health' | 'Dental Camp' | 'Cardiology Camp';
  poster: string;
  locationName: string;
  location: { coordinates: [number, number] };
  organizerId: { _id: string; name: string; organizationName: string; email: string; district: string; state: string };
  rsvps: { _id: string; name: string; bloodType: string }[];
}

const CAMP_TYPES = ['Blood Donation', 'Eye Camp', 'General Health', 'Dental Camp', 'Cardiology Camp'];

export default function BloodCampPage() {
  const { user } = useAuthStore();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [rsvping, setRsvping] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Create Form State
  const [form, setForm] = useState({
    title: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), time: '09:00 AM - 04:00 PM',
    locationName: '', lat: 10.7905, lng: 78.7047,
    place: '', hospital: '', doctors: '', campType: 'Blood Donation', poster: ''
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchCamps = async () => {
    try {
      const { data } = await api.get('/camps');
      setCamps(data.camps || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCamps(); }, []);

  const handleRsvp = async (campId: string) => {
    setRsvping(campId);
    try {
      await api.post(`/camps/${campId}/rsvp`);
      fetchCamps();
    } catch { /* silent */ }
    finally { setRsvping(null); }
  };

  const handleDelete = async (campId: string) => {
    if (!confirm('Are you sure you want to delete this medical camp?')) return;
    setDeleting(campId);
    try {
      await api.delete(`/camps/${campId}`);
      fetchCamps();
    } catch {
      alert('Failed to delete medical camp');
    }
    finally { setDeleting(null); }
  };

  const createCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.locationName || !form.hospital) {
      setError('Please fill in all fields (Title, Description, Venue, and Hospital are required)');
      return;
    }
    setCreating(true);
    setError('');
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const body = { ...form, lat: pos.coords.latitude, lng: pos.coords.longitude };
          await api.post('/camps', body);
          setShowCreate(false);
          resetForm();
          fetchCamps();
        },
        async () => {
          await api.post('/camps', form);
          setShowCreate(false);
          resetForm();
          fetchCamps();
        }
      );
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { message?: string } } };
      setError(e2.response?.data?.message || 'Failed to create camp');
    }
    setCreating(false);
  };

  const resetForm = () => {
    setForm({
      title: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), time: '09:00 AM - 04:00 PM',
      locationName: '', lat: 10.7905, lng: 78.7047,
      place: '', hospital: '', doctors: '', campType: 'Blood Donation', poster: ''
    });
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 page-enter space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blood-100 rounded-xl flex items-center justify-center">
            <Tent className="w-5 h-5 text-blood-700" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-800">Medical Drives & Camps</h1>
            <p className="text-gray-400 text-sm">Join upcoming medical checkups & blood camps organized in Tamil Nadu</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 bg-blood-600 hover:bg-blood-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-md">
            <Plus className="w-4.5 h-4.5" /> Host Medical Camp (Admin Only)
          </button>
        )}
      </div>

      {/* Create Camp Form */}
      {showCreate && (
        <form onSubmit={createCamp} className="card p-5 border-blood-200 bg-white shadow-xl space-y-4 max-w-lg mx-auto">
          <h3 className="font-bold text-gray-800 text-base">Host New Medical Camp</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Camp Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Trichy Health Camp" className="input w-full" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Camp Type</label>
                <select value={form.campType} onChange={e => setForm(f => ({ ...f, campType: e.target.value as any }))} className="input w-full">
                  {CAMP_TYPES.map(ct => <option key={ct}>{ct}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Provide details about the drive..." rows={2} className="input w-full resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Date</label>
                <input type="date" value={form.date} min={format(new Date(), 'yyyy-MM-dd')} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input w-full" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Time Slot</label>
                <input value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} placeholder="e.g. 9 AM - 4 PM" className="input w-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Hospital / Center</label>
                <input value={form.hospital} onChange={e => setForm(f => ({ ...f, hospital: e.target.value }))} placeholder="e.g. Trichy GH" className="input w-full" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Doctors Team</label>
                <input value={form.doctors} onChange={e => setForm(f => ({ ...f, doctors: e.target.value }))} placeholder="e.g. Dr. Vijay, Dr. Priya" className="input w-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Venue Place</label>
                <input value={form.place} onChange={e => setForm(f => ({ ...f, place: e.target.value }))} placeholder="e.g. Community Hall" className="input w-full" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">City / District Location</label>
                <input value={form.locationName} onChange={e => setForm(f => ({ ...f, locationName: e.target.value }))} placeholder="e.g. Tiruchirappalli" className="input w-full" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Poster Image URL (Optional)</label>
              <input value={form.poster} onChange={e => setForm(f => ({ ...f, poster: e.target.value }))} placeholder="Paste image link e.g. https://..." className="input w-full" />
            </div>
          </div>

          {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{error}</p>}

          <div className="flex gap-2">
            <button type="button" onClick={() => { setShowCreate(false); resetForm(); }} className="flex-1 btn-secondary py-2.5">Cancel</button>
            <button type="submit" disabled={creating} className="flex-1 bg-blood-600 hover:bg-blood-700 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2">
              {creating ? <div className="spinner w-4 h-4" /> : <><Navigation className="w-4 h-4" /> Create Camp</>}
            </button>
          </div>
        </form>
      )}

      {/* Camp List */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-56 skeleton rounded-2xl" />)}
        </div>
      ) : camps.length === 0 ? (
        <div className="text-center py-16">
          <Tent className="w-12 h-12 text-blood-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">No medical camps scheduled</p>
          <p className="text-xs text-gray-400 mt-1">Check back later or host a camp as an admin</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {camps.map(camp => {
            const hasRsvped = camp.rsvps.some(r => r._id === user?._id);
            return (
              <div key={camp._id} className={`card overflow-hidden bg-white border border-gray-100 hover:border-blood-200 transition-all flex flex-col justify-between ${hasRsvped ? 'border-blood-300 shadow-md bg-blood-50/5' : ''}`}>
                
                {/* Poster Display */}
                {camp.poster ? (
                  <div className="h-40 bg-gray-100 overflow-hidden relative border-b border-gray-50">
                    <img src={camp.poster} alt={camp.title} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-md">
                      {camp.campType}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(camp._id)}
                        disabled={deleting === camp._id}
                        className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-red-600 rounded-xl transition-all shadow-md"
                        title="Delete Camp"
                      >
                        {deleting === camp._id ? <div className="spinner w-3.5 h-3.5" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="h-20 bg-gradient-to-r from-blood-700 to-red-600 relative border-b border-gray-50 flex items-center justify-between px-4">
                    <span className="bg-white/20 text-white text-xs font-black px-2.5 py-1 rounded-xl">
                      {camp.campType}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(camp._id)}
                        disabled={deleting === camp._id}
                        className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all"
                        title="Delete Camp"
                      >
                        {deleting === camp._id ? <div className="spinner w-3.5 h-3.5" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-bold text-gray-800 text-sm md:text-base leading-tight">{camp.title}</h3>
                      <span className="flex items-center gap-1 text-xs font-bold text-blood-600 bg-blood-50 border border-blood-100 px-2.5 py-1 rounded-xl flex-shrink-0">
                        <Users className="w-3.5 h-3.5" /> {camp.rsvps.length} RSVP
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">{camp.description}</p>

                    <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-xl p-3 mb-4 text-[11px] text-gray-600 border border-gray-100">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Building className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate"><strong>Hospital:</strong> {camp.hospital}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Stethoscope className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate"><strong>Doctors:</strong> {camp.doctors || 'Staff'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate"><strong>Venue:</strong> {camp.place || camp.locationName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{format(new Date(camp.date), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      disabled={rsvping === camp._id}
                      onClick={() => handleRsvp(camp._id)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${hasRsvped ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-white border-blood-200 text-blood-700 hover:bg-blood-50'}`}
                    >
                      {rsvping === camp._id ? <div className="spinner w-4 h-4" /> : hasRsvped ? <><CheckCircle className="w-4 h-4" /> RSVP'd (Attending)</> : <><UserCheck className="w-4 h-4" /> RSVP Camp</>}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
