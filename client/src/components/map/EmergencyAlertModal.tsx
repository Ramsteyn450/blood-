import { useState } from 'react';
import { X, Siren, MapPin, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

interface Props {
  userLat?: number;
  userLng?: number;
  onClose(): void;
}

export default function EmergencyAlertModal({ userLat, userLng, onClose }: Props) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [bloodType, setBloodType] = useState<'A+'|'A-'|'B+'|'B-'|'AB+'|'AB-'|'O+'|'O-'>((user?.bloodType as 'A+'|'A-'|'B+'|'B-'|'AB+'|'AB-'|'O+'|'O-') || 'O+');
  const [hospital, setHospital] = useState('');
  const [radiusKm, setRadiusKm] = useState(5);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ donorsAlerted: number; message: string } | null>(null);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const send = async () => {
    if (!hospital.trim()) { setError('Please enter the hospital / location'); return; }
    if (!userLat || !userLng) { setError(t('errors.locationRequired')); return; }
    setSending(true);
    setError('');
    try {
      const { data } = await api.post('/emergency/alert', {
        lat: userLat, lng: userLng,
        bloodType, hospital, radiusKm,
      });
      setResult(data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Failed to send alert');
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9500] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden">
        {/* Red header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Siren className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-white">{t('emergency.title')}</h2>
                <p className="text-xs text-red-200">{t('emergency.subtitle')}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl"><X className="w-5 h-5 text-white" /></button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {result ? (
            /* Success state */
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">{t('emergency.alertSent')}</h3>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blood-600" />
                <span className="text-2xl font-black text-blood-600">{result.donorsAlerted}</span>
                <span className="text-gray-500">{t('emergency.donorsAlerted')}</span>
              </div>
              <p className="text-sm text-gray-400">Donors will receive a push notification immediately. Wait for them to respond.</p>
              <button onClick={onClose} className="mt-4 w-full bg-blood-600 text-white font-bold py-3 rounded-2xl">{t('common.close')}</button>
            </div>
          ) : (
            <>
              {/* Blood Type */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">{t('map.bloodGroup')} Needed</label>
                <div className="grid grid-cols-4 gap-2">
                  {BLOOD_TYPES.map(bt => (
                    <button
                      key={bt}
                      onClick={() => setBloodType(bt as 'A+'|'A-'|'B+'|'B-'|'AB+'|'AB-'|'O+'|'O-')}
                      className={`py-2 rounded-xl text-sm font-black transition-all ${bloodType === bt ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-red-50'}`}
                    >
                      {bt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hospital */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />{t('emergency.hospital')}
                </label>
                <input
                  value={hospital}
                  onChange={e => setHospital(e.target.value)}
                  placeholder="e.g. KLN Hospital, Trichy"
                  className="input w-full"
                />
              </div>

              {/* Radius slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('emergency.radius')}</label>
                  <span className="text-lg font-black text-blood-600">{radiusKm} KM</span>
                </div>
                <input
                  type="range" min={1} max={10} value={radiusKm}
                  onChange={e => setRadiusKm(Number(e.target.value))}
                  className="w-full accent-red-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1 KM</span><span>5 KM</span><span>10 KM</span>
                </div>
              </div>

              {!userLat && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  Enable location on the map first to use emergency alerts.
                </div>
              )}

              {error && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2"><AlertTriangle className="w-4 h-4" /> {error}</div>}

              {!confirmed ? (
                <button
                  onClick={() => setConfirmed(true)}
                  disabled={!userLat}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Siren className="w-4 h-4" /> {t('emergency.sendAlert')}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <p className="text-sm font-bold text-red-700 mb-1">⚠️ Confirm Alert</p>
                    <p className="text-xs text-red-600">{t('emergency.confirm')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmed(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm">Cancel</button>
                    <button onClick={send} disabled={sending} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                      {sending ? <div className="spinner w-4 h-4" /> : <><Siren className="w-4 h-4" /> Send Now</>}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
