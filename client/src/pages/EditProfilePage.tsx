import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { INDIAN_STATES, getDistricts } from '../data/india';
import { CheckCircle, AlertCircle, Save, ArrowLeft, Zap, Building, Image } from 'lucide-react';

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

export default function EditProfilePage() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', phone: '', profession: '', weight: '', gender: 'male', bloodType: 'O+',
    takesTablets: 'no', state: '', district: '', bio: '', publicNote: '',
    emergencyAvailable: false, visibleOnMap: true, organizationName: '', avatar: ''
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const districts = form.state ? getDistricts(form.state) : [];
  const isEligible = parseFloat(form.weight) >= 50 && form.takesTablets === 'no';
  const isOrg = user?.role === 'organization';

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        profession: user.profession || '',
        weight: String(user.weight || ''),
        gender: user.gender || 'male',
        bloodType: user.bloodType || 'O+',
        takesTablets: user.takesTablets ? 'yes' : 'no',
        state: user.state || '',
        district: user.district || '',
        bio: user.bio || '',
        publicNote: user.publicNote || '',
        emergencyAvailable: user.emergencyAvailable || false,
        visibleOnMap: user.visibleOnMap !== false,
        organizationName: user.organizationName || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  const upd = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v, ...(k === 'state' ? { district: '' } : {}) }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', {
        ...form,
        weight: parseFloat(form.weight) || 0,
        takesTablets: form.takesTablets === 'yes'
      });
      updateUser(data.user);
      setSaved(true);
      setTimeout(() => { setSaved(false); navigate('/profile'); }, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 page-enter">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/profile')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">Edit Profile</h1>
          <p className="text-gray-400 text-sm">{isOrg ? 'Update organization details' : 'Update your donor information'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* 🏢 ORGANIZATION DETAILS (If Org role) */}
        {isOrg && (
          <div className="card p-5 border-blue-200">
            <h3 className="font-bold text-blue-700 text-sm mb-4 uppercase tracking-wide flex items-center gap-2">
              <Building className="w-4.5 h-4.5" /> Hospital / Blood Bank Details
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5 font-bold">Registered Hospital Name</label>
                <input type="text" value={form.organizationName} onChange={e => upd('organizationName', e.target.value)} placeholder="e.g. Trichy City Hospital" className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5 font-bold flex items-center gap-1">
                  <Image className="w-4 h-4 text-gray-400" /> Hospital Profile Image (URL)
                </label>
                <input type="text" value={form.avatar} onChange={e => upd('avatar', e.target.value)} placeholder="Paste realistic hospital image URL..." className="input-field" />
              </div>
            </div>
          </div>
        )}

        <div className="card p-5">
          <h3 className="font-bold text-gray-700 text-sm mb-4 uppercase tracking-wide">Basic Information</h3>
          <div className="space-y-3">
            <div><label className="block text-sm font-semibold text-gray-600 mb-1.5">Contact Full Name</label><input type="text" value={form.name} onChange={e => upd('name',e.target.value)} className="input-field" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-semibold text-gray-600 mb-1.5">Contact Phone</label><input type="tel" value={form.phone} onChange={e => upd('phone',e.target.value)} className="input-field" /></div>
              <div><label className="block text-sm font-semibold text-gray-600 mb-1.5">Profession</label><input type="text" value={form.profession} onChange={e => upd('profession',e.target.value)} className="input-field" /></div>
            </div>
            <div><label className="block text-sm font-semibold text-gray-600 mb-1.5">Public Note</label><input type="text" value={form.publicNote} onChange={e => upd('publicNote',e.target.value)} placeholder="e.g. Open 24/7 for emergency blood collection!" className="input-field" maxLength={200} /></div>
            <div><label className="block text-sm font-semibold text-gray-600 mb-1.5">Bio / Description</label><textarea value={form.bio} onChange={e => upd('bio',e.target.value)} className="input-field resize-none" rows={3} maxLength={300} /><p className="text-xs text-gray-400 mt-1">{form.bio.length}/300</p></div>
          </div>
        </div>

        {!isOrg && (
          <div className="card p-5">
            <h3 className="font-bold text-gray-700 text-sm mb-4 uppercase tracking-wide">Medical Profile</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-semibold text-gray-600 mb-1.5">Blood Type</label><select value={form.bloodType} onChange={e => upd('bloodType',e.target.value)} className="input-field">{BLOOD_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                <div><label className="block text-sm font-semibold text-gray-600 mb-1.5">Gender</label><select value={form.gender} onChange={e => upd('gender',e.target.value)} className="input-field"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                <div><label className="block text-sm font-semibold text-gray-600 mb-1.5">Weight (kg)</label><input type="number" value={form.weight} onChange={e => upd('weight',e.target.value)} min="1" max="300" step="0.1" className="input-field" /></div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-600 mb-1.5">Daily Medication</label><select value={form.takesTablets} onChange={e => upd('takesTablets',e.target.value)} className="input-field"><option value="no">No — I don't take daily medication</option><option value="yes">Yes — I take daily medication</option></select></div>
              {form.weight && <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-semibold border ${isEligible?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-amber-50 text-amber-700 border-amber-200'}`}>{isEligible?<CheckCircle className="w-4 h-4" />:<AlertCircle className="w-4 h-4" />}{isEligible?'You will appear as eligible on the donor map':'You will not appear on the donor map'}</div>}
            </div>
          </div>
        )}

        <div className="card p-5">
          <h3 className="font-bold text-gray-700 text-sm mb-4 uppercase tracking-wide">Location</h3>
          <div className="space-y-3">
            <div><label className="block text-sm font-semibold text-gray-600 mb-1.5">State</label><select value={form.state} onChange={e => upd('state',e.target.value)} className="input-field"><option value="">Select State</option>{INDIAN_STATES.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
            {form.state && <div><label className="block text-sm font-semibold text-gray-600 mb-1.5">District</label><select value={form.district} onChange={e => upd('district',e.target.value)} className="input-field"><option value="">Select District</option>{districts.map(d=><option key={d} value={d}>{d}</option>)}</select></div>}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-gray-700 text-sm mb-4 uppercase tracking-wide">Settings</h3>
          <div className="space-y-4">
            {[
              { key:'visibleOnMap', label: isOrg ? 'Visible on Hospital Map' : 'Visible on Donor Map', desc:'Others can find your location' },
              { key:'emergencyAvailable', label:'Emergency Available', desc:'Show emergency badge on profile', icon:Zap },
            ].map(({ key, label, desc, icon:Icon }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <div><p className="font-semibold text-gray-700 text-sm flex items-center gap-1.5">{Icon&&<Icon className="w-4 h-4 text-red-500" />}{label}</p><p className="text-xs text-gray-400">{desc}</p></div>
                <div onClick={() => upd(key, !(form as any)[key])}
                  className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${(form as any)[key]?(key==='emergencyAvailable'?'bg-red-600':'bg-blood-600'):'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${(form as any)[key]?'left-6':'left-0.5'}`} />
                </div>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving||saved} className={`btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-base ${saved?'bg-emerald-600 hover:bg-emerald-700':''}`}>
          {saving?<><div className="spinner w-5 h-5" /> Saving...</>:saved?<><CheckCircle className="w-5 h-5" /> Saved!</>:<><Save className="w-5 h-5" /> Save Changes</>}
        </button>
      </form>
    </div>
  );
}
