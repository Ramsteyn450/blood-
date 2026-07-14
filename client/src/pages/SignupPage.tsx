import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Droplets, AlertCircle, CheckCircle, User, Heart, MapPin } from 'lucide-react';
import { INDIAN_STATES, getDistricts } from '../data/india';

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const STEPS = [{ id:1, label:'Account', icon:User }, { id:2, label:'Medical', icon:Heart }, { id:3, label:'Location', icon:MapPin }];

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', bloodType:'O+', gender:'male', profession:'', weight:'', takesTablets:'no', state:'', district:'', bio:'' });
  const { signup, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const districts = form.state ? getDistricts(form.state) : [];
  const upd = (k: string, v: string) => { clearError(); setForm(p => ({ ...p, [k]: v, ...(k==='state' ? { district:'' } : {}) })); };
  const isEligible = parseFloat(form.weight) >= 50 && form.takesTablets === 'no';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await signup({ ...form, weight: parseFloat(form.weight), takesTablets: form.takesTablets === 'yes' });
      navigate('/map');
    } catch { }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-blood-900 to-red-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur">
            <Droplets className="w-9 h-9 text-red-300 animate-heartbeat" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Join LifeFlow</h1>
        </div>

        <div className="flex items-center justify-center gap-2 mb-5">
          {STEPS.map(({ id, label, icon: Icon }, idx) => (
            <div key={id} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${id < step ? 'bg-emerald-500 text-white' : id === step ? 'bg-white text-blood-700 shadow-md' : 'bg-white/20 text-white/50'}`}>
                <Icon className="w-3 h-3" />{label}
              </div>
              {idx < STEPS.length - 1 && <div className={`w-6 h-0.5 rounded ${id < step ? 'bg-emerald-400' : 'bg-white/20'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-7">
          {error && <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}

          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4 animate-fade-in">
              <h2 className="font-bold text-gray-800 text-lg mb-3">Account Details</h2>
              <div><label className="block text-sm font-semibold text-gray-600 mb-1.5">Full Name</label><input type="text" value={form.name} onChange={e => upd('name',e.target.value)} placeholder="Ravi Kumar" className="input-field" required /></div>
              <div><label className="block text-sm font-semibold text-gray-600 mb-1.5">Email</label><input type="email" value={form.email} onChange={e => upd('email',e.target.value)} placeholder="ravi@email.com" className="input-field" required /></div>
              <div><label className="block text-sm font-semibold text-gray-600 mb-1.5">Password</label><input type="password" value={form.password} onChange={e => upd('password',e.target.value)} placeholder="Min. 6 characters" className="input-field" required minLength={6} /></div>
              <div><label className="block text-sm font-semibold text-gray-600 mb-1.5">Phone Number</label><input type="tel" value={form.phone} onChange={e => upd('phone',e.target.value)} placeholder="+91 9876543210" className="input-field" required /></div>
              <button type="submit" className="btn-primary w-full py-3">Continue →</button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-4 animate-fade-in">
              <h2 className="font-bold text-gray-800 text-lg mb-3">Medical Profile</h2>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold text-gray-600 mb-1.5">Blood Type</label><select value={form.bloodType} onChange={e => upd('bloodType',e.target.value)} className="input-field">{BLOOD_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                <div><label className="block text-sm font-semibold text-gray-600 mb-1.5">Gender</label><select value={form.gender} onChange={e => upd('gender',e.target.value)} className="input-field"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-600 mb-1.5">Profession</label><input type="text" value={form.profession} onChange={e => upd('profession',e.target.value)} placeholder="e.g. Software Engineer" className="input-field" required /></div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Weight (kg)</label>
                <input type="number" value={form.weight} onChange={e => upd('weight',e.target.value)} placeholder="e.g. 65" min="1" max="300" step="0.1" className="input-field" required />
                {form.weight && parseFloat(form.weight) < 50 && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Must be at least 50kg to donate</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Do you take daily tablets/medication?</label>
                <select value={form.takesTablets} onChange={e => upd('takesTablets',e.target.value)} className="input-field">
                  <option value="no">No — I don't take daily medication</option>
                  <option value="yes">Yes — I take daily medication</option>
                </select>
                {form.takesTablets === 'yes' && <p className="text-amber-600 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Daily medication makes you ineligible to donate</p>}
              </div>
              {form.weight && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-semibold border ${isEligible ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {isEligible ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {isEligible ? 'You are eligible to donate blood!' : 'You can register but won\'t appear as active donor'}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">← Back</button>
                <button type="submit" className="btn-primary flex-1 py-3">Continue →</button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
              <h2 className="font-bold text-gray-800 text-lg mb-3">Location & Profile</h2>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">State</label>
                <select value={form.state} onChange={e => upd('state',e.target.value)} className="input-field">
                  <option value="">Select your state (optional)</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {form.state && (
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">District</label>
                  <select value={form.district} onChange={e => upd('district',e.target.value)} className="input-field">
                    <option value="">Select district</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Short Bio (optional)</label>
                <textarea value={form.bio} onChange={e => upd('bio',e.target.value)} placeholder="Tell others why you donate..." className="input-field resize-none" rows={3} maxLength={300} />
                <p className="text-xs text-gray-400 mt-1">{form.bio.length}/300</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1 py-3">← Back</button>
                <button type="submit" disabled={isLoading} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  {isLoading ? <><div className="spinner w-4 h-4" /> Creating...</> : '🩸 Join LifeFlow'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-400 mt-5">Already have an account? <Link to="/login" className="text-blood-700 font-bold hover:text-blood-800">Sign in</Link></p>
        </div>
        <p className="text-center mt-4"><Link to="/" className="text-white/40 hover:text-white/70 text-sm transition-colors">← Back to home</Link></p>
      </div>
    </div>
  );
}
