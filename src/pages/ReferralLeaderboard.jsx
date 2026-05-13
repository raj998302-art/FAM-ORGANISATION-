import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { ChevronLeft, Users, Trophy, Gift } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';

export default function ReferralLeaderboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const cu = await apiClient.auth.me();
      setUser(cu);
      const profiles = await apiClient.entities.UserProfile.list('-total_referred', 50).catch(() => []);
      const sorted = (Array.isArray(profiles) ? profiles : [])
        .filter(p => (p.total_referred || 0) > 0)
        .sort((a, b) => (b.total_referred || 0) - (a.total_referred || 0));
      setLeaders(sorted);
      const idx = sorted.findIndex(p => p.user_email === cu.email);
      if (idx >= 0) {
        setMyRank(idx + 1);
        setMyStats(sorted[idx]);
      } else {
        // Load own profile even if not in top list
        const own = await apiClient.entities.UserProfile.filter({ user_email: cu.email }).catch(() => []);
        if (own[0]) setMyStats(own[0]);
      }
    } catch {}
    finally { setLoading(false); }
  };

  if (loading) return <LoadingScreen message="Loading referral leaderboard..." />;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="p-2"><ChevronLeft className="w-6 h-6 text-slate-400" /></button>
        <NeonText color="green" size="2xl" className="flex items-center gap-2">
          <Users className="w-6 h-6" /> REFERRAL LEADERBOARD
        </NeonText>
      </div>

      {/* My stats banner */}
      {myStats && (
        <GlowCard glowColor="green" className="p-4 mb-5">
          <div className="flex items-center gap-4">
            <AppEmoji name="team" size={36} />
            <div className="flex-1">
              <p className="text-green-400 font-bold">Your Referral Stats</p>
              <div className="flex gap-4 mt-1 text-sm">
                <span className="text-slate-300">Friends: <strong className="text-white">{myStats.total_referred || 0}</strong></span>
                <span className="text-slate-300">Earned: <strong className="text-green-400">₹{myStats.referral_earnings || 0}</strong></span>
                {myRank && <span className="text-slate-300">Rank: <strong className="text-yellow-400">#{myRank}</strong></span>}
              </div>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-xs">Your Code</p>
              <p className="text-white font-black text-lg tracking-widest">{myStats.referral_code || '—'}</p>
            </div>
          </div>
        </GlowCard>
      )}

      {/* Rewards info */}
      <GlowCard glowColor="cyan" className="p-4 mb-5">
        <p className="text-cyan-400 font-bold text-sm mb-2 flex items-center gap-2"><Gift className="w-4 h-4" /> Referral Rewards</p>
        <div className="space-y-1 text-xs text-slate-400">
          <div className="flex items-center gap-2"><span className="text-yellow-400 font-bold">#1</span> Top referrer gets ₹500 bonus monthly</div>
          <div className="flex items-center gap-2"><span className="text-slate-400 font-bold">#2</span> ₹250 bonus monthly</div>
          <div className="flex items-center gap-2"><span className="text-slate-500 font-bold">#3</span> ₹100 bonus monthly</div>
          <div className="flex items-center gap-2"><span className="text-green-400 font-bold">All</span> ₹10 per successful referral</div>
        </div>
      </GlowCard>

      {/* Leaderboard */}
      {leaders.length === 0 ? (
        <div className="text-center py-16">
          <AppEmoji name="team" size={64} className="mx-auto mb-4 opacity-30" />
          <p className="text-slate-400">No referrals yet — be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((p, i) => {
            const isMe = p.user_email === user?.email;
            const rank = i + 1;
            return (
              <motion.div key={p.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <GlowCard glowColor={rank === 1 ? 'gold' : rank === 2 ? 'cyan' : rank === 3 ? 'orange' : isMe ? 'green' : 'cyan'}
                  className={`p-4 ${isMe ? 'ring-1 ring-green-500/50' : ''}`}>
                  <div className="flex items-center gap-4">
                    <AppEmoji name={rank === 1 ? 'gold1st' : rank === 2 ? 'silver2nd' : rank === 3 ? 'bronze3rd' : 'team'} size={28} />
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate ${isMe ? 'text-green-400' : 'text-white'}`}>
                        {p.username || p.user_email?.split('@')[0] || 'Player'}
                        {isMe && <span className="text-xs text-green-500 ml-2">(You)</span>}
                      </p>
                      <p className="text-slate-500 text-xs">{p.total_referred || 0} friends referred</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-black text-lg">₹{p.referral_earnings || 0}</p>
                      <p className="text-slate-500 text-xs">earned</p>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
