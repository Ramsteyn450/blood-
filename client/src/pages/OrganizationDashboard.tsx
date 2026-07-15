import { useState, useEffect } from 'react';
import { Building, Plus, Calendar, Users, CheckCircle, XCircle, Clock, AlertTriangle, Trash2, ShieldCheck, Search, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import { format, addDays } from 'date-fns';

import { Html5QrcodeScanner } from 'html5-qrcode';

const TIME_SLOTS = ['08:00 AM','09:00 AM','10:00 AM','11:00 AM','11:30 AM','12:00 PM','01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM'];

interface Slot { _id: string; date: string; timeSlot: string; capacity: number; booked: number; isOpen: boolean; location: string; notes: string; }
interface Booking {
  _id: string; date: string; timeSlot: string; status: 'pending'|'confirmed'|'cancelled'|'completed'; badgeAwarded: boolean;
  userId?: { _id: string; name: string; bloodType: string; phone: string; email: string; state: string; district: string };
  slotId?: { timeSlot: string };
}

export default function OrganizationDashboard() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [tab, setTab] = useState<'slots'|'bookings'|'checkin'>('slots');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showCreate, setShowCreate] = useState(false);
  const [completing, setCompleting] = useState<string|null>(null);
  const [form, setForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), timeSlot: '09:00 AM', capacity: 20, location: '', notes: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Check-In verification state
  const [donorCodeInput, setDonorCodeInput] = useState('');
  const [foundBooking, setFoundBooking] = useState<Booking|null>(null);
  const [checkinError, setCheckinError] = useState('');
  const [checkinSuccess, setCheckinSuccess] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const dates = [today, format(addDays(new Date(),1),'yyyy-MM-dd'), format(addDays(new Date(),2),'yyyy-MM-dd'), format(addDays(new Date(),3),'yyyy-MM-dd'), format(addDays(new Date(),4),'yyyy-MM-dd'), format(addDays(new Date(),5),'yyyy-MM-dd'), format(addDays(new Date(),6),'yyyy-MM-dd')];

  useEffect(() => {
    if (tab !== 'checkin') {
      fetchData();
    }
  }, [selectedDate, tab]);

  // QR Code camera scanner lifecycle
  useEffect(() => {
    if (tab === 'checkin') {
      const scanner = new Html5QrcodeScanner(
        'qr-scanner-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          // Parse donor ID from the scanned verify-donor URL
          let cleanId = decodedText;
          if (cleanId.includes('/verify-donor/')) {
            const parts = cleanId.split('/verify-donor/');
            cleanId = parts[parts.length - 1];
          }
          setDonorCodeInput(cleanId);
          scanner.clear().catch(e => console.error(e));
          triggerDirectLookup(cleanId);
        },
        () => {
          // Silent on scanning frame errors
        }
      );

      return () => {
        scanner.clear().catch(() => {});
      };
    }
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'slots') {
        const { data } = await api.get('/appointments/org/slots', { params: { date: selectedDate } });
        setSlots(data.slots || []);
      } else if (tab === 'bookings') {
        const { data } = await api.get('/appointments/org/bookings', { params: { date: selectedDate } });
        setBookings(data.appointments || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const createSlot = async () => {
    setCreating(true); setError('');
    try {
      await api.post('/appointments/slots', form);
      setShowCreate(false);
      fetchData();
    } catch (e: unknown) {
      const err = e as {response?:{data?:{message?:string}}};
      setError(err.response?.data?.message || 'Failed to create slot');
    }
    setCreating(false);
  };

  const toggleSlot = async (slot: Slot) => {
    await api.patch(`/appointments/slots/${slot._id}`, { isOpen: !slot.isOpen });
    fetchData();
  };

  const deleteSlot = async (id: string) => {
    if (!confirm('Delete this slot?')) return;
    try { await api.delete(`/appointments/slots/${id}`); fetchData(); }
    catch (e: unknown) { const err = e as {response?:{data?:{message?:string}}}; alert(err.response?.data?.message || 'Cannot delete'); }
  };

  const completeBooking = async (id: string) => {
    if (!confirm('Mark as completed and award badge to donor?')) return;
    setCompleting(id);
    try {
      await api.patch(`/appointments/${id}/complete`);
      if (foundBooking?._id === id) {
        setFoundBooking(prev => prev ? { ...prev, status: 'completed', badgeAwarded: true } : null);
      }
      fetchData();
    } catch (e) { console.error(e); }
    finally { setCompleting(null); }
  };

  const triggerDirectLookup = async (donorId: string) => {
    setCheckinError('');
    setCheckinSuccess('');
    setFoundBooking(null);
    try {
      const { data } = await api.get('/appointments/org/bookings', { params: { date: today } });
      const todayAppointments = (data.appointments || []) as Booking[];
      const matched = todayAppointments.find(b => b.userId?._id === donorId || b.userId?.email.toLowerCase() === donorId.toLowerCase());
      if (matched) {
        setFoundBooking(matched);
      } else {
        setCheckinError('No confirmed donation appointment found for this donor today.');
      }
    } catch {
      setCheckinError('Error checking donor verification code.');
    }
  };

  // QR Code lookup & verify from text input
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorCodeInput.trim()) return;
    let cleanId = donorCodeInput.trim();
    if (cleanId.includes('lifeflow-checkin:')) {
      cleanId = cleanId.split('lifeflow-checkin:')[1];
    }
    triggerDirectLookup(cleanId);
  };

  if (user?.role !== 'organization') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="font-bold text-gray-800 text-xl mb-2">Access Restricted</h2>
        <p className="text-gray-400">This page is only accessible to registered blood donation organizations.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blood-100 rounded-xl flex items-center justify-center"><Building className="w-5 h-5 text-blood-700" /></div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-800">{t('nav.org')}</h1>
            <p className="text-gray-400 text-sm">{user?.organizationName || user?.name}</p>
          </div>
        </div>
        {tab === 'slots' && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-blood-600 hover:bg-blood-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-md">
            <Plus className="w-4 h-4" /> New Slot
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-5">
        {(['slots', 'bookings', 'checkin'] as const).map(t2 => (
          <button key={t2} onClick={() => setTab(t2)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab===t2?'bg-white text-blood-700 shadow':'text-gray-400'}`}>
            {t2 === 'slots' ? <><Calendar className="w-4 h-4" /> Slots</> : t2 === 'bookings' ? <><Users className="w-4 h-4" /> Bookings</> : <><ShieldCheck className="w-4 h-4" /> QR Check-In</>}
          </button>
        ))}
      </div>

      {/* Check-In Tab content */}
      {tab === 'checkin' ? (
        <div className="space-y-4 max-w-md mx-auto animate-fade-in">
          <div className="card p-5 border-blood-100">
            <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blood-600" />Scan / Verify Donor ID</h3>
            <p className="text-xs text-gray-400 mb-4">Verify the donor card check-in code or email to check them in.</p>
            
            <form onSubmit={handleLookup} className="relative flex gap-2 mb-4">
              <input
                value={donorCodeInput}
                onChange={e => setDonorCodeInput(e.target.value)}
                placeholder="Paste code e.g. lifeflow-checkin:..."
                className="input pl-3 pr-10 text-xs w-full"
              />
              <button type="submit" className="bg-blood-600 hover:bg-blood-700 text-white font-bold px-4 rounded-xl text-xs flex items-center gap-1">
                <Search className="w-3.5 h-3.5" /> Find
              </button>
            </form>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">📷 Live Camera Scanner</p>
              <div id="qr-scanner-reader" className="overflow-hidden rounded-2xl border border-gray-150 shadow-inner bg-stone-50"></div>
            </div>

            {checkinError && <p className="text-xs text-red-500 mt-3 bg-red-50 rounded-xl px-3 py-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> {checkinError}</p>}
            {checkinSuccess && <p className="text-xs text-emerald-700 mt-3 bg-emerald-50 rounded-xl px-3 py-2 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> {checkinSuccess}</p>}
          </div>

          {/* Found booking details */}
          {foundBooking && (
            <div className="card p-5 border-emerald-200 bg-emerald-50/10 space-y-4 animate-scale-up">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blood-400 to-blood-700 rounded-full flex items-center justify-center text-white font-black text-lg">
                  {foundBooking.userId?.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{foundBooking.userId?.name}</p>
                  <p className="text-xs text-gray-400">{foundBooking.userId?.email}</p>
                </div>
                <span className="ml-auto badge-blood">{foundBooking.userId?.bloodType}</span>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2 text-xs text-gray-600">
                <p>🕒 **Appointment Slot**: {foundBooking.timeSlot}</p>
                <p>📍 **Location**: {foundBooking.userId?.district}, {foundBooking.userId?.state}</p>
                <p>🚦 **Status**: <span className="font-bold capitalize">{foundBooking.status}</span></p>
              </div>

              {foundBooking.status === 'confirmed' ? (
                <button
                  disabled={checkingIn}
                  onClick={() => completeBooking(foundBooking._id)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  {checkingIn ? <div className="spinner w-4 h-4" /> : <><Award className="w-4 h-4 animate-bounce" /> Check-In & Award Badge</>}
                </button>
              ) : foundBooking.status === 'completed' ? (
                <div className="bg-emerald-100 text-emerald-700 font-bold p-3 rounded-2xl text-center text-xs flex items-center justify-center gap-1.5 border border-emerald-200">
                  <CheckCircle className="w-4 h-4" /> Check-in Completed (Badge Awarded!)
                </div>
              ) : (
                <div className="bg-red-50 text-red-700 font-bold p-3 rounded-2xl text-center text-xs border border-red-200">
                  ⚠️ This appointment is {foundBooking.status}.
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Regular tabs */
        <>
          {/* Date selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
            {dates.map(d => (
              <button key={d} onClick={() => setSelectedDate(d)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedDate===d?'bg-blood-600 text-white shadow-md':'bg-white text-gray-600 border border-gray-200 hover:border-blood-300'}`}>
                {d === today ? 'Today' : format(new Date(d), 'EEE d')}
                <p className="text-xs opacity-70 font-normal">{format(new Date(d),'MMM')}</p>
              </button>
            ))}
          </div>

          {/* Create Slot Form */}
          {showCreate && (
            <div className="card p-5 mb-4 border-blood-200">
              <h3 className="font-bold text-gray-800 mb-4">Create New Donation Slot</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Date</label>
                  <input type="date" value={form.date} min={today} onChange={e => setForm(f => ({...f, date: e.target.value}))} className="input w-full" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Time Slot</label>
                  <select value={form.timeSlot} onChange={e => setForm(f => ({...f, timeSlot: e.target.value}))} className="input w-full">
                    {TIME_SLOTS.map(ts => <option key={ts}>{ts}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Max Capacity</label>
                  <input type="number" value={form.capacity} min={1} max={500} onChange={e => setForm(f => ({...f, capacity: Number(e.target.value)}))} className="input w-full" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Location</label>
                  <input value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} placeholder="e.g. Block A, Ground Floor" className="input w-full" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Notes (optional)</label>
                  <input value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Any special instructions..." className="input w-full" />
                </div>
              </div>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowCreate(false)} className="flex-1 btn-secondary py-2.5">Cancel</button>
                <button disabled={creating} onClick={createSlot} className="flex-1 bg-blood-600 hover:bg-blood-700 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2">
                  {creating ? <div className="spinner w-4 h-4" /> : <><Plus className="w-4 h-4" /> Create</>}
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card p-4 h-20 skeleton" />)}</div>
          ) : tab === 'slots' ? (
            slots.length === 0 ? (
              <div className="text-center py-16"><Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" /><p className="text-gray-400">No slots for this date. Create one!</p></div>
            ) : (
              <div className="space-y-3">
                {slots.map(slot => {
                  const pct = Math.round((slot.booked / slot.capacity) * 100);
                  return (
                    <div key={slot._id} className="card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blood-100 rounded-xl flex items-center justify-center"><Clock className="w-5 h-5 text-blood-700" /></div>
                          <div>
                            <p className="font-bold text-gray-800">{slot.timeSlot}</p>
                            {slot.location && <p className="text-xs text-gray-400">{slot.location}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleSlot(slot)} className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${slot.isOpen ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                            {slot.isOpen ? '✓ Open' : '✗ Closed'}
                          </button>
                          <button onClick={() => deleteSlot(slot._id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-gray-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-gray-500">{slot.booked}/{slot.capacity} booked</span>
                        <span className={`font-bold ${pct >= 80 ? 'text-red-500' : pct >= 50 ? 'text-amber-600' : 'text-emerald-600'}`}>{pct}% full</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full"><div className={`h-2 rounded-full ${pct>=80?'bg-red-500':pct>=50?'bg-amber-500':'bg-emerald-500'}`} style={{width:`${pct}%`}} /></div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            bookings.length === 0 ? (
              <div className="text-center py-16"><Users className="w-10 h-10 text-gray-200 mx-auto mb-2" /><p className="text-gray-400">No bookings for this date</p></div>
            ) : (
              <div className="space-y-3">
                {bookings.map(b => (
                  <div key={b._id} className="card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blood-400 to-blood-700 rounded-full flex items-center justify-center text-white font-black text-sm">
                          {b.userId?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{b.userId?.name || 'Unknown'}</p>
                          <div className="flex items-center gap-2">
                            <span className="badge-blood">{b.userId?.bloodType}</span>
                            <span className="text-xs text-gray-400">{b.timeSlot}</span>
                            {b.userId?.phone && <span className="text-xs text-gray-400">{b.userId.phone}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {b.status === 'confirmed' && !b.badgeAwarded && (
                          <button disabled={completing === b._id} onClick={() => completeBooking(b._id)}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50">
                            {completing === b._id ? <div className="spinner w-3 h-3" /> : <><CheckCircle className="w-3.5 h-3.5" /> Mark Complete</>}
                          </button>
                        )}
                        {b.status === 'completed' && <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl"><CheckCircle className="w-3.5 h-3.5" /> Completed</span>}
                        {b.status === 'cancelled' && <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-xl"><XCircle className="w-3.5 h-3.5" /> Cancelled</span>}
                        {b.badgeAwarded && <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl">🏅 Badge given</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
