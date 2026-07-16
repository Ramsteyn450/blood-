import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { User } from '../types';
import { Award, CheckCircle, XCircle, Calendar, Edit, Zap, MapPin, Flag, Heart, Trophy, Share2, Brain } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import CertificateModal from '../components/shared/CertificateModal';
import EligibilityScreener from '../components/shared/EligibilityScreener';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: me } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User|null>(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showScreener, setShowScreener] = useState(false);
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
  
  // QR Code URL (points to HTML verify page)
  const checkinQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/verify-donor/' + profile._id)}`;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 page-enter space-y-6">
      
      {/* 💳 DIGITAL DONOR CARD & QR (Printable) */}
      {isOwn && (
        <div className="card border-2 border-blood-200 bg-gradient-to-br from-blood-700 via-blood-600 to-red-800 p-5 text-white rounded-3xl relative overflow-hidden shadow-2xl">
          {/* Subtle background circles */}
          <div className="absolute top-[-30px] right-[-30px] w-44 h-44 rounded-full bg-white/5" />
          <div className="absolute bottom-[-40px] left-[-30px] w-36 h-36 rounded-full bg-white/5" />
          
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-white animate-pulse" />
                <span className="font-display tracking-widest font-black uppercase text-sm">LIFEFLOW DONOR ID</span>
              </div>

              <div>
                <p className="text-[10px] text-red-200 font-bold uppercase tracking-wider">Donor Name</p>
                <p className="text-xl font-black truncate max-w-[200px]">{profile.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-red-200 font-bold uppercase tracking-wider">Blood Type</p>
                  <span className="inline-block mt-0.5 font-display text-2xl font-black bg-white text-blood-700 rounded-xl px-3 py-1 shadow-sm">{profile.bloodType}</span>
                </div>
                <div>
                  <p className="text-[10px] text-red-200 font-bold uppercase tracking-wider">Milestone</p>
                  <p className="text-sm font-black mt-1.5 flex items-center gap-1">🏅 {profile.badges} Badges</p>
                </div>
              </div>
            </div>

            {/* QR Code section */}
            <div className="bg-white p-2.5 rounded-2xl shadow-lg flex flex-col items-center justify-center flex-shrink-0 border border-white/20">
              <img src={checkinQrUrl} alt="Donor QR Code" className="w-24 h-24" />
              <p className="text-[8px] text-gray-500 font-bold tracking-widest uppercase mt-1">Scan to Check-in</p>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-red-200 font-semibold">
            <span> Trichy Network Drive</span>
            <span>ID: {profile._id.slice(-6).toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* Main Profile Info */}
      <div className="card overflow-hidden">
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

      {/* Gamification & Share Certificate banner */}
      {isOwn && (
        <div className="card p-5 border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-200 flex-shrink-0">
              <Trophy className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">Donation Milestone Certificate</p>
              <p className="text-xs text-gray-500">Generate your printable donor recognition certificate</p>
            </div>
          </div>
          <button
            onClick={() => setShowCertificate(true)}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
          >
            <Share2 className="w-3.5 h-3.5" /> Claim Certificate
          </button>
        </div>
      )}

      {/* Screener helper trigger */}
      {isOwn && (
        <div className="card p-5 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-200 flex-shrink-0">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">AI Eligibility Pre-Screener</p>
              <p className="text-xs text-gray-500">Quickly verify your donation criteria before visiting</p>
            </div>
          </div>
          <button
            onClick={() => setShowScreener(!showScreener)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
          >
            Check eligibility
          </button>
        </div>
      )}

      {/* Pre-screener Component overlay */}
      {showScreener && <EligibilityScreener onClose={() => setShowScreener(false)} />}

      {(profile.lastDonationDate || profile.nextEligibleDate) && (
        <div className="grid grid-cols-2 gap-3">
          {profile.lastDonationDate && <div className="card p-4"><p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Last Donation</p><p className="font-bold text-gray-800 text-sm">{format(new Date(profile.lastDonationDate),'MMM d, yyyy')}</p></div>}
          {profile.nextEligibleDate && <div className="card p-4"><p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Next Eligible</p><p className={`font-bold text-sm ${daysLeft>0?'text-amber-600':'text-emerald-600'}`}>{daysLeft>0?`${daysLeft} days left`:'Ready now!'}</p></div>}
        </div>
      )}

      {/* Badges Milestones list */}
      {isOwn && (
        <div className="card p-5">
          <h3 className="font-bold text-gray-700 text-sm mb-4 uppercase tracking-wide">Donation Milestones</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { title: 'First Drop', req: 1, desc: '1st Donation completed', color: 'from-orange-400 to-red-500' },
              { title: 'Life Saver', req: 5, desc: '5 Donations completed', color: 'from-amber-400 to-orange-500' },
              { title: 'Blood Hero', req: 10, desc: '10+ Donations completed', color: 'from-purple-500 to-indigo-600' }
            ].map(badge => {
              const active = profile.badges >= badge.req;
              return (
                <div key={badge.title} className={`p-4 rounded-2xl border ${active ? 'border-transparent shadow bg-white' : 'border-gray-100 opacity-40 bg-gray-50'}`}>
                  <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-black text-lg ${active ? `bg-gradient-to-br ${badge.color}` : 'bg-gray-200 text-gray-400'}`}>
                    🏅
                  </div>
                  <p className="text-xs font-black text-gray-800">{badge.title}</p>
                  <p className="text-[10px] text-gray-400 mt-1 leading-tight">{badge.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card p-5">
        <h3 className="font-bold text-gray-700 text-sm mb-3 uppercase tracking-wide">Eligibility Check</h3>
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

      {showCertificate && (
        <CertificateModal
          donorName={profile.name}
          badgesCount={profile.badges}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
}
