import { useState, FormEvent } from 'react';
import { User } from '../../types';
import api from '../../utils/api';
import { X, Heart, AlertCircle, Zap, AlertTriangle, Activity } from 'lucide-react';

interface Props { donor: User; onClose(): void; onSuccess(): void; }

const URGENCY = [
  { value:'normal', label:'Normal', icon:Activity, active:'border-blue-500 bg-blue-50 text-blue-700' },
  { value:'urgent', label:'Urgent', icon:AlertTriangle, active:'border-orange-500 bg-orange-50 text-orange-700' },
  { value:'critical', label:'Critical', icon:Zap, active:'border-red-500 bg-red-50 text-red-700' },
];

export default function RequestModal({ donor, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ hospital:'', reason:'', urgencyLevel:'normal', requiredUnits:'1', contactNote:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/requests', { donorId: donor._id, bloodType: donor.bloodType, ...form, requiredUnits: parseInt(form.requiredUnits) });
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to send request');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md animate-slide-up overflow-hidden">
        <div className={`h-1.5 w-full ${form.urgencyLevel==='critical'?'bg-red-500 animate-pulse':form.urgencyLevel==='urgent'?'bg-orange-500':'bg-blue-500'}`} />
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div><h2 className="font-display text-xl font-bold text-gray-800">Blood Request</h2><p className="text-sm text-gray-400 mt-0.5">Send to donor</p></div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-400" /></button>
          </div>

          <div className="flex items-center gap-3 p-3 bg-blood-50 rounded-2xl mb-4 border border-blood-100">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blood-400 to-blood-700 flex items-center justify-center text-white font-black text-lg shadow-md">{donor.name.charAt(0)}</div>
            <div>
              <p className="font-bold text-gray-800">{donor.name}</p>
              <div className="flex items-center gap-2"><span className="badge-blood">{donor.bloodType}</span>{donor.emergencyAvailable && <span className="text-xs text-red-600 font-bold flex items-center gap-0.5"><Zap className="w-3 h-3" /> Emergency</span>}</div>
            </div>
          </div>

          {error && <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-sm"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Urgency Level</label>
              <div className="grid grid-cols-3 gap-2">
                {URGENCY.map(({ value, label, icon: Icon, active }) => (
                  <button key={value} type="button" onClick={() => setForm(p => ({ ...p, urgencyLevel: value }))}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-bold transition-all ${form.urgencyLevel===value ? active : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    <Icon className="w-4 h-4" />{label}
                  </button>
                ))}
              </div>
            </div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Hospital Name *</label><input type="text" value={form.hospital} onChange={e => setForm(p=>({...p,hospital:e.target.value}))} placeholder="e.g. Apollo Hospital, Chennai" className="input-field" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason *</label><input type="text" value={form.reason} onChange={e => setForm(p=>({...p,reason:e.target.value}))} placeholder="Surgery, accident..." className="input-field" required /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Units</label><select value={form.requiredUnits} onChange={e => setForm(p=>({...p,requiredUnits:e.target.value}))} className="input-field">{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} unit{n>1?'s':''}</option>)}</select></div>
            </div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Note (optional)</label><textarea value={form.contactNote} onChange={e => setForm(p=>({...p,contactNote:e.target.value}))} placeholder="Additional info for the donor..." className="input-field resize-none" rows={2} /></div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 py-3">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                {loading ? <div className="spinner w-4 h-4" /> : <><Heart className="w-4 h-4" /> Send Request</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
