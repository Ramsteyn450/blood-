import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Flame, Star, ChevronUp } from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

interface LeaderEntry {
  _id: string;
  name: string;
  bloodType: string;
  badges: number;
  state: string;
  district: string;
}

const RANK_CFG = [
  { Icon: Crown,  color: 'text-amber-500',  bg: 'bg-amber-50  border-amber-200',  label: '1st' },
  { Icon: Medal,  color: 'text-slate-400',  bg: 'bg-slate-50  border-slate-200',  label: '2nd' },
  { Icon: Medal,  color: 'text-amber-700',  bg: 'bg-orange-50 border-orange-200', label: '3rd' },
];

const BLOOD_COLORS: Record<string, string> = {
  'A+':'#e74c3c','A-':'#c0392b','B+':'#e67e22','B-':'#d35400',
  'AB+':'#9b59b6','AB-':'#8e44ad','O+':'#e91e63','O-':'#c2185b',
};

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/users/donors', { params: { sort: 'badges', limit: 50 } });
        const sorted = (data.donors as LeaderEntry[])
          .filter(d => d.badges > 0)
          .sort((a, b) => b.badges - a.badges);
        setLeaders(sorted);
        const idx = sorted.findIndex(d => d._id === user?._id);
        if (idx !== -1) setMyRank(idx + 1);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user]);

  return (
    <div className="max-w-xl mx-auto px-4 py-8 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <Trophy className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">Donor Leaderboard</h1>
          <p className="text-gray-400 text-sm">Top blood donors ranked by donation badges</p>
        </div>
      </div>

      {/* My rank banner */}
      {myRank && (
        <div className="flex items-center gap-3 bg-blood-50 border border-blood-200 rounded-2xl p-4 mb-6">
          <ChevronUp className="w-5 h-5 text-blood-600" />
          <div>
            <p className="text-xs text-blood-500 font-semibold">Your Rank</p>
            <p className="font-display text-xl font-black text-blood-700">#{myRank}</p>
          </div>
          <div className="ml-auto">
            <p className="text-xs text-blood-500 font-semibold">Your Badges</p>
            <p className="font-display text-xl font-black text-blood-700">{user?.badges ?? 0} 🏅</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 skeleton rounded-2xl" />)}
        </div>
      ) : leaders.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="w-12 h-12 text-amber-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">No donations yet</p>
          <p className="text-xs text-gray-400 mt-1">Be the first to earn a badge by completing a donation!</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {leaders.length >= 3 && (
            <div className="flex items-end justify-center gap-3 mb-6">
              {/* 2nd */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blood-400 to-blood-700 flex items-center justify-center text-white font-black text-xl mb-2 border-4 border-slate-300">{leaders[1].name.charAt(0)}</div>
                <p className="text-xs font-bold text-gray-700 text-center truncate max-w-16">{leaders[1].name.split(' ')[0]}</p>
                <span className="badge-blood text-xs">{leaders[1].bloodType}</span>
                <div className="w-16 bg-slate-200 text-slate-700 text-center py-4 rounded-t-xl mt-2 text-xs font-black">{leaders[1].badges}🏅<br/>2nd</div>
              </div>
              {/* 1st */}
              <div className="flex flex-col items-center">
                <Crown className="w-6 h-6 text-amber-500 mb-1 animate-bounce" />
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blood-400 to-blood-700 flex items-center justify-center text-white font-black text-2xl mb-2 border-4 border-amber-400 shadow-lg">{leaders[0].name.charAt(0)}</div>
                <p className="text-xs font-bold text-gray-700 text-center truncate max-w-20">{leaders[0].name.split(' ')[0]}</p>
                <span className="badge-blood text-xs">{leaders[0].bloodType}</span>
                <div className="w-20 bg-amber-400 text-white text-center py-6 rounded-t-xl mt-2 text-xs font-black">{leaders[0].badges}🏅<br/>1st</div>
              </div>
              {/* 3rd */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blood-400 to-blood-700 flex items-center justify-center text-white font-black text-xl mb-2 border-4 border-amber-700">{leaders[2].name.charAt(0)}</div>
                <p className="text-xs font-bold text-gray-700 text-center truncate max-w-16">{leaders[2].name.split(' ')[0]}</p>
                <span className="badge-blood text-xs">{leaders[2].bloodType}</span>
                <div className="w-16 bg-amber-700 text-white text-center py-3 rounded-t-xl mt-2 text-xs font-black">{leaders[2].badges}🏅<br/>3rd</div>
              </div>
            </div>
          )}

          {/* Full List */}
          <div className="space-y-2">
            {leaders.map((donor, idx) => {
              const isMe = donor._id === user?._id;
              const rankCfg = RANK_CFG[idx];
              return (
                <div key={donor._id}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${isMe ? 'bg-blood-50 border-blood-300 shadow-md' : idx < 3 ? `${rankCfg.bg} border` : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                  {/* Rank */}
                  <div className="w-8 text-center flex-shrink-0">
                    {idx < 3
                      ? <rankCfg.Icon className={`w-5 h-5 mx-auto ${rankCfg.color}`} />
                      : <span className="text-sm font-black text-gray-400">#{idx + 1}</span>}
                  </div>
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black flex-shrink-0" style={{ background: BLOOD_COLORS[donor.bloodType] || '#DC143C' }}>
                    {donor.name.charAt(0)}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`font-bold text-sm truncate ${isMe ? 'text-blood-700' : 'text-gray-800'}`}>{donor.name}{isMe && ' (You)'}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="badge-blood">{donor.bloodType}</span>
                      {donor.district && <span className="text-xs text-gray-400">{donor.district}</span>}
                    </div>
                  </div>
                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(donor.badges, 5) }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < donor.badges ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                      ))}
                      {donor.badges > 5 && <span className="text-xs text-amber-600 font-bold">+{donor.badges - 5}</span>}
                    </div>
                    <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                      {donor.badges} 🏅
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {leaders.length === 0 && (
            <div className="text-center py-8">
              <Flame className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No donors with badges yet</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
