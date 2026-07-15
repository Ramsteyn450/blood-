import { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
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
  organizationId: { name: string; organizationName: string; district: string; state: string };
}

interface Props {
  onClose(): void;
  onSuccess?(): void;
}

export default function AppointmentModal({ onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const dayAfter = format(addDays(new Date(), 2), 'yyyy-MM-dd');
  const dates = [today, tomorrow, dayAfter];

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate]);

  const fetchSlots = async (date: string) => {
    setLoading(true);
    setSelectedSlot(null);
    setError('');
    try {
      const { data } = await api.get('/appointments/slots', { params: { date } });
      setSlots(data.slots || []);
    } catch { setError('Failed to load slots'); }
    finally { setLoading(false); }
  };

  // Eligibility check - 3 months since last donation
  const lastDonation = user?.lastDonationDate ? new Date(user.lastDonationDate) : null;
  const daysSinceDonation = lastDonation ? Math.floor((Date.now() - lastDonation.getTime()) / (1000 * 60 * 60 * 24)) : 999;
  const isEligible = daysSinceDonation >= 90;
  const daysLeft = isEligible ? 0 : 90 - daysSinceDonation;

  const bookSlot = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    setError('');
    try {
      await api.post('/appointments/book', { slotId: selectedSlot._id });
      setSuccess('✅ Appointment confirmed! Check your notifications.');
      setTimeout(() => { onSuccess?.(); onClose(); }, 2000);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Booking failed. Try again.');
    }
    setBooking(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9000] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blood-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blood-700" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-gray-800">{t('appointments.title')}</h2>
              <p className="text-xs text-gray-400">{t('appointments.subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Eligibility Warning */}
          {!isEligible && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800 text-sm">{t('appointments.eligibilityCheck')}</p>
                <p className="text-xs text-amber-700 mt-1">
                  {t('appointments.eligibilityFail')}. <strong>{daysLeft} {t('appointments.daysLeft')}</strong>.
                </p>
                {user?.nextEligibleDate && (
                  <p className="text-xs text-amber-600 mt-0.5">
                    Eligible again: {format(new Date(user.nextEligibleDate), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Date Tabs */}
          <div className="flex gap-2">
            {dates.map(date => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${selectedDate === date ? 'bg-blood-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {date === today ? 'Today' : date === tomorrow ? 'Tomorrow' : format(new Date(date), 'EEE d')}
                <p className="text-xs opacity-70 font-normal mt-0.5">{format(new Date(date), 'MMM d')}</p>
              </button>
            ))}
          </div>

          {/* Slots */}
          {loading ? (
            <div className="space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-16 skeleton rounded-2xl" />)}
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No slots available for this date</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('appointments.availableSlots')}</p>
              {slots.map(slot => {
                const isSelected = selectedSlot?._id === slot._id;
                const pct = Math.round((slot.booked / slot.capacity) * 100);
                const almostFull = pct >= 80;
                return (
                  <button
                    key={slot._id}
                    disabled={slot.isFull || !slot.isOpen}
                    onClick={() => setSelectedSlot(isSelected ? null : slot)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                      slot.isFull || !slot.isOpen
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'border-blood-500 bg-blood-50 shadow-md'
                        : 'border-gray-100 hover:border-blood-200 hover:bg-blood-50/30 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${isSelected ? 'bg-blood-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{slot.timeSlot}</p>
                          <p className="text-xs text-gray-400">{slot.organizationId?.organizationName || slot.organizationId?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {slot.isFull || !slot.isOpen ? (
                          <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">{t('appointments.full')}</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            <span className={`text-xs font-bold ${almostFull ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {slot.remaining} left
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-gray-100 rounded-full">
                      <div
                        className={`h-1.5 rounded-full transition-all ${almostFull ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{slot.booked}/{slot.capacity} slots filled</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Messages */}
          {error && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-200"><AlertTriangle className="w-4 h-4" /> {error}</div>}
          {success && <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-200"><CheckCircle className="w-4 h-4" /> {success}</div>}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-gray-50">
          <button
            disabled={!selectedSlot || booking || !isEligible}
            onClick={bookSlot}
            className="w-full bg-blood-600 hover:bg-blood-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            {booking ? <div className="spinner w-5 h-5" /> : <><Calendar className="w-4 h-4" /> {t('appointments.confirmBooking')}</>}
          </button>
          {!isEligible && (
            <p className="text-center text-xs text-amber-600 mt-2">⚠️ You cannot book until {daysLeft} more days pass since your last donation</p>
          )}
        </div>
      </div>
    </div>
  );
}
