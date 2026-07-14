import { useState } from 'react';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { INDIAN_STATES, getDistricts } from '../../data/india';

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

interface Props { filters: Record<string,string>; onApply(f: Record<string,string>): void; onClose(): void; }

export default function FilterPanel({ filters, onApply, onClose }: Props) {
  const [local, setLocal] = useState({ ...filters });
  const set = (k: string, v: string) => setLocal(p => ({ ...p, [k]: v }));
  const districts = local.state ? getDistricts(local.state) : [];
  const count = Object.values(local).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-[2000] flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-slide-right">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blood-600" />
            <h3 className="font-display text-lg font-bold text-gray-800">Filter Donors</h3>
            {count > 0 && <span className="bg-blood-600 text-white text-xs font-black px-1.5 py-0.5 rounded-full">{count}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLocal({})} className="text-xs text-gray-400 hover:text-blood-600 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Clear</button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Blood Type</label>
            <div className="flex flex-wrap gap-2">
              {BLOOD_TYPES.map(bt => (
                <button key={bt} onClick={() => set('bloodType', local.bloodType===bt ? '' : bt)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-all ${local.bloodType===bt ? 'bg-blood-600 text-white border-blood-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blood-300'}`}>
                  {bt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gender</label>
            <div className="flex gap-2">
              {['male','female','other'].map(g => (
                <button key={g} onClick={() => set('gender', local.gender===g ? '' : g)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 capitalize transition-all ${local.gender===g ? 'bg-blood-600 text-white border-blood-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">State</label>
            <select value={local.state||''} onChange={e => setLocal(p => ({ ...p, state: e.target.value, district: '' }))} className="input-field">
              <option value="">All States</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {local.state && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">District</label>
              <select value={local.district||''} onChange={e => set('district',e.target.value)} className="input-field">
                <option value="">All Districts</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}

          <div>
            <button onClick={() => set('emergencyAvailable', local.emergencyAvailable==='true' ? '' : 'true')}
              className={`w-full py-3 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-center gap-2 ${local.emergencyAvailable==='true' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'}`}>
              ⚡ Emergency Available Only
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Min Donation Badges: <span className="text-blood-600">{local.minBadges||'0'}</span></label>
            <input type="range" min="0" max="20" value={local.minBadges||'0'} onChange={e => set('minBadges', e.target.value==='0'?'':e.target.value)} className="w-full accent-blood-600" />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <button onClick={() => onApply(local)} className="btn-primary w-full">Apply Filters {count>0 && `(${count} active)`}</button>
        </div>
      </div>
    </div>
  );
}
