import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, XCircle, Building, AlertTriangle, Trophy, Search, MapPin, Users, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { format, addDays } from 'date-fns';

interface Slot {
  _id: string;
  date: string;
  timeSlot: string;
  capacity: number;
  booked: number;
  remaining: number;
  isFull: boolean;
  isOpen: boolean;
  location: string;
  notes: string;
  organizationId: {
    _id: string;
    name: string;
    organizationName: string;
    district: string;
    state: string;
  };
}

interface Booking {
  _id: string;
  date: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  slotId?: { timeSlot: string; date: string; location: string };
  organizationId?: { name: string; organizationName: string; district: string; state: string };
  badgeAwarded?: boolean;
  userId?: { _id: string; name: string } | string;
  donorId?: { _id: string; name: string } | string;
}

const STATUS_CFG = {
  pending:   { label: 'Pending',   Icon: Clock,         cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmed', Icon: CheckCircle,   cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', Icon: XCircle,       cls: 'bg-red-100 text-red-700 border-red-200' },
  completed: { label: 'Completed', Icon: Trophy,        cls: 'bg-blue-100 text-blue-700 border-blue-200' },
};

export default function AppointmentsPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'find' | 'my'>('find');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [booking, setBooking] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [searchOrg, setSearchOrg] = useState('');
  const [bookSuccess, setBookSuccess] = useState('');
  const [bookError, setBookError] = useState('');
  const [selectedTime, setSelectedTime] = useState<string>('All');

  const today = format(new Date(), 'yyyy-MM-dd');
  const dates = Array.from({ length: 7 }, (_, i) => format(addDays(new Date(), i), 'yyyy-MM-dd'));

  const timeOptions = ['All', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '11:30 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

  // Eligibility check
  const lastDonation = user?.lastDonationDate ? new Date(user.lastDonationDate) : null;
  const daysSince = lastDonation ? Math.floor((Date.now() - lastDonation.getTime()) / (1000 * 60 * 60 * 24)) : 999;
  const isEligible = daysSince >= 90;
  const daysLeft = isEligible ? 0 : 90 - daysSince;

  useEffect(() => {
    if (user?.role === 'organization') return;
    if (tab === 'find') fetchSlots();
    else fetchMyBookings();
  }, [tab, selectedDate, user]);

  const fetchSlots = async () => {
    setLoading(true);
    setSelectedSlot(null);
    setBookSuccess('');
    setBookError('');
    try {
      const { data } = await api.get('/appointments/slots', { params: { date: selectedDate } });
      setSlots(data.slots || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/appointments/my');
      setBookings(data.appointments || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const bookSlot = async () => {
    if (!selectedSlot) return;
    setBooking(true); setBookError(''); setBookSuccess('');
    try {
      await api.post('/appointments/book', { slotId: selectedSlot._id });
      setBookSuccess(`✅ Appointment confirmed at ${selectedSlot.organizationId?.organizationName || selectedSlot.organizationId?.name} — ${selectedSlot.timeSlot} on ${format(new Date(selectedSlot.date), 'MMM d, yyyy')}`);
      setSelectedSlot(null);
      fetchSlots();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setBookError(err.response?.data?.message || 'Booking failed');
    }
    setBooking(false);
  };

  if (user?.role === 'organization') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 border border-blue-200">
          <Building className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-gray-800 text-xl">Hospital / Organization View</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Organizations cannot book donation appointments. Please navigate to the Organization Dashboard to coordinate slots, check-ins, and verify QR codes.
        </p>
        <button onClick={() => navigate('/org-dashboard')} className="btn-primary w-full py-3.5 text-sm">
          Go to Organization Dashboard
        </button>
      </div>
    );
  }

  const cancelAppt = async (id: string) => {
    setCancelling(id);
    try { await api.patch(`/appointments/${id}/cancel`); fetchMyBookings(); }
    catch { /* silent */ }
    finally { setCancelling(null); }
  };

  const filteredSlots = slots.filter(s => {
    const matchesSearch = !searchOrg || 
      (s.organizationId?.organizationName || s.organizationId?.name || '').toLowerCase().includes(searchOrg.toLowerCase()) ||
      (s.organizationId?.district || '').toLowerCase().includes(searchOrg.toLowerCase());
    
    const matchesTime = selectedTime === 'All' || s.timeSlot === selectedTime;

    return matchesSearch && matchesTime;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blood-100 rounded-xl flex items-center justify-center">
          <Calendar className="w-5 h-5 text-blood-700" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">{t('appointments.title')}</h1>
          <p className="text-gray-400 text-sm">Book donation slots at hospitals & blood banks</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-5">
        <button onClick={() => setTab('find')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab==='find'?'bg-white text-blood-700 shadow':'text-gray-400'}`}>
          <Building className="w-4 h-4" /> Find Slots
        </button>
        <button onClick={() => setTab('my')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab==='my'?'bg-white text-blood-700 shadow':'text-gray-400'}`}>
          <Calendar className="w-4 h-4" /> My Bookings {bookings.filter(b=>b.status==='confirmed').length > 0 && <span className="w-5 h-5 bg-blood-600 text-white text-xs rounded-full flex items-center justify-center font-black">{bookings.filter(b=>b.status==='confirmed').length}</span>}
        </button>
      </div>

      {tab === 'find' ? (
        <div className="space-y-4">
          {/* Eligibility Warning */}
          {!isEligible && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800 text-sm">⏳ {t('appointments.eligibilityCheck')}</p>
                <p className="text-xs text-amber-700 mt-1">{t('appointments.eligibilityFail')}. <strong>{daysLeft} {t('appointments.daysLeft')}</strong> remaining.</p>
                {user?.nextEligibleDate && <p className="text-xs text-amber-500 mt-0.5">Eligible again: {format(new Date(user.nextEligibleDate), 'MMM d, yyyy')}</p>}
              </div>
            </div>
          )}

          {/* Date Scroller */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Date</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {dates.map(d => (
                <button key={d} onClick={() => setSelectedDate(d)}
                  className={`flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${selectedDate===d?'bg-blood-600 text-white shadow-md':'bg-white border border-gray-200 text-gray-600 hover:border-blood-300'}`}>
                  <span className="text-base font-black">{format(new Date(d), 'd')}</span>
                  <span className="opacity-80">{format(new Date(d), 'EEE')}</span>
                  {d === today && <span className="text-xs mt-0.5 opacity-70">Today</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Time Scroller */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Time Slot</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {timeOptions.map(tOption => (
                <button key={tOption} onClick={() => setSelectedTime(tOption)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedTime===tOption?'bg-blood-600 text-white shadow-md':'bg-white border border-gray-200 text-gray-600 hover:border-blood-300'}`}>
                  {tOption}
                </button>
              ))}
            </div>
          </div>

          {/* Search Org */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={searchOrg} onChange={e => setSearchOrg(e.target.value)}
              placeholder="Search hospital or blood bank..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blood-200 focus:border-blood-400" />
          </div>

          {/* Success / Error */}
          {bookSuccess && <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-2xl px-4 py-3 border border-emerald-200"><CheckCircle className="w-4 h-4 flex-shrink-0" />{bookSuccess}</div>}
          {bookError && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-3 border border-red-200"><AlertTriangle className="w-4 h-4 flex-shrink-0" />{bookError}</div>}

          {/* Slots List */}
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>
          ) : filteredSlots.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 font-medium">No slots available for this date</p>
              <p className="text-xs text-gray-300 mt-1">Try another date or check back later</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{filteredSlots.length} Slots Available — {format(new Date(selectedDate), 'EEEE, MMM d')}</p>
              {filteredSlots.map(slot => {
                const pct = Math.round((slot.booked / slot.capacity) * 100);
                const almostFull = pct >= 75;
                const isSelected = selectedSlot?._id === slot._id;
                const orgName = slot.organizationId?.organizationName || slot.organizationId?.name || 'Blood Bank';
                return (
                  <div key={slot._id}
                    onClick={() => { if (!slot.isFull && slot.isOpen) setSelectedSlot(isSelected ? null : slot); }}
                    className={`card p-4 transition-all ${slot.isFull || !slot.isOpen ? 'opacity-50 cursor-not-allowed' : isSelected ? 'border-blood-400 bg-blood-50 shadow-md cursor-pointer' : 'hover:border-blood-200 hover:shadow-sm cursor-pointer'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isSelected ? 'bg-blood-600' : 'bg-gray-100'}`}>
                          <Building className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{orgName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3 text-blood-500" />
                            <span className="text-xs font-bold text-blood-600">{slot.timeSlot}</span>
                            {(slot.organizationId?.district) && <>
                              <span className="text-gray-300">·</span>
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">{slot.organizationId.district}</span>
                            </>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {slot.isFull || !slot.isOpen ? (
                          <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-100 px-2.5 py-1 rounded-xl">{t('appointments.full')}</span>
                        ) : (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className={`text-xs font-black ${almostFull ? 'text-amber-600' : 'text-emerald-600'}`}>{slot.remaining} left</span>
                            <div className="flex items-center gap-1 text-xs text-gray-400"><Users className="w-3 h-3" />{slot.booked}/{slot.capacity}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Capacity bar */}
                    <div className="w-full h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-1.5 rounded-full transition-all ${pct>=90?'bg-red-500':almostFull?'bg-amber-500':'bg-emerald-500'}`} style={{width:`${pct}%`}} />
                    </div>

                    {slot.location && <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><MapPin className="w-3 h-3" />{slot.location}</p>}
                    {slot.notes && <p className="text-xs text-gray-400 mt-1 italic">{slot.notes}</p>}

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-blood-100">
                        <button disabled={booking || !isEligible} onClick={(e) => { e.stopPropagation(); bookSlot(); }}
                          className="w-full bg-blood-600 hover:bg-blood-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                          {booking ? <div className="spinner w-4 h-4" /> : <><Calendar className="w-4 h-4" /> Confirm Booking at {slot.timeSlot}</>}
                        </button>
                        {!isEligible && <p className="text-center text-xs text-amber-600 mt-1.5">⚠️ {daysLeft} more days until you're eligible</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* My Bookings */
        <div>
          {loading ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="card p-4 h-24 skeleton" />)}</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-blood-300 mx-auto mb-3" />
              <p className="font-semibold text-gray-500">{t('appointments.noBookings')}</p>
              <p className="text-xs text-gray-400 mt-1">Browse available slots to book your first donation</p>
              <button onClick={() => setTab('find')} className="mt-4 btn-primary text-sm px-5 py-2.5">Find Slots</button>
            </div>
          ) : (
            <div className="space-y-6">
              {['confirmed','pending'].some(s => bookings.some(b => b.status === s)) && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📅 Upcoming</p>
                  <div className="space-y-3">
                    {bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').map(appt => (
                      <BookingCard key={appt._id} appt={appt} onCancel={cancelAppt} cancelling={cancelling} />
                    ))}
                  </div>
                </div>
              )}
              {['completed','cancelled'].some(s => bookings.some(b => b.status === s)) && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">🕐 Past</p>
                  <div className="space-y-3">
                    {bookings.filter(b => b.status === 'completed' || b.status === 'cancelled').map(appt => (
                      <BookingCard key={appt._id} appt={appt} onCancel={cancelAppt} cancelling={cancelling} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BookingCard({ appt, onCancel, cancelling }: { appt: Booking; onCancel(id: string): void; cancelling: string|null }) {
  const cfg = STATUS_CFG[appt.status];
  const org = appt.organizationId;
  const [showQrPass, setShowQrPass] = useState(false);
  const donorId = typeof appt.donorId === 'object' ? (appt.donorId as any)?._id : appt.donorId;

  const checkinQrUrl = `https://chart.googleapis.com/chart?chs=180x180&cht=qr&chl=${encodeURIComponent(window.location.origin + '/verify-donor/' + donorId)}`;

  return (
    <div className={`card p-4 ${appt.status==='completed'?'border-blue-100':appt.status==='confirmed'?'border-emerald-100':''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blood-100 rounded-xl flex items-center justify-center"><Calendar className="w-5 h-5 text-blood-700" /></div>
          <div>
            <p className="font-bold text-gray-800 text-sm">{appt.timeSlot}</p>
            <p className="text-xs text-gray-400">{format(new Date(appt.date), 'EEEE, MMM d yyyy')}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
          <cfg.Icon className="w-3 h-3" />{cfg.label}
        </span>
      </div>
      {org && (
        <div className="bg-gray-50 rounded-xl px-3 py-2 flex items-center gap-2">
          <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-700 text-xs">{org.organizationName || org.name}</p>
            {(org.district || org.state) && <p className="text-xs text-gray-400">{org.district}{org.district && org.state?', ':''}{org.state}</p>}
          </div>
        </div>
      )}
      {appt.status==='completed' && appt.badgeAwarded && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <p className="text-xs font-bold text-amber-700">🏅 Badge awarded! Thank you for donating blood.</p>
        </div>
      )}
      
      <div className="mt-2 flex gap-2">
        {appt.status==='confirmed' && (
          <>
            <button
              onClick={() => setShowQrPass(true)}
              className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              🎟️ View QR Pass
            </button>
            <button disabled={cancelling===appt._id} onClick={()=>onCancel(appt._id)}
              className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50">
              {cancelling===appt._id?<div className="spinner w-3 h-3"/>:<><XCircle className="w-3.5 h-3.5"/>Cancel Booking</>}
            </button>
          </>
        )}
      </div>

      {/* QR PASS MODAL */}
      {showQrPass && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4 relative">
            <button onClick={() => setShowQrPass(false)} className="absolute right-4 top-4 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors">
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h4 className="font-display font-black text-gray-800 text-base">Blood Donation Pass</h4>
              <p className="text-xs text-gray-400">Scan at hospital reception to check-in</p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-gray-100 text-xs text-left space-y-1.5 text-gray-600">
              <p>🏥 **Hospital**: {org?.organizationName || org?.name}</p>
              <p>📅 **Date**: {format(new Date(appt.date), 'EEEE, MMM d, yyyy')}</p>
              <p>🕒 **Time**: {appt.timeSlot}</p>
            </div>

            {/* Google Charts QR code */}
            <div className="bg-white p-3 border border-gray-100 rounded-2xl inline-block shadow-md">
              <img src={checkinQrUrl} alt="Booking Check-In QR" className="w-40 h-40 mx-auto" />
            </div>

            <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">ID: {appt._id.slice(-8).toUpperCase()}</p>

            <button onClick={() => setShowQrPass(false)} className="w-full bg-blood-600 hover:bg-blood-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors">
              Close Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
