import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { User } from '../types';
import { Award, CheckCircle, XCircle, Calendar, Edit, Zap, MapPin, Flag, Heart } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: me } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User|null>(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const isOwn = !id || id === me?._id;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const { data } = await api.get(id ? `/users/profile/${id}` : '/users/profile'); setProfile(data.user); }
      catch { } finally { setLoading(false); }
    })();
  }, [id]);

  const handleReport = async () => {
    if (!reportReason.trim() || !id) return;
    try { await api.post('/reports', { reportedUserId: id, reason: reportReason }); setReportSent(true); setShowReport(false); }
    catch(e) { console.error(e); }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="spinner w-8 h-8" /></div>;
  if (!profile) return <div className="text-center py-16 text-gray-400">User not found</div>;

  const daysLeft = profile.nextEligibleDate ? differenceInDays(new Date(profile.nextEligibleDate), new Date()) : 0;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 page-enter">
      <div className="card overflow-hidden mb-4">
        <div className="h-24 bg-gradient-to-r from-blood-700 via-blood-600 to-red-700 relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage:'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize:'20px 20px' }} />
        </div>
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blood-400 to-blood-800 flex items-center justify-center text-white font-black text-3xl border-4 border-white shadow-xl">{profile.name.charAt(0)}</div>
              {profile.emergencyAvailable && <div className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 rounded-xl flex items-center justify-center border-2 border-white shadow-md"><Zap className="w-3.5 h-3.5 text-white" /></div>}
            </div>
            <div className="flex items-center gap-2 mt-2">
              {isOwn ? (
                <button onClick={() => navigate('/profile/edit')} className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-3 py-2 rounded-xl transition-colors"><Edit className="w-3.5 h-3.5" /> Edit</button>
              ) : (
                <button onClick={() => setShowReport(!showReport)} className="flex items-center gap-1.5 text-gray-400 hover:text-red-600 text-sm px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"><Flag className="w-3.5 h-3.5" /></button>
              )}
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${profile.isBanned?'bg-red-100 text-red-600 border-red-200':profile.eligible?'bg-emerald-100 text-emerald-700 border-emerald-200 animate-glow':'bg-gray-100 text-gray-500 border-gray-200'}`}>
                {profile.isBanned?'Banned':profile.eligible?'● Eligible':'○ Not Eligible'}
              </span>
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold text-gray-800">{profile.name}</h1>
          <p className="text-gray-500 text-sm">{profile.profession}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="badge-blood text-sm">{profile.bloodType}</span>
            <span className="text-xs text-gray-400 capitalize">{profile.gender}</span>
            {profile.state && <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.district?`${profile.district}, `:''}{profile.state}</span>}
          </div>
          {profile.badges > 0 && <div className="mt-3 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2"><Award className="w-5 h-5 text-amber-500" /><span className="font-black text-amber-600 text-lg">{profile.badges}</span><span className="text-xs text-amber-500 font-semibold">donations</span></div>}
          {profile.publicNote && <p className="mt-3 text-sm text-gray-600 italic bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">"{profile.publicNote}"</p>}
          {isOwn && profile.bio && <p className="mt-2 text-sm text-gray-500 leading-relaxed">{profile.bio}</p>}
        </div>
      </div>

      {(profile.lastDonationDate || profile.nextEligibleDate) && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {profile.lastDonationDate && <div className="card p-4"><p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Last Donation</p><p className="font-bold text-gray-800 text-sm">{format(new Date(profile.lastDonationDate),'MMM d, yyyy')}</p></div>}
          {profile.nextEligibleDate && <div className="card p-4"><p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Next Eligible</p><p className={`font-bold text-sm ${daysLeft>0?'text-amber-600':'text-emerald-600'}`}>{daysLeft>0?`${daysLeft} days left`:'Ready now!'}</p></div>}
        </div>
      )}

      <div className="card p-5 mb-4">
        <h3 className="font-bold text-gray-700 text-sm mb-3 uppercase tracking-wide">Eligibility Status</h3>
        <div className="space-y-2">
          {[
            { label:'Weight ≥ 50kg', pass: profile.weight >= 50 },
            { label:'No daily medication', pass: !profile.takesTablets },
            { label:'Not banned', pass: !profile.isBanned },
            { label:'Visible on map', pass: profile.visibleOnMap },
            { label:'Ready to donate', pass: !profile.nextEligibleDate || new Date(profile.nextEligibleDate) <= new Date() },
          ].map(({ label, pass }) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              {pass?<CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />:<XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
              <span className={pass?'text-gray-700':'text-gray-400'}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {showReport && !isOwn && !reportSent && (
        <div className="card p-4 border-red-200 mb-4 animate-fade-in">
          <h3 className="font-bold text-red-700 text-sm mb-3 flex items-center gap-1.5"><Flag className="w-4 h-4" /> Report User</h3>
          <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Describe the issue..." className="input-field resize-none mb-3" rows={3} />
          <div className="flex gap-2">
            <button onClick={() => setShowReport(false)} className="btn-secondary flex-1 text-sm py-2">Cancel</button>
            <button onClick={handleReport} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 rounded-xl transition-colors">Submit Report</button>
          </div>
        </div>
      )}
      {reportSent && <p className="text-center text-emerald-600 text-sm font-semibold py-2">✓ Report submitted. Thank you.</p>}

      {!isOwn && profile.eligible && !profile.isBanned && (
        <button onClick={() => navigate('/map')} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-base">
          <Heart className="w-5 h-5" /> Request Blood Donation
        </button>
      )}
    </div>
  );
}
